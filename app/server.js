import 'dotenv/config.js'
import * as cron from 'node-cron'

import express from 'express'
import serveStatic from 'serve-static'
import bodyParser from 'body-parser'

import session from 'express-session'
import { RedisStackStore } from 'connect-redis-stack'
import { createAlbumPurchase, getBCPurchases, addPurchasesToStream } from './purchases/purchaseGenerator.js'
import { config } from './config.js'
import { redis, redis2 } from './om/client.js'
import { accountRouter } from './routers/account-router.js'
import { purchaseRouter } from './routers/purchase-router.js'
import { WebSocketServer } from 'ws';

const TWO_MIN = 1000 * 60 * 2;
const PURCHASE_BALANCE = 'purchase_balance';

/* configure your session store */
const store = new RedisStackStore({
  client: redis,
  prefix: 'redisBank:',
  ttlInSeconds: 3600
})

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.json())
app.use(session({
  store: store,
  resave: false,
  saveUninitialized: false,
  secret: '5UP3r 53Cr37'
}))

// set up a basic web sockect server and a set to hold all the sockets
const wss = new WebSocketServer({ port: 80 })
const sockets = new Set()

// when someone connects, add their socket to the set of all sockets
// and remove them if they disconnect
wss.on('connection', socket => {
  sockets.add(socket)
  socket.on('close', () => sockets.delete(socket))
})

const streamKey = 'purchases'
let currentId = '$'

cron.schedule('*/60 * * * * *', async () => {
  console.log('60 second cronjob called')
  console.log('BC pull called')
  // This loads fresh purchases into stream
  addPurchasesToStream()
});


// read from the stream create a JSON object then send to UI
cron.schedule('*/10 * * * * *', async () => {
  console.log('10 second cronjob activated')
  const result = await redis2.xRead({ key: streamKey, id: currentId }, { COUNT: 1, BLOCK: TWO_MIN });
  // pull the values for the event out of the result
  const [ { messages } ] = result
  const [ { id, message } ] = messages
  const event = { ...message }
  const balance = await redis.get(PURCHASE_BALANCE)
  event.balance = balance
  console.log(event.artist_name)
  // create Redis JSON
  createAlbumPurchase(event)

  // send to UI
  sockets.forEach(socket => socket.send(JSON.stringify(event)))

  // update the current id so we get the next event next time
  currentId = id
});

app.use(serveStatic('static', { index: ['auth-login.html'] }))

/* bring in some routers */
app.use('/account', accountRouter)
app.use('/transaction', purchaseRouter)

/* websocket poll response */
app.get('/api/config/ws', (req, res) => {
  res.json({"protocol":"ws","host":"localhost", "port": "80", "endpoint":"/websocket"})
})

// prime the stream "pump"
app.get('/bc', async (req, res) => {
  addPurchasesToStream()
})

app.post('/perform_login', (req, res) => {
  let session = req.session
  console.log(session)
  if(req.body.username == 'bob' &&
    req.body.password == 'foobared') {
      session=req.session;
      session.userid=req.body.username;
      res.redirect('/index.html')
  } else {
    res.redirect('/auth-login.html')
  }
})

/* start the server */
app.listen(config.expressPort, () => console.log("Listening on port", config.expressPort))
