import { redis } from '../om/client.js'
import { purchaseRepository } from '../om/purchase-repository.js'
import * as source from './transaction_sources.js'
import { createAmount, getRandom, replacer } from './utilities.js'

const TRANSACTIONS_STREAM = "transactions"
const BALANCE_TS = 'balance_ts';
const SORTED_SET_KEY = 'bigspenders';
const TRIM = {
  strategy: 'MAXLEN', // Trim by length.
  strategyModifier: '~', // Approximate trimming.
  threshold: 100 // Retain around 100 entries.
}
let balance = 100000.00;

const streamPurchase = async (transaction) => {
  /* convert all numbers to strings */
  const preparedTransaction = JSON.parse(JSON.stringify(transaction, replacer))
  
  const result = await redis.XADD( TRANSACTIONS_STREAM, '*', preparedTransaction, { TRIM })

  return result
}

const createTransactionAmount = (vendor, random) => {

  let amount = createAmount()
  balance += amount
  balance = parseFloat(balance.toFixed(2))

  redis.ts.add(BALANCE_TS, '*', balance, {'DUPLICATE_POLICY':'first' })
  redis.zIncrBy(SORTED_SET_KEY, (amount * -1), vendor)

  return amount
}

export const createBankTransaction = async () => {
  let vendorsList = source.source
  const random = getRandom()
  const vendor = vendorsList[random % vendorsList.length]
  
  const amount = createTransactionAmount(vendor.fromAccountName, random)
  const transaction = {
    id: random * random,
    fromAccount: Math.floor((random / 2) * 3).toString(),
    fromAccountName: vendor.fromAccountName,
    toAccount: '1580783161',
    toAccountName: 'bob',
    amount: amount,
    description: vendor.description,
    transactionDate: new Date(),
    transactionType: vendor.type,
    balanceAfter: balance
  }
  
  const purchaseTransaction = await purchaseTransactionRepository.save(transaction)
  streampurchaseTransaction(purchaseTransaction)
  return purchaseTransaction
}
