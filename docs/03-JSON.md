# Using JSON #

Note, this step and all the following steps in the tutorial assume you have followed the instructions in the `Setup` section and have the application running locally.

Redis Stack supports the [JSON](https://redis.io/docs/stack/json/) data type. This provides a great way to store more structured and nested data in Redis. In addition, Redis Stack provides a [Search and Query engine](https://redis.io/docs/interact/search-and-query/) that enables indexing, full-text search, vector similarity search, and other aggregate queries on JSON documents and Hashes.

There are a few notable [JSON commands](https://redis.io/commands/?group=json) supported in Redis, let's try them out using the Beats By Redis data.

## Getting and Setting JSON ##

Let's store a purchase in JSON using the [JSON.SET](https://redis.io/commands/json.set/) command:

```redis JSON.SET a purchase
JSON.SET "purchase:Chastity Belt.1691424127.9802382" $ '{"utc_date":1691424127,"artist_name":"Chastity Belt","item_type":"a","item_description":"The Process (Jenn Champion Remix)","album_title":"The Process (Jenn Champion Remix)","slug_type":"a","track_album_slug_text":"null","currency":"USD","amount_paid":1,"item_price":1,"amount_paid_usd":1,"country":"United States","art_id":"589692562","releases":"null","package_image_id":"null","url":"//chastity-belt.bandcamp.com/album/the-process-jenn-champion-remix","country_code":"us","amount_paid_fmt":"$1","art_url":"https://f4.bcbits.com/img/a0589692562_7.jpg","utc_date_raw":1691424127.9802382}'
```

Note that the JSON.SET command takes a JSON string. Since JSON strings are full of double quotes, it is much easier to use single quotes when providing this string rather than escaping all of the quotes within the JSON itself. Looking at the key, `"purchase:Chastity Belt.1691424127.9802382"`, note that we use double quotes here because there is a space in the key. Spaces are totally fine as Redis keys, but make sure you use quotes to surround the key.

Now, let's get our JSON string using [JSON.GET](https://redis.io/commands/json.get/):

```redis JSON.GET a purchase
JSON.GET "purchase:Chastity Belt.1691424127.9802382"
```

We can get individual properties from our JSON document too. Just provide the path to the property you want to get in [JSONPath](https://redis.io/docs/stack/json/path/) syntax:

```redis JSON.GET artist_name
JSON.GET "purchase:Chastity Belt.1691424127.9802382" $.artist_name
```
Note that a JSON array is returned. This can seem annoying, but since a JSONPath query might return multiple items, Redis needs to return arrays. For example, let's say we have a JSON document in Redis that looks like this:

```json
{
  "purchases": [
    { "artist_name": "Justin Castilla", "utc_date": 1691424127 },
    { "artist_name": "Guy Royse", "utc_date": 1691425127  },
    { "artist_name": "Will Johnston", "utc_date": 1691524127  }
  ]
}
```

If we queried it with a JSONPath of `$..artist_name`—which would return any property in the entire JSON document with the name of `artist_name`—we would get back an array of values.

Let's go ahead and try this out. Set the following JSON:

```redis Create purchases
JSON.SET purchases:test:1234 $ '{"purchases":[{"artist_name":"Justin Castilla","utc_date":1691424127},{"artist_name":"Guy Royse","utc_date":1691425127},{"artist_name":"Will Johnston","utc_date":1691524127}]}'
```

And let's query it with the aforementioned query:

```redis Get $..artist_name
JSON.GET purchases:test:1234 $..artist_name
```

That array is kinda handy now.

Of course, you can query arrays and objects as well:

```redis Query arrays and objects
JSON.GET purchases:test:1234 $.purchases
JSON.GET purchases:test:1234 $.purchases[0]
```

You can also get multiple properties by providing multiple paths:

```redis Get multiple properties
JSON.GET purchases:test:1234 $..artist_name $..utc_date
```

Note that when you provide multiple paths, you get back an object with each of your queries as property names. The values in those properties are the arrays from that query.

That's plenty to get you started with JSON. There are [lots of additional commands](https://redis.io/commands/?group=json) to manipulate JSON documents in Redis. I encourage you to play around with them.
