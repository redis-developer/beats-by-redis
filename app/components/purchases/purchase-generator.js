import { redis } from '../../om/client.js';

const SORTED_SET_KEY = 'top-sellers';

async function createPurchaseAmount(artist_name, amount_paid_usd) {
  await redis.zIncrBy(SORTED_SET_KEY, amount_paid_usd, artist_name);

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
  const purchaseJSON = await redis.json.set(artistKey, '$', purchase);

  await createPurchaseAmount(purchase.artist_name, purchase.amount_paid_usd);
  return purchaseJSON;
}

export { createAlbumPurchase };
