import { Router } from 'express';
import { redis } from '../om/client.js';
import { purchaseRepository } from '../om/purchase-repository.js';

export const purchaseRouter = Router();

const ONE_DAY = 1000 * 60 * 60 * 24;
const SALES_TS = 'sales_ts';
const SORTED_SET_KEY = 'bigspenders';

/* fetch all transactions up to an hour ago */
purchaseRouter.get('/balance', async (req, res) => {
  const balance = await redis.ts.range(
    SALES_TS,
    Date.now() - ONE_DAY,
    Date.now(),
  );

  let balancePayload = balance.map((entry) => {
    return {
      x: entry.timestamp,
      y: entry.value,
    };
  });
  res.send(balancePayload);
});

/* fetch top 5 biggest spenders */
purchaseRouter.get('/biggestspenders', async (req, res) => {
  const range = await redis.zRangeWithScores(SORTED_SET_KEY, -5, -1);
  let series = [];
  let labels = [];

  range.slice(0, 5).forEach((spender) => {
    series.push(parseFloat(spender.score.toFixed(2)));
    labels.push(spender.value);
  });

  res.send({ series, labels });
});

purchaseRouter.get('/search', async (req, res) => {
  const term = req.query.term;
  let results;

  if (term.length >= 3) {
    results = await purchaseRepository
      .search()
      .where('artist_name')
      .matches(term)
      .or('album_title')
      .matches(term)
      // .or('transactionType').equals(term)
      .return.all({ pageSize: 1000 });
  }
  res.send(results);
});

/* return ten most recent transactions */
purchaseRouter.get('/purchases', async (req, res) => {
  const purchases = await purchaseRepository
    .search()
    .sortBy('utc_date', 'DESC')
    .return.all({ pageSize: 10 });
  res.send(purchases.slice(0, 10));
});
