import { redis } from '../../om/client.js';

const SORTED_SET_KEY = 'top-sellers';

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

  return purchaseJSON;
}

export { createAlbumPurchase };
