# Using Streams

Note, this step and all the following steps in the tutorial assume you have followed the instructions in the `Installation` section and have the application running locally.

When you first start Beats-By-Redis with an empty database, new purchases will begin streaming in immediately. You might wonder how this happens, so let's break it down.

## Adding Events to a Stream

The public Bandcamp Sales API is not a stream-based API but if you look at the [Bandcamp homepage](https://bandcamp.com) you will see a "Selling Right Now" section that shows you purchases as they come in. To provide that kind of functionality in our app, we poll the Bandcamp API and then simulate a stream by adding each sale to Redis Streams and delaying posting the next sale by taking the time difference between sales. You can see the logic for this in `app/components/purchases/purchase-stream.js`:

```javascript
for (let sale of events) {
    for (let purchase of sale.items) {
        purchase.utc_date_raw = purchase.utc_date;
        await redis.xAdd(
            PURCHASE_STREAM,
            '*',
            JSON.parse(JSON.stringify(purchase, replacer)),
            { TRIM }
        );
    }

    const timeDiff = sale.utc_date - lastSale;

    if (lastSale > 0) {
        await wait(Math.round(timeDiff * 1000));
    }

    lastSale = sale.utc_date;
}
```

You will notice we are using the [XADD](https://redis.io/commands/xadd/) command to add purchases to a stream. Let's look at the command:

```redis XADD to stream
XADD purchases MAXLEN ~ 100 * "utc_date" "1691449579.7615602" "artist_name" "Dead Lincoln" "item_type" "a" "item_description" "all through these hills" "album_title" "null" "slug_type" "a" "track_album_slug_text" "null" "currency" "USD" "amount_paid" "9" "item_price" "0" "amount_paid_usd" "9" "country" "United States" "art_id" "1574796345" "releases" "null" "package_image_id" "null" "url" "//deadlincoln.bandcamp.com/album/all-through-these-hills" "country_code" "us" "amount_paid_fmt" "$9" "amount_over_fmt" "$9" "art_url" "https://f4.bcbits.com/img/a1574796345_7.jpg" "utc_date_raw" "1691449579.7615602"
```

What the command above does is add a new message (...) to the `purchases` stream, and also instruct Redis to keep the stream at a maximum of 100 entries. So Redis will automatically evict older entries. The `*` tells Redis to auto-generate an ID. The `...` is the message itself, which in our case is the purchase object. XADD will return the ID of the message that was just added.

## Reading Events

You read events from a stream with the [XREAD](https://redis.io/commands/xread/) command. XREAD actually does quiet a bit. In its simplest form, it returns all of the events _after_ a particular key. Let's get everything since the start of the stream. You will need to paste this into the CLI in RedisInsight, since the workbench will not allow you to run it:

```bash
XREAD STREAMS purchases 0-0
```

The result should resemble the following:

```bash
1) 1) "purchases"
   2) 1) 1) "1691183512147-0"
         2) 1) "utc_date"
            2) "1691183338.6641014"
            3) "artist_name"
            4) "John Garner / Simon Roth"
            5) "item_type"
            6) "a"
            7) "item_description"
            8) "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            9) "album_title"
            10) "null"
            11) "slug_type"
            12) "a"
            13) "track_album_slug_text"
            14) "null"
            15) "currency"
            16) "GBP"
            17) "amount_paid"
            18) "3"
            19) "item_price"
            20) "3"
            21) "amount_paid_usd"
            22) "3.82"
            23) "country"
            24) "United Kingdom"
            25) "art_id"
            26) "4066728182"
            27) "releases"
            28) "null"
            29) "package_image_id"
            30) "null"
            31) "url"
            32) "//wormholeworld.bandcamp.com/album/abcdefghijklmnopqrstuvwxyz"
            33) "country_code"
            34) "gb"
            35) "amount_paid_fmt"
            36) "\xc2\xa33"
            37) "art_url"
            38) "https://f4.bcbits.com/img/a4066728182_7.jpg"
            39) "utc_date_raw"
            40) "1691183338.6641014"
...
      105) 1) "1691183550823-0"
         2) 1) "utc_date"
            2) "1691183367.5650349"
            3) "artist_name"
            4) "Wladimir Carrasco"
            5) "item_type"
            6) "a"
            7) "item_description"
            8) "M\xc3\xbasica para Vihuela de Mano"
            9) "album_title"
            10) "null"
            11) "slug_type"
            12) "a"
            13) "track_album_slug_text"
            14) "null"
            15) "currency"
            16) "USD"
            17) "amount_paid"
            18) "6"
            19) "item_price"
            20) "0"
            21) "amount_paid_usd"
            22) "6"
            23) "country"
            24) "Austria"
            25) "art_id"
            26) "2134536483"
            27) "releases"
            28) "null"
            29) "package_image_id"
            30) "null"
            31) "url"
            32) "//wladimircarrasco.bandcamp.com/album/m-sica-para-vihuela-de-mano"
            33) "country_code"
            34) "at"
            35) "amount_paid_fmt"
            36) "$6"
            37) "amount_over_fmt"
            38) "$6"
            39) "art_url"
            40) "https://f4.bcbits.com/img/a2134536483_7.jpg"
            41) "utc_date_raw"
            42) "1691183367.5650349"
```

Your `XREAD` will look different than above, since your data will be different.

## Waiting for Events

In the `app/components/purchases/purchase-stream.js` file in code you will find a `listenForPurchases` function. This function sets up a stream group and then listens for messages from the `purchases` stream using the [XREAD](https://redis.io/commands/xread/) command:

```javascript
const results = await redisStreamClient.xRead(
    commandOptions({
        isolated: true,
    }),
    {
        key: STREAM_KEY,
        id: '$',
    },
    {
        COUNT: MAX_MESSAGES,
        BLOCK: BLOCK_MILLISECONDS,
    }
);
```

The `id: '$'` tells Redis to start reading from the end of the stream. The `BLOCK` option tells Redis to block for a certain number of milliseconds waiting for new messages. If no new messages are received, Redis will return an empty array. If new messages are received, they will be returned in the array up to the `COUNT` specified.
