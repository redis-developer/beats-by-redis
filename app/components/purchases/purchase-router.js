import { Router } from 'express';
import {
  purchaseHistory,
  topSellers,
  search,
  recentPurchases,
} from './purchase-queries.js';

export const router = Router();

/* fetch all transactions up to an hour ago */
router.get('/history', async (req, res) => {
  res.send(await purchaseHistory());
});

/* return ten most recent transactions */
router.get('/purchases', async (req, res) => {
    res.send(await recentPurchases());
});
