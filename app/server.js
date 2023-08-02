import 'dotenv/config.js';
import * as cron from 'node-cron';

import express from 'express';
import bodyParser from 'body-parser';

import session from 'express-session';
import { RedisStackStore } from 'connect-redis-stack';
import { config } from './config.js';
import { redis, redis2 } from './om/client.js';
import * as account from './components/account/index.js';
import * as purchase from './components/purchases/index.js';
import { WebSocketServer } from 'ws';

const TWO_MIN = 1000 * 60 * 2;
const PURCHASE_BALANCE = 'purchase_balance';

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
  purchase.generator.addPurchasesToStream();
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
  purchase.generator.createAlbumPurchase(event);

  // send to UI
  sockets.forEach((socket) => socket.send(JSON.stringify(event)));

  // update the current id so we get the next event next time
  currentId = id;
});

app.use('/login', express.static('static', { index: 'login.html' }));
app.use('/register', express.static('static', { index: 'register.html' }));

/* configure your session store */
const store = new RedisStackStore({
  client: redis,
  prefix: 'session:',
  ttlInSeconds: 3600,
});

app.use(
  session({
    store: store,
    resave: false,
    saveUninitialized: false,
    secret: config.session.SECRET,
  }),
);

/* bring in some routers */
app.use('/account', account.router);
app.use('/purchase', purchase.router);

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
  const result = purchase.generator.addPurchasesToStream();
  res.send(result);
});

async function setupData() {
  const haveTs = await redis.EXISTS('sales_ts');

  if (!haveTs) {
    await redis.ts.create('sales_ts', { DUPLICATE_POLICY: 'FIRST' });
  }

  purchase.repositories.purchase.createIndex();
  account.repositories.account.createIndex();
  account.repositories.user.createIndex();
}

setupData();

app.get(
  '/reset',
  account.middleware.getUserFromSession,
  account.middleware.requireUserForApi,
  (_req, res) => {
    redis.flushDb();
    redis.set('purchase_balance', 0);
    res.json({ message: 'Database reset successfully' });
    setupData();
  },
);

function isIndex(url) {
  return url === '' || url === '/' || url === '/index.html';
}

app.use(
  '/',
  (req, res, next) => {
    if (isIndex(req.url)) {
      account.middleware.getUserFromSession(req, res, next);
      return;
    }
    next();
  },
  (req, res, next) => {
    if (isIndex(req.url) && !req.user) {
      res.redirect('/login');
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
