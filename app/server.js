import 'dotenv/config.js';
import * as cron from 'node-cron';

import express from 'express';
import bodyParser from 'body-parser';

import session from 'express-session';
import { RedisStackStore } from 'connect-redis-stack';
import {
  createAlbumPurchase,
  addPurchasesToStream,
} from './purchases/purchaseGenerator.js';
import { config } from './config.js';
import { redis, redis2 } from './om/client.js';
import { accountRouter } from './routers/account-router.js';
import { purchaseRouter } from './routers/purchase-router.js';
import { WebSocketServer } from 'ws';
import { purchaseRepository } from './om/purchase-repository.js';
import { authRouter } from './routers/auth-router.js';
import { getUserWithToken } from './auth/account.js';

const TWO_MIN = 1000 * 60 * 2;
const PURCHASE_BALANCE = 'purchase_balance';

/* configure your session store */
const store = new RedisStackStore({
  client: redis,
  prefix: 'session:',
  ttlInSeconds: 3600,
});

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// set up a basic web sockect server and a set to hold all the sockets
const wss = new WebSocketServer({ port: 80 });
const sockets = new Set();

// when someone connects, add their socket to the set of all sockets
// and remove them if they disconnect
wss.on('connection', (socket) => {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
});

const streamKey = 'purchases';
let currentId = '$';

cron.schedule('*/60 * * * * *', async () => {
  // This loads fresh purchases into stream
  addPurchasesToStream();
});

// read from the stream create a JSON object then send to UI
cron.schedule('*/5 * * * * *', async () => {
  const result = await redis2.xRead(
    { key: streamKey, id: currentId },
    { COUNT: 1, BLOCK: TWO_MIN },
  );
  // pull the values for the event out of the result
  const [{ messages }] = result;
  const [{ id, message }] = messages;
  const event = { ...message };
  const balance = await redis.get(PURCHASE_BALANCE);
  event.balance = balance;
  // create Redis JSON
  createAlbumPurchase(event);

  // send to UI
  sockets.forEach((socket) => socket.send(JSON.stringify(event)));

  // update the current id so we get the next event next time
  currentId = id;
});

app.use('/auth-login', express.static('static', { index: 'auth-login.html' }));
app.use(
  '/auth-register',
  express.static('static', { index: 'auth-register.html' }),
);

app.use(
  session({
    store: store,
    resave: false,
    saveUninitialized: false,
    secret: '5UP3r 53Cr37',
  }),
);

async function requireUser(req, res, next) {
    if (req.user) {
        next();
        return;
    }

    const user = await getUserWithToken(req.session);

    if (!user) {
      next();
      return;
    }

    req.user = {
      username: user.username,
    };

    next();
}

/* bring in some routers */
app.use('/auth', authRouter);
app.use('/account', accountRouter);
app.use('/purchase', purchaseRouter);

/* websocket poll response */
app.get('/api/config/ws', (req, res) => {
  res.json({
    protocol: 'ws',
    host: 'localhost',
    port: '80',
    endpoint: '/websocket',
  });
});

// prime the stream "pump"
app.get('/bc', async (req, res) => {
  const result = addPurchasesToStream();
  res.send(result);
});

app.get('/reset', (_req, res) => {
  redis.flushDb();
  redis.set('purchase_balance', 0);
  redis.ts.create('sales_ts', { DUPLICATE_POLICY: 'FIRST' });
  res.json({ message: 'Database reset successfully' });
  purchaseRepository.createIndex();
});

app.use(
  '/',
  (req, res, next) => {
    if (req.url === '' || req.url === '/' || req.url === '/index.html') {
        requireUser(req, res, next);
        return;
    }
    next();
  },
  (req, res, next) => {
    if ((req.url === '' || req.url === '/' || req.url === '/index.html') && !req.user) {
        res.redirect('/auth-login');
        return;
    }

    next();
  },
  express.static('static'),
);

/* start the server */
app.listen(config.expressPort, () =>
  console.log('Listening on port', config.expressPort),
);
