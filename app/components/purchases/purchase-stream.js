import cron from 'node-cron';
import { commandOptions } from 'redis';
import { redis, redis2 } from '../../om/client.js';
import { createAlbumPurchase } from './purchase-generator.js';
import { replacer, getPurchases, wait } from './purchase-utilities.js';
import {
  topSellers,
  purchaseHistory,
  recentPurchases,
} from './purchase-queries.js';

const PURCHASE_STREAM = 'purchases';
const SALES_TS = 'sales_ts';
const TRIM = {
  strategy: 'MAXLEN', // Trim by length.
  strategyModifier: '~', // Approximate trimming.
  threshold: 100, // Retain around 100 entries.
};
const STREAM_KEY = 'purchases';
const STREAM_GROUP = `${STREAM_KEY}-group`;
const STREAM_CONSUMER = `${STREAM_KEY}-consumer`;
const MAX_PURCHASE_TRANSACTIONS = 10;
const BLOCK_MILLISECONDS = 1000;

async function streamPurchases() {
  // api call to get purchases
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { end_date, events } = await getPurchases();
    const purchases = events.reduce((acc, e) => {
      return acc.concat(e.items);
    }, []);

    // adds most recent number of purchases into ts
    await redis.ts.add(SALES_TS, '*', purchases.length, {
      DUPLICATE_POLICY: 'FIRST',
    });

    // adds purchases to stream
    let lastSale = 0;
    for (let sale of events) {
      for (let purchase of sale.items) {
        purchase.utc_date_raw = purchase.utc_date;
        await redis.xAdd(
          PURCHASE_STREAM,
          '*',
          JSON.parse(JSON.stringify(purchase, replacer)),
          { TRIM },
        );
      }

      const timeDiff = sale.utc_date - lastSale;

      if (lastSale > 0) {
        await wait(Math.round(timeDiff * 1000));
      }

      lastSale = sale.utc_date;
    }

    const waitForMs = Math.round((end_date + 120) * 1000 - Date.now()) + 3000;
    if (waitForMs > 0) {
      await wait(waitForMs);
    }
  }
}

async function listenForPurchases(sockets) {
  try {
    await redis2.xGroupCreate(STREAM_KEY, STREAM_GROUP, '0', {
      MKSTREAM: true,
    });
    // eslint-disable-next-line no-empty
  } catch (e) {}

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const results = await redis2.xReadGroup(
        commandOptions({
          isolated: true,
        }),
        STREAM_GROUP,
        STREAM_CONSUMER,
        [
          {
            key: STREAM_KEY,
            id: '>',
          },
        ],
        {
          COUNT: MAX_PURCHASE_TRANSACTIONS,
          BLOCK: BLOCK_MILLISECONDS,
        },
      );

      if (!Array.isArray(results) || results.length === 0) {
        continue;
      }

      for (let result of results) {
        // pull the values for the event out of the result
        for (let message of result.messages) {
          const purchase = { ...message.message };
          // create Redis JSON
          await createAlbumPurchase(purchase);

          // acknowledge the message
          await redis2.xAck(STREAM_KEY, STREAM_GROUP, message.id);
        }
      }

      const purchases = await recentPurchases();

      // send to UI
      sockets.forEach((socket) => {
        socket.send(JSON.stringify({ purchases }));
      });
    } catch (e) {
      console.log('xReadGroup error');
      console.log(e);
    }
  }
}

async function initialize(sockets) {
  // Every minute we will update the time series and top sellers
  cron.schedule('*/60 * * * * *', async () => {
    const topSellersData = await topSellers();
    const purchaseHistoryData = await purchaseHistory();

    // send to UI
    sockets.forEach((socket) => {
      socket.send(
        JSON.stringify({
          topSellers: topSellersData,
          purchaseHistory: purchaseHistoryData,
        }),
      );
    });
  });

  // Read in new sales events from Bandcamp and stream them into the app
  streamPurchases();

  // Listen for new stream events, process the data, store in redis, and pass along to the frontend
  listenForPurchases(sockets);
}

export { initialize };
