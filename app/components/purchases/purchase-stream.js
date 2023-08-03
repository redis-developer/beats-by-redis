import { commandOptions } from 'redis';
import { redis, redis2 } from '../../om/client.js';
import { createAlbumPurchase } from './purchase-generator.js';
import { replacer, getPurchases, wait } from './purchase-utilities.js';
import { purchaseRepository } from './purchase-repository.js';

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
const MAX_PURCHASE_TRANSACTIONS = 100;
const BLOCK_MILLISECONDS = 30 * 1000;

async function streamPurchases() {
  // api call to get purchases
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { end_date, events } = await getPurchases();
    const purchases = events.reduce((acc, e) => {
      if (e.event_type === 'sale') {
        acc = acc.concat(e.items);
      }

      return acc;
    }, []);

    // adds most recent number of purchases into ts
    await redis.ts.add(SALES_TS, '*', purchases.length, {
      DUPLICATE_POLICY: 'FIRST',
    });

    // adds purchases to stream
    await Promise.all(
      purchases.map(async (purchase) => {
        purchase.utc_date_raw = purchase.utc_date;

        await redis.xAdd(
          PURCHASE_STREAM,
          '*',
          JSON.parse(JSON.stringify(purchase, replacer)),
          { TRIM },
        );
      }),
    );

    const waitForMs = Math.round((end_date + 60) * 1000 - Date.now()) + 3000;
    await wait(waitForMs);
  }
}

async function listenForPurchases(sockets) {
  try {
    await redis2.xGroupCreate(STREAM_KEY, STREAM_GROUP, '0', {
      MKSTREAM: true,
    });
  } catch (e) {
    console.log(
      `Consumer group ${STREAM_GROUP} already exists in stream ${STREAM_KEY}!`,
    );
  }

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

      const purchases = await purchaseRepository
        .search()
        .sortBy('utc_date_raw', 'DESC')
        .return.page(0, 10);

      // send to UI
      sockets.forEach((socket) => socket.send(JSON.stringify({ purchases })));
    } catch (e) {
      console.log('xReadGroup error');
      console.log(e);
    }
  }
}

async function initialize(sockets) {
  streamPurchases();
  listenForPurchases(sockets);
}

export { initialize };
