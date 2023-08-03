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

/* fetch the 5 top sellers */
router.get('/top-sellers', async (req, res) => {
  res.send(await topSellers());
});

router.get('/search', async (req, res) => {
  const term = req.query.term;
  res.send(await search(term));
});

/* return ten most recent transactions */
router.get('/purchases', async (req, res) => {
    res.send(await recentPurchases());
});
