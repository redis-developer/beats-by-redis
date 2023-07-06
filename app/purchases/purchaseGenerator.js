import { redis } from '../om/client.js'
import { purchaseRepository } from '../om/purchase-repository.js'

import { replacer, getPurchases } from './utilities.js'

const PURCHASE_BALANCE = "purchase_balance"
const PURCHASE_STREAM = "purchases"
const SALES_TS = 'sales_ts';
const SORTED_SET_KEY = 'bigspenders';
const TRIM = {
  strategy: 'MAXLEN', // Trim by length.
  strategyModifier: '~', // Approximate trimming.
  threshold: 100 // Retain around 100 entries.
}

export const getBCPurchases = async () => {
  const bcPayload = await getPurchases()
  return bcPayload
}

export const addPurchasesToStream = async () => {
  // api call to get purchases
  const purchases = await getPurchases()
  console.log(`Number of purchases pulled from Bandcamp: ${purchases.purchases.length}`)
  // adds purchases to stream
  purchases.purchases.forEach(purchase => {
    const preparedPurchase = JSON.parse(JSON.stringify(purchase.items[0], replacer))
    redis.XADD( PURCHASE_STREAM, '*', preparedPurchase, { TRIM })
  })
  // adds most recent number of purchases into ts
  await redis.ts.add(SALES_TS, "*", purchases.purchases.length, {DUPLICATE_POLICY: "FIRST"})
}

const createPurchaseAmount = async (artist_name, amount_paid_usd) => {
  console.log('createPurchaseAmount called')
  let balance = await redis.get(PURCHASE_BALANCE)
  balance = parseInt(balance)

  console.log('amount paid usd: ', amount_paid_usd)
  console.log('balance from redis: ', balance)
  balance += amount_paid_usd

  redis.zIncrBy(
    SORTED_SET_KEY, 
    (amount_paid_usd), 
    artist_name)
  
  redis.set(PURCHASE_BALANCE, balance )

  return amount_paid_usd
}

export const createAlbumPurchase = async (purchase) => {
  /* Grab an artist from the stream. keep track of the entity id */
  console.log('createAlbumPurchase called')
  
  purchase.utc_date = Math.floor(purchase.utc_date)
  purchase.amount_paid = parseInt(purchase.amount_paid)
  purchase.item_price = parseInt(purchase.item_price)
  purchase.amount_paid_usd = parseInt(purchase.amount_paid_usd)
  
  createPurchaseAmount(purchase.artist_name, purchase.amount_paid_usd)
  const purchaseTransaction = await purchaseRepository.save(purchase)
  // streamBankTransaction(bankTransaction)
  console.log('Created purchase transaction!')
  return purchaseTransaction
}