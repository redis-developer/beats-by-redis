# Banking-On-Redis

Banking-On-Redis is a Node.js port of the Java application [Redisbank](https://github.com/Redislabs-Solution-Architects/**redisbank**). 

This repository uses Redis core data structures, Streams, JSON, Search and TimeSeries to build a Node.js Express Redis Reactive application that shows a searchable transaction overview with realtime updates as well as a personal finance management overview with realtime balance and biggest spenders updates. UI in Bootstrap/CSS/Vue.

Features in this demo:

- Redis Streams for the realtime transactions
- Redis TimeSeries for the balance over time
- JSON & Query for searching transactions
- Sorted Sets for the 'biggest spenders'
- JSON for session storage

![Architecture Diagram](./docs/architecture-diagram.png)

## Transaction Generator
The transaction generator creates a randomized banking debit or credit which will reflect on a starting user balance of $100,000.00. Here is a sample transaction:

```javascript
{
  id: 11280657975513370000,
  fromAccount: '5038003617',
  fromAccountName: 'CZ Insurance',
  toAccount: '1580783161',
  toAccountName: undefined,
  amount: -223.28,
  description: 'Monthly health insurance',
  transactionDate: 2023-04-10T22:40:50.395Z,
  transactionType: 'Authorized payment',
  balanceAfter: 99776.72
}
```

 The transaction is saved as a JSON document within Redis. The `balanceAfter` value is recorded in a Timeseries with the key `balance_ts`. The transaction is also added to a stream (`transactions`) as an entry. The sorted set `bigspenders` is also updated - the associated **`fromAccountName`** member within the sorted set is incremented by the transaction amount. Note that this amount can be positive or negative.

## Session Storage
Session storage is also handled through Redis with the package [Connect Redis Stack](https://www.npmjs.com/package/connect-redis-stack). Once logged in, a session JSON object is stored with a TTL (time to live) set to 3600 seconds, or one hour.

## Transactions API
Banking on Redis provides an API for the timeseries chart to track the bank account's balance, a pie chart of the top five biggest spenders, a search endpoint to return specific transactins, and a list of the most recent transactions. A websocket connection provides the most recent transaction, balance, and biggest spenders values every ten seconds. 

### Search API
|||
|--|--|
| Endpoint | `/transaction/search` |
| Code Location | `/routers/transaction-router.js` |
| Query Parameters | term |
| Return value | array of results matching term |  

The search endpoint receives a `term` query parameter from the UI. A Redis Om query for **the** fields `description`, `fromAccountName`, and `accountType` will trigger and return all results.

### Balance API
|||
|--|--|
| Endpoint | `/transaction/balance` |
| Code Location | `/routers/transaction-router.js` |
| Parameters | none |
| Return value | `[{x: timestamp, y: value}, ...]` | 

The balance endpoint returns the range of all values from the timeseries object `balance_ts`. The resulting range is converted to an array of objects with each object containing an `x` property containing the timestamp and a `y` property containing the associated value.  This endpoint supplies the timeseries chart with coordinates to plot a visualization of the balance over time.****

### Biggest Spenders API
|||
|--|--|
| Endpoint | `/transaction//biggestspenders` |
| Code Location | `/routers/transaction-router.js` |
| Parameters | none |
| Return value | `{labels:[...], series:[...] }` | 

The biggest spenders endpoint retrieves all members of the sorted set `bigspenders` that have scores greater than zero. The top five or less are returned to provide the UI pie chart with data. The labels array contains the names of the biggest spenders and the series array contains the numeric values associated with each member name.

### Transactions Websocket
The Websocket connection reads the most recent entry from the `transactions` stream and updates the UI with the resulting update. The websocket event also triggers calls to `/balance` and `/biggestspenders`, which results in a refresh of data for the visualizations.
