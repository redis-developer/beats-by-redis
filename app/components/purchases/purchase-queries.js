import { redis } from '../../om/client.js';
import { purchaseRepository } from './purchase-repository.js';

const ONE_HOUR = 1000 * 60 * 60;
const SALES_TS = 'sales_ts';
const SORTED_SET_KEY = 'bigspenders';

async function purchaseHistory() {
  return redis.ts.range(SALES_TS, Date.now() - ONE_HOUR, Date.now());
}

async function topSellers() {
  const range = await redis.zRangeWithScores(SORTED_SET_KEY, -5, -1);
  let series = [];
  let labels = [];

  range.slice(0, 5).forEach((spender) => {
    series.push(parseFloat(spender.score.toFixed(2)));
    labels.push(spender.value);
  });

  return { series, labels };
}

async function search(term) {
  if (term.length > 3) {
    return purchaseRepository
      .search()
      .where('artist_name')
      .matches(term)
      .or('album_title')
      .matches(term)
      .or('item_description')
      .matches(term)
      .sortBy('utc_date_raw', 'DESC')
      .return.page(0, 10);
  }
}

async function recentPurchases() {
  return purchaseRepository
    .search()
    .sortBy('utc_date_raw', 'DESC')
    .return.page(0, 10);
}

export { purchaseHistory, topSellers, search, recentPurchases };
