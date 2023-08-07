import { redis } from '../../om/client.js';
import { purchaseRepository } from './purchase-repository.js';

const ONE_HOUR = 1000 * 60 * 60;
const SALES_TS = 'sales_ts';
const SORTED_SET_KEY = 'top-sellers';

async function recentPurchases() {
  return purchaseRepository
    .search()
    .sortBy('utc_date_raw', 'DESC')
    .return.page(0, 10);
}

export { recentPurchases };
