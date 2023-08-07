import { Router } from 'express';
import {
  purchaseHistory,
  topSellers,
  search,
  recentPurchases,
} from './purchase-queries.js';

export const router = Router();

/* return ten most recent transactions */
router.get('/purchases', async (req, res) => {
    res.send(await recentPurchases());
});
