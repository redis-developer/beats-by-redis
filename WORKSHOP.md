# Beats By Redis Live Workshop

## Overview

1. Introductions
2. Beats By Redis Overview
3. Bandcamp Overview
4. Redis Data Structures Used
  - Sorted Sets
  - Streams
  - JSON
  - Search
  - Time Series
5. Code/architecture Overview
6. Live Coding
  - Search for purchases
  - Top earners
  - Purchase history
7. RedisInsight
  - Keys browser
  - Index browser
  - Workbench tutorials
8. Expanding the app
  - Triggers and Functions
  - Personalization
    - Artist-specific dashboard
    - Bandcamp rep dashboard
    - Regional dashboard
    - Different time series by month, quarter, year, etc.
9. Q&A

## Live Coding

### Search for purchases

1. Uncomment in `app/static/assets/js/purchases.js`, line 216-232
2. Show the code in `app/components/purchases/purchase-repository.js`
3. In `app/components/purchases/purchase-queries.js` build out the `search` function:

```javascript
async function search(term) { }
```

4. Add the `/search` API endpoint in `app/components/purchases/purchase-router.js`
5. View on frontend

### Top sellers

1. Uncomment in `app/static/assets/js/purchases.js`, line 146-161, 201-211
2. Create `createPurchaseAmount` function in `app/components/purchases/purchase-generator.js`:

```javascript
async function createPurchaseAmount(artist_name, amount_paid_usd) { }
```

3. Add call to `createPurchaseAmount` to the bottom of  `createAlbumPurchase`
4. In `app/components/purchases/purchase-queries.js` build out the `topSellers` function:

```javascript
async function topSellers() { }
```

5. Add the `/top-sellers` API endpoint in `app/components/purchases/purchase-router.js`
6. Add the cron job in `app/components/purchases/purchase-stream.js` in `initialize` to send the top sellers data down to the UI every 60 seconds.
7. View on frontend

### Purchase history

1. Uncomment in `app/static/assets/js/purchases.js`, line 127-144, 187-199
2. In `app/app.js` conditionally create the `sales_ts` in the `setupData` function
3. In `app/components/purchases/purchase-stream.js` add the purchases to the SALES_TS time series in the `streamPurchases` function
4. In `app/components/purchases/purchase-queries.js` build out the `purchaseHistory` function:

```javascript
async function purchaseHistory() { }
```

5. Add the `/history` API endpoint in `app/components/purchases/purchase-router.js`
6. In the cron job in `app/components/purchases/purchase-stream.js` in `initialize`, send the purchase history data down to the UI every 60 seconds.
7. View on frontend
