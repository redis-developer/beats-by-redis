import 'dotenv/config.js';

import express from 'express';
import bodyParser from 'body-parser';
import { WebSocketServer } from 'ws';

import session from 'express-session';
import { RedisStackStore } from 'connect-redis-stack';
import { config } from './config.js';
import { redis } from './om/client.js';
import * as account from './components/account/index.js';
import * as purchase from './components/purchases/index.js';
import * as errorMiddleware from './middleware/error-handling.js';

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

purchase.stream.initialize(sockets);

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

async function setupData() {
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

app.use(errorMiddleware.notFound);
app.use(errorMiddleware.serverError);

export { app };
