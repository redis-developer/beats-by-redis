import { redis } from '../../om/client.js';
import { replacer, getPurchases } from './purchase-utilities.js';

const PURCHASE_BALANCE = 'purchase_balance';
const PURCHASE_STREAM = 'purchases';
const SALES_TS = 'sales_ts';
const SORTED_SET_KEY = 'bigspenders';
const TRIM = {
  strategy: 'MAXLEN', // Trim by length.
  strategyModifier: '~', // Approximate trimming.
  threshold: 100, // Retain around 100 entries.
};

async function getBCPurchases() {
  const bcPayload = await getPurchases();
  return bcPayload;
}

async function addPurchasesToStream() {
  // api call to get purchases
  const purchases = await getPurchases();
  // adds purchases to stream
  purchases.purchases.forEach((purchase) => {
    purchase.utc_date_raw = purchase.utc_date;
    const preparedPurchase = JSON.parse(
      JSON.stringify(purchase.items[0], replacer),
    );
    redis.XADD(PURCHASE_STREAM, '*', preparedPurchase, { TRIM });
  });
  // adds most recent number of purchases into ts
  await redis.ts.add(SALES_TS, '*', purchases.purchases.length, {
    DUPLICATE_POLICY: 'FIRST',
  });
}

async function createPurchaseAmount(artist_name, amount_paid_usd) {
  let balance = await redis.get(PURCHASE_BALANCE);
  balance = parseInt(balance);
  balance += amount_paid_usd;

  redis.zIncrBy(SORTED_SET_KEY, amount_paid_usd, artist_name);

  redis.set(PURCHASE_BALANCE, balance);

  return amount_paid_usd;
}

async function createAlbumPurchase(purchase) {
  /* Grab an artist from the stream. keep track of the entity id */
  purchase.artist_name = purchase.artist_name.replaceAll(':', ';');
  purchase.utc_date_raw = parseFloat(purchase.utc_date);
  purchase.utc_date = Math.floor(purchase.utc_date);
  purchase.amount_paid = parseInt(purchase.amount_paid);
  purchase.item_price = parseInt(purchase.item_price);
  purchase.amount_paid_usd = parseInt(purchase.amount_paid_usd);
  if (purchase.album_title == 'null') {
    purchase.album_title = purchase.item_description;
  }

  const artistKey = `purchase:${purchase.artist_name}.${purchase.utc_date_raw}`;
  const purchaseJSON = redis.json.set(artistKey, '$', purchase);

  createPurchaseAmount(purchase.artist_name, purchase.amount_paid_usd);
  return purchaseJSON;
}

export { getBCPurchases, addPurchasesToStream, createAlbumPurchase };
