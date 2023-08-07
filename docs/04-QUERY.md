# Using Redis for Searching and Querying

Redis Stack adds [indexing and full-text search](https://redis.io/docs/stack/search/) to Redis. You can use it to make your Hashes and JSON documents fully searchable. Searching in Redis is a _really_ big topic and would probably be suitable as a tutorial all its own. We're just going to cover the basics here. You can check out the [full search query syntax](https://redis.io/docs/stack/search/reference/query_syntax/) and learn more about what you can do.

In this section, we'll be using [FT.CREATE](https://redis.io/commands/ft.create/) to create an index, [FT.SEARCH](https://redis.io/commands/ft.search/) to search, and [FT.DROPINDEX](https://redis.io/commands/ft.dropindex/) to delete an index. We'll also use [FT.INFO](https://redis.io/commands/ft.info/) to get information about our index and [FT.\_LIST](https://redis.io/commands/ft._list/) to get a list of existing indices.

## Creating Indices

Let's create an index to use. Take a look at the following command. In fact, go ahead and run it:

```bash
127.0.0.1:6379> FT.CREATE purchases:index
  ON JSON
  PREFIX 1 purchase:
  SCHEMA
    $.utc_date AS utc_date NUMERIC
    $.utc_date_raw AS utc_date_raw NUMERIC
    $.artist_name AS artist_name TAG
    $.item_description AS item_description TEXT
    $.country AS country TAG
    $.album_title AS album_title TAG
OK
```

Let's break this down a bit.

This creates an index named `purchases:index`. If you look for this index in your keyspace, you won't find it. But if you use the FT.\_LIST command, you will. Go ahead and try it:

```bash
127.0.0.1:6379> FT._LIST
1) "purchase:index"
2) "user:index"
3) "purchases:index"
4) "account:index"
```

Yep. There it is. There are also a few other indexes that were created by the Beats-By-Redis app.

Immediately after we specify the name of the index, we can provide the data structure that Redis should index. Redis can index both JSON documents and Hashes, specified by adding either `ON JSON` or `ON HASH`. If this is not specified, it defaults to `ON HASH`.

After specifying the data structure, we can provide one or more keyspaces for this index to, well, index. Whenever a change is made in this keyspace, our index is updated automatically with the change. We have specified `PREFIX 1 purchase:` so we'll look at any JSON document that starts with `purchase:`. The `1` tells Redis that we only have one prefix. If we had more, it might look like this:

```
PREFIX 3 purchase: another:purchase: real:sales:
```

Then, we specify the schema for the index. This tells Redis how to index our data. Each section in the schema tells Redis three things.

The first is the location of the field. This is the [JSONPath](https://redis.io/docs/stack/json/path/#jsonpath-syntax) to the field if we are indexing JSON documents or just the name of the field if we are indexing Hashes.

Next, is an optional alias to use when we search with the index later. With Hashes, this is only mildly useful. But with JSON documents, this allows us to rename something like `$.foo.bar[*].baz` to `baz`.

Third and lastly, we tell Redis the type of data that is stored at that location. Valid types are TEXT, TAG, NUMERIC, and GEO. We'll cover these more later when we search on them.

## Removing Indices

If for some reason we don't like our index, we can always remove it using FT.DROPINDEX. Go ahead and remove the index:

```bash
127.0.0.1:6379> FT.DROPINDEX purchases:index
OK
```

A quick check of the indices will confirm it is removed:

```bash
127.0.0.1:6379> FT._LIST
(empty array)
```

And it's gone! Of course, we _want_ our index, `cuz we're gonna search against it. So go ahead and recreate it:

```bash
127.0.0.1:6379> FT.CREATE purchases:index
  ON JSON
  PREFIX 1 purchase:
  SCHEMA
    $.utc_date AS utc_date NUMERIC
    $.utc_date_raw AS utc_date_raw NUMERIC
    $.artist_name AS artist_name TAG
    $.item_description AS item_description TEXT
    $.country AS country TAG
    $.album_title AS album_title TEXT
OK
```

## Searching Indices

We search our index using the FT.SEARCH command. The simplest of searches is a search for everything. Go ahead and try it out:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index *
1) "7118"
2) "purchase:Phil Berg.1691437047.6419933"
3) 1) "$"
   2) "{\"utc_date\":1691437047,\"artist_name\":\"Phil Berg\",\"item_type\":\"t\",\"item_description\":\"Into It\",\"album_title\":\"ARCHIVE\",\"slug_type\":\"t\",\"track_album_slug_text\":\"null\",\"currency\":\"EUR\",\"amount_paid\":4,\"item_price\":4,\"amount_paid_usd\":4,\"country\":\"Germany\",\"art_id\":\"4231072886\",\"releases\":\"null\",\"package_image_id\":\"null\",\"url\":\"//philberg.bandcamp.com/track/into-it\",\"country_code\":\"de\",\"amount_paid_fmt\":\"\xe2\x82\xac2\",\"addl_count\":\"1\",\"item_slug\":\"/album/\",\"art_url\":\"https://f4.bcbits.com/img/a4231072886_7.jpg\",\"utc_date_raw\":1691437047.6419933}"
4) "purchase:Afterbirth.1691190197.8307443"
5) 1) "$"
   2) "{\"utc_date\":1691190197,\"artist_name\":\"Afterbirth\",\"item_type\":\"a\",\"item_description\":\"In But Not Of\",\"album_title\":\"In But Not Of\",\"slug_type\":\"a\",\"track_album_slug_text\":\"null\",\"currency\":\"USD\",\"amount_paid\":8,\"item_price\":8,\"amount_paid_usd\":8,\"country\":\"United States\",\"art_id\":\"4222397338\",\"releases\":\"null\",\"package_image_id\":\"null\",\"url\":\"//afterbirthnydeathmetal.bandcamp.com/album/in-but-not-of\",\"country_code\":\"us\",\"amount_paid_fmt\":\"$8.99\",\"art_url\":\"https://f4.bcbits.com/img/a4222397338_7.jpg\",\"utc_date_raw\":1691190197.8307445}"
6) "purchase:Tall Black Guy Productions.1691190326.2734075"
7) 1) "$"
   2) "{\"utc_date\":1691190326,\"artist_name\":\"Tall Black Guy Productions\",\"item_type\":\"t\",\"item_description\":\"04 Come and Go With Me Feat. Kyotey Grey\",\"album_title\":\"Look Into The Wisdom (A Tribute To Roy Ayers)\",\"slug_type\":\"t\",\"track_album_slug_text\":\"null\",\"currency\":\"GBP\",\"amount_paid\":2,\"item_price\":2,\"amount_paid_usd\":2,\"country\":\"United States\",\"art_id\":\"3474703292\",\"releases\":\"null\",\"package_image_id\":\"null\",\"url\":\"//tallblackguy.bandcamp.com/track/04-come-and-go-with-me-feat-kyotey-grey\",\"country_code\":\"us\",\"amount_paid_fmt\":\"\xc2\xa31\",\"addl_count\":\"1\",\"item_slug\":\"/album/\",\"art_url\":\"https://f4.bcbits.com/img/a3474703292_7.jpg\",\"utc_date_raw\":1691190326.2734077}"
8) "purchase:Petteril.1691424617.6611695"
9) 1) "$"
   2) "{\"utc_date\":1691424617,\"artist_name\":\"Petteril\",\"item_type\":\"a\",\"item_description\":\"The Leems Boyste\",\"album_title\":\"The Leems Boyste\",\"slug_type\":\"a\",\"track_album_slug_text\":\"null\",\"currency\":\"USD\",\"amount_paid\":3,\"item_price\":0,\"amount_paid_usd\":3,\"country\":\"Portugal\",\"art_id\":\"647776586\",\"releases\":\"null\",\"package_image_id\":\"null\",\"url\":\"//petteril.bandcamp.com/album/the-leems-boyste\",\"country_code\":\"pt\",\"amount_paid_fmt\":\"$3\",\"amount_over_fmt\":\"$3\",\"art_url\":\"https://f4.bcbits.com/img/a0647776586_7.jpg\",\"utc_date_raw\":1691424617.6611695}"
10) "purchase:HOARIES.1691196302.6774447"
11) 1) "$"
   2) "{\"utc_date\":1691196302,\"artist_name\":\"HOARIES\",\"item_type\":\"a\",\"item_description\":\"Rocker Shocker\",\"album_title\":\"Rocker Shocker\",\"slug_type\":\"a\",\"track_album_slug_text\":\"null\",\"currency\":\"USD\",\"amount_paid\":7,\"item_price\":7,\"amount_paid_usd\":7,\"country\":\"United States\",\"art_id\":\"2731010406\",\"releases\":\"null\",\"package_image_id\":\"null\",\"url\":\"//reptilianrecords.bandcamp.com/album/rocker-shocker-2\",\"country_code\":\"us\",\"amount_paid_fmt\":\"$7\",\"art_url\":\"https://f4.bcbits.com/img/a2731010406_7.jpg\",\"utc_date_raw\":1691196302.6774447}"
12) "purchase:Kelvin K.1691183796.2771487"
13) 1) "$"
   2) "{\"utc_date\":1691183796,\"artist_name\":\"Kelvin K\",\"item_type\":\"t\",\"item_description\":\"Mr. 303\",\"album_title\":\"Back Catalog Sampler (2000-2016)\",\"slug_type\":\"t\",\"track_album_slug_text\":\"null\",\"currency\":\"USD\",\"amount_paid\":1,\"item_price\":1,\"amount_paid_usd\":1,\"country\":\"Romania\",\"art_id\":\"1296613553\",\"releases\":\"null\",\"package_image_id\":\"null\",\"url\":\"//kelvink.bandcamp.com/track/mr-303\",\"country_code\":\"ro\",\"amount_paid_fmt\":\"$1\",\"art_url\":\"https://f4.bcbits.com/img/a1296613553_7.jpg\",\"utc_date_raw\":1691183796.2771487}"
14) "purchase:Open Mike Eagle.1691186756.928919"
15) 1) "$"
   2) "{\"utc_date\":1691186756,\"artist_name\":\"Open Mike Eagle\",\"item_type\":\"a\",\"item_description\":\"another triumph of ghetto engineering\",\"album_title\":\"another triumph of ghetto engineering\",\"slug_type\":\"a\",\"track_album_slug_text\":\"null\",\"currency\":\"USD\",\"amount_paid\":9,\"item_price\":9,\"amount_paid_usd\":9,\"country\":\"United States\",\"art_id\":\"2299365024\",\"releases\":\"null\",\"package_image_id\":\"null\",\"url\":\"//openmikeeagle.bandcamp.com/album/another-triumph-of-ghetto-engineering\",\"country_code\":\"us\",\"amount_paid_fmt\":\"$9\",\"art_url\":\"https://f4.bcbits.com/img/a2299365024_7.jpg\",\"utc_date_raw\":1691186756.928919}"
16) "purchase:Missy Elliott.1691437413.4373164"
17) 1) "$"
   2) "{\"utc_date\":1691437413,\"artist_name\":\"Missy Elliott\",\"item_type\":\"t\",\"item_description\":\"Lose Control (Josh Hubi's Love Theme Remix)\",\"album_title\":\"Love Theme\",\"slug_type\":\"t\",\"track_album_slug_text\":\"null\",\"currency\":\"USD\",\"amount_paid\":1,\"item_price\":1,\"amount_paid_usd\":1,\"country\":\"Latvia\",\"art_id\":\"553167288\",\"releases\":\"null\",\"package_image_id\":\"null\",\"url\":\"//soydasrecords.bandcamp.com/track/lose-control-josh-hubis-love-theme-remix\",\"country_code\":\"lv\",\"amount_paid_fmt\":\"$1\",\"art_url\":\"https://f4.bcbits.com/img/a0553167288_7.jpg\",\"utc_date_raw\":1691437413.4373164}"
18) "purchase:Johnny Cash.1691440469.9247208"
19) 1) "$"
   2) "{\"utc_date\":1691440469,\"artist_name\":\"Johnny Cash\",\"item_type\":\"a\",\"item_description\":\"Now Here's Johnny Cash\",\"album_title\":\"Now Here's Johnny Cash\",\"slug_type\":\"a\",\"track_album_slug_text\":\"null\",\"currency\":\"USD\",\"amount_paid\":9,\"item_price\":9,\"amount_paid_usd\":9,\"country\":\"United States\",\"art_id\":\"1211252557\",\"releases\":\"null\",\"package_image_id\":\"null\",\"url\":\"//johnnycash.bandcamp.com/album/now-heres-johnny-cash\",\"country_code\":\"us\",\"amount_paid_fmt\":\"$9.99\",\"art_url\":\"https://f4.bcbits.com/img/a1211252557_7.jpg\",\"utc_date_raw\":1691440469.9247208}"
20) "purchase:Milk For The Angry..1691193714.2669945"
21) 1) "$"
   2) "{\"utc_date\":1691193714,\"artist_name\":\"Milk For The Angry.\",\"item_type\":\"p\",\"item_description\":\"Hand Dyed \\\"Starry Coins\\\" T-Shirt (Black Graphic)\",\"album_title\":\"Hand Dyed \\\"Starry Coins\\\" T-Shirt (Black Graphic)\",\"slug_type\":\"p\",\"track_album_slug_text\":\"null\",\"currency\":\"USD\",\"amount_paid\":25,\"item_price\":20,\"amount_paid_usd\":25,\"country\":\"United States\",\"art_id\":\"null\",\"releases\":\"null\",\"package_image_id\":\"33064278\",\"url\":\"//milkfortheangry.bandcamp.com/merch/hand-dyed-starry-coins-t-shirt-black-graphic\",\"country_code\":\"us\",\"amount_paid_fmt\":\"$25\",\"amount_over_fmt\":\"$5\",\"art_url\":\"https://f4.bcbits.com/img/0033064278_37.jpg\",\"utc_date_raw\":1691193714.2669945}"
```

Redis returns a lot of data. The very first thing is the total number of items that matched our query: 7118 in my case. Yours will be difference based on how long you have been running the app. After that, you get the key name followed by the contents of that key. The contents for a Hash would be a series of field names followed by values. But for JSON, the "field name" is just `$` and then "value" is the JSON text.

You might have noticed that we only got 10 results back but we have more total results. The call to FT.SEARCH has a default limit of `10`. You can override this and paginate the results using the `LIMIT` option. Try just getting five results:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index * LIMIT 0 5
1) "7118"
2) "purchase:Phil Berg.1691437047.6419933"
3) 1) "$"
   2) "{\"utc_date\":1691437047,\"artist_name\":\"Phil Berg\",\"item_type\":\"t\",\"item_description\":\"Into It\",\"album_title\":\"ARCHIVE\",\"slug_type\":\"t\",\"track_album_slug_text\":\"null\",\"currency\":\"EUR\",\"amount_paid\":4,\"item_price\":4,\"amount_paid_usd\":4,\"country\":\"Germany\",\"art_id\":\"4231072886\",\"releases\":\"null\",\"package_image_id\":\"null\",\"url\":\"//philberg.bandcamp.com/track/into-it\",\"country_code\":\"de\",\"amount_paid_fmt\":\"\xe2\x82\xac2\",\"addl_count\":\"1\",\"item_slug\":\"/album/\",\"art_url\":\"https://f4.bcbits.com/img/a4231072886_7.jpg\",\"utc_date_raw\":1691437047.6419933}"
4) "purchase:Afterbirth.1691190197.8307443"
5) 1) "$"
   2) "{\"utc_date\":1691190197,\"artist_name\":\"Afterbirth\",\"item_type\":\"a\",\"item_description\":\"In But Not Of\",\"album_title\":\"In But Not Of\",\"slug_type\":\"a\",\"track_album_slug_text\":\"null\",\"currency\":\"USD\",\"amount_paid\":8,\"item_price\":8,\"amount_paid_usd\":8,\"country\":\"United States\",\"art_id\":\"4222397338\",\"releases\":\"null\",\"package_image_id\":\"null\",\"url\":\"//afterbirthnydeathmetal.bandcamp.com/album/in-but-not-of\",\"country_code\":\"us\",\"amount_paid_fmt\":\"$8.99\",\"art_url\":\"https://f4.bcbits.com/img/a4222397338_7.jpg\",\"utc_date_raw\":1691190197.8307445}"
6) "purchase:PREP.1691442224.3394294"
7) 1) "$"
   2) "{\"utc_date\":1691442224,\"artist_name\":\"PREP\",\"item_type\":\"t\",\"item_description\":\"As It Was\",\"album_title\":\"As It Was\",\"slug_type\":\"t\",\"track_album_slug_text\":\"null\",\"currency\":\"USD\",\"amount_paid\":1,\"item_price\":1,\"amount_paid_usd\":1,\"country\":\"Portugal\",\"art_id\":\"2007916294\",\"releases\":\"null\",\"package_image_id\":\"null\",\"url\":\"//pprep.bandcamp.com/track/as-it-was\",\"country_code\":\"pt\",\"amount_paid_fmt\":\"$1\",\"art_url\":\"https://f4.bcbits.com/img/a2007916294_7.jpg\",\"utc_date_raw\":1691442224.3394294}"
8) "purchase:Tall Black Guy Productions.1691190326.2734075"
9) 1) "$"
   2) "{\"utc_date\":1691190326,\"artist_name\":\"Tall Black Guy Productions\",\"item_type\":\"t\",\"item_description\":\"04 Come and Go With Me Feat. Kyotey Grey\",\"album_title\":\"Look Into The Wisdom (A Tribute To Roy Ayers)\",\"slug_type\":\"t\",\"track_album_slug_text\":\"null\",\"currency\":\"GBP\",\"amount_paid\":2,\"item_price\":2,\"amount_paid_usd\":2,\"country\":\"United States\",\"art_id\":\"3474703292\",\"releases\":\"null\",\"package_image_id\":\"null\",\"url\":\"//tallblackguy.bandcamp.com/track/04-come-and-go-with-me-feat-kyotey-grey\",\"country_code\":\"us\",\"amount_paid_fmt\":\"\xc2\xa31\",\"addl_count\":\"1\",\"item_slug\":\"/album/\",\"art_url\":\"https://f4.bcbits.com/img/a3474703292_7.jpg\",\"utc_date_raw\":1691190326.2734077}"
10) "purchase:Petteril.1691424617.6611695"
11) 1) "$"
   2) "{\"utc_date\":1691424617,\"artist_name\":\"Petteril\",\"item_type\":\"a\",\"item_description\":\"The Leems Boyste\",\"album_title\":\"The Leems Boyste\",\"slug_type\":\"a\",\"track_album_slug_text\":\"null\",\"currency\":\"USD\",\"amount_paid\":3,\"item_price\":0,\"amount_paid_usd\":3,\"country\":\"Portugal\",\"art_id\":\"647776586\",\"releases\":\"null\",\"package_image_id\":\"null\",\"url\":\"//petteril.bandcamp.com/album/the-leems-boyste\",\"country_code\":\"pt\",\"amount_paid_fmt\":\"$3\",\"amount_over_fmt\":\"$3\",\"art_url\":\"https://f4.bcbits.com/img/a0647776586_7.jpg\",\"utc_date_raw\":1691424617.6611695}"
```

The `LIMIT` option takes a starting point within the results and a total number of results to return. So, to get the fifth result you would enter:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index * LIMIT 4 1
1) "7118"
2) "purchase:Petteril.1691424617.6611695"
3) 1) "$"
   2) "{\"utc_date\":1691424617,\"artist_name\":\"Petteril\",\"item_type\":\"a\",\"item_description\":\"The Leems Boyste\",\"album_title\":\"The Leems Boyste\",\"slug_type\":\"a\",\"track_album_slug_text\":\"null\",\"currency\":\"USD\",\"amount_paid\":3,\"item_price\":0,\"amount_paid_usd\":3,\"country\":\"Portugal\",\"art_id\":\"647776586\",\"releases\":\"null\",\"package_image_id\":\"null\",\"url\":\"//petteril.bandcamp.com/album/the-leems-boyste\",\"country_code\":\"pt\",\"amount_paid_fmt\":\"$3\",\"amount_over_fmt\":\"$3\",\"art_url\":\"https://f4.bcbits.com/img/a0647776586_7.jpg\",\"utc_date_raw\":1691424617.6611695}"
```

If you tell LIMIT to return zero items, you will get only the count of items that match your query:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index * LIMIT 0 0
1) "7118"
```

You can also specify what fields you want to be returned with the `RETURN` option. This can use either the aliased we defined in `FT.CREATE`, JSONPath queries, or both:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index * RETURN 2 $.utc_date $.artist_name
1) "7118"
2) "purchase:Phil Berg.1691437047.6419933"
3) 1) "$.utc_date"
   2) "1691437047"
   3) "$.artist_name"
   4) "Phil Berg"
4) "purchase:Afterbirth.1691190197.8307443"
5) 1) "$.utc_date"
   2) "1691190197"
   3) "$.artist_name"
   4) "Afterbirth"
6) "purchase:PREP.1691442224.3394294"
7) 1) "$.utc_date"
   2) "1691442224"
   3) "$.artist_name"
   4) "PREP"
8) "purchase:Tall Black Guy Productions.1691190326.2734075"
9) 1) "$.utc_date"
   2) "1691190326"
   3) "$.artist_name"
   4) "Tall Black Guy Productions"
10) "purchase:Petteril.1691424617.6611695"
11) 1) "$.utc_date"
   2) "1691424617"
   3) "$.artist_name"
   4) "Petteril"
12) "purchase:HOARIES.1691196302.6774447"
13) 1) "$.utc_date"
   2) "1691196302"
   3) "$.artist_name"
   4) "HOARIES"
14) "purchase:Kelvin K.1691183796.2771487"
15) 1) "$.utc_date"
   2) "1691183796"
   3) "$.artist_name"
   4) "Kelvin K"
16) "purchase:Open Mike Eagle.1691186756.928919"
17) 1) "$.utc_date"
   2) "1691186756"
   3) "$.artist_name"
   4) "Open Mike Eagle"
18) "purchase:Missy Elliott.1691437413.4373164"
19) 1) "$.utc_date"
   2) "1691437413"
   3) "$.artist_name"
   4) "Missy Elliott"
20) "purchase:Johnny Cash.1691440469.9247208"
21) 1) "$.utc_date"
   2) "1691440469"
   3) "$.artist_name"
   4) "Johnny Cash"
```

The `2` in the above command is similar to the number in the `PREFIX` option of `FT.CREATE`—it tells Redis how many arguments to expect. Interestingly, you can tell Redis to return `0` fields.

```bash
127.0.0.1:6379> FT.SEARCH purchases:index * RETURN 0
1) "7118"
2) "purchase:Phil Berg.1691437047.6419933"
3) "purchase:Afterbirth.1691190197.8307443"
4) "purchase:PREP.1691442224.3394294"
5) "purchase:Tall Black Guy Productions.1691190326.2734075"
6) "purchase:Petteril.1691424617.6611695"
7) "purchase:HOARIES.1691196302.6774447"
8) "purchase:Kelvin K.1691183796.2771487"
9) "purchase:Open Mike Eagle.1691186756.928919"
10) "purchase:Missy Elliott.1691437413.4373164"
11) "purchase:Johnny Cash.1691440469.9247208"
```

When you do this, you just get the key names back.

## Searching TEXT Fields

A TEXT field in Redis search indicates a field that contains human-readable text that we want to perform full-text search against. TEXT fields understand related words using a process called _stemming_. So Redis knows that a search for `give` should match text with `gives`, `gave`, `given`, and `giving`. TEXT fields also know that certain words—called _stopwords_—are common and not useful for search. Thus, words like `a`, `and`, and `the` are ignored when searching TEXT fields.

By default, Redis will search all text fields in the index. Let's find some purchases with the word `feat` in any TEXT field:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index feat RETURN 0
1) "80"
2) "purchase:Tall Black Guy Productions.1691190326.2734075"
3) "purchase:Pigs Pigs Pigs Pigs Pigs Pigs Pigs.1691439398.4469037"
4) "purchase:El Train.1691437615.4636738"
5) "purchase:Nicon\xc3\xa9.1691439773.8611472"
6) "purchase:BugzintheAttic.1691189195.9622874"
7) "purchase:Mumdance.1691439391.75111"
8) "purchase:Machinedrum.1691430291.326799"
9) "purchase:Full Crate.1691193132.4819832"
10) "purchase:WAYU Records.1691191223.162136"
11) "purchase:Absinthe Rose.1691196671.0822814"
```

Looks like we got a few. Plenty of albums with the word "feat" in the title.

To search with a specific field, prefix it with the field name. Let's look for transactions with the word `record` in the `item_description` field:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index @item_description:record RETURN 0
1) "42"
2) "purchase:Various Artists.1691423225.1904888"
3) "purchase:Kyle Church.1691194936.6893578"
4) "purchase:VAPERROR.1691439591.4664435"
5) "purchase:Dance Hall Crashers.1691192612.889622"
6) "purchase:Self Oscillate.1691420346.6447265"
7) "purchase:REIGHNBEAU.1691191362.084555"
8) "purchase:Extra.1691430759.217977"
9) "purchase:Wiretap Records.1691188569.2916253"
10) "purchase:Surgeon, Reeko, Lewis Fautzi, Jonas Kopp, Mike Parker, Christian W\xc3\xbcnsch.1691194587.8956048"
11) "purchase:\xe7\x9b\xb4\xe6\x9e\x9d\xe6\x94\xbf\xe5\xba\x83 Masahiro Naoe.1691185968.3799257"
```

Plenty of matching purchases with "record" in the description.

So far, our queries haven't used quotes. But it's usually needed for anything beyond the most basic searches. Let's search for transactions sightings with the word `go` and the word `feat` in the `item_description`:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index "@item_description:feat @item_description:go" RETURN 0
1) "2"
2) "purchase:Tall Black Guy Productions.1691190326.2734075"
3) "purchase:B. Cool-Aid.1691431858.1631248"
```

A lot fewer this time. If we do an `or` instead of an `and`—which is what Redis does by default—we should get more purchases. Let's try it by adding a `|` between the two elements of our query:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index "@item_description:feat | @item_description:go" RETURN 0
1) "111"
2) "purchase:Keith Fullerton Whitman.1691427616.1362033"
3) "purchase:Sanity Slip.1691425757.3154438"
4) "purchase:Rumpistol.1691195938.081442"
5) "purchase:Crywank.1691193227.2245917"
6) "purchase:\xec\x9a\xb0\xec\x98\x88\xeb\xa6\xb0 (Woo Yerin).1691431996.8873765"
7) "purchase:Nyra.1691420433.6451886"
8) "purchase:FS Green.1691426437.3086433"
9) "purchase:Various Artists.1691422303.6373029"
10) "purchase:Danny Snowden.1691431952.6033218"
11) "purchase:Various Artists.1691192017.1074412"
```

Confirmed!

## Searching TAG Fields

TAG fields represent a single string or a collection of strings. They are stored in Hashes and JSON as comma-delimited strings like:

```
Foo,Bar,Baz
```

In JSON, they can also be stored as any JSONPath that would return an array of strings. For example, look at the following JSON:

```json
{
    "customerId": "12345",
    "sales": [
        {
            "utc_date": 1691190326,
            "type": "Album"
        },
        {
            "utc_date": 1691424617,
            "type": "Song"
        },
        {
            "utc_date": 1691196302,
            "type": "Discography"
        }
    ]
}
```

You could create a TAG field with a JSONPath of `$.purchases[*].type`.

You can think of TAGs as the tags clouds on a blog. You can search for JSON documents and Hashes that contain a specific value within that TAG. So, you could search for `Song` and any document tagged with `Song` will be returned.

If you provide only a single value in a TAG, it can make an excellent key—foreign or primary. In the above JSON, you can specify a TAG field for the `customerId` property with a JSONPath of `$.customerId`.

You can search on a TAG field using the following syntax:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index "@country:{France}" RETURN 0
1) "273"
2) "purchase:Semiologist.1691437474.514823"
3) "purchase:Steven Julien.1691425695.8835533"
4) "purchase:Cancel.1691438802.3940954"
5) "purchase:Calibre.1691424852.7341444"
6) "purchase:The National.1691440161.5695133"
7) "purchase:\xf0\x9d\x93\x9d\xf0\x9d\x93\xbe\xf0\x9d\x93\xaa\xf0\x9d\x93\xb7\xf0\x9d\x93\xac\xf0\x9d\x93\xae\xf0\x9d\x93\xbc \xf0\x9d\x93\x93'\xf0\x9d\x93\xae\xf0\x9d\x93\xb7\xf0\x9d\x93\xb0\xf0\x9d\x93\xbb\xf0\x9d\x93\xaa\xf0\x9d\x93\xb2\xf0\x9d\x93\xbc \xf0\x9d\x93\xaa\xf0\x9d\x93\xb7\xf0\x9d\x93\xad \xf0\x9d\x93\xa2\xf0\x9d\x93\x99 \xf0\x9d\x93\x92.\xf0\x9d\x93\x9e.\xf0\x9d\x93\xa1.\xf0\x9d\x93\x90.\xf0\x9d\x93\x9d..1691439157.2666533"
8) "purchase:Reece Walker & Qnete.1691441019.5457132"
9) "purchase:Meryl Streek.1691430833.4267051"
10) "purchase:Doruksen.1691438747.2871873"
11) "purchase:Red Scan.1691437687.7699246"
```

You can search on documents tagged with one value _or_ another with a `|`:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index "@country:{France | Germany}" RETURN 0
1) "970"
2) "purchase:Phil Berg.1691437047.6419933"
3) "purchase:Steven Julien.1691425695.8835533"
4) "purchase:Calibre.1691424852.7341444"
5) "purchase:The National.1691440161.5695133"
6) "purchase:Reece Walker & Qnete.1691441019.5457132"
7) "purchase:Meryl Streek.1691430833.4267051"
8) "purchase:Red Scan.1691437687.7699246"
9) "purchase:Various Artists.1691420778.9642684"
10) "purchase:COIDO.1691426337.267687"
11) "purchase:Sun People.1691430112.2201068"
```

You can search on documents tagged with one value _and_ another by specifying the same field twice:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index "@country:{France} @country:{Germany}" RETURN 0
1) "0"
```

Of course, transactions only come from a single account, so this returns zero results.

You can wildcard TAG fields. So, we can find all of the transactions that have a `country` that starts with a particular value:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index "@country:{United*}" RETURN 0
1) "4513"
2) "purchase:Afterbirth.1691190197.8307443"
3) "purchase:Steam Shape.1691190837.193837"
4) "purchase:I Am Bam, c-HAUTEM.1691190875.027905"
5) "purchase:Berg Audio.1691439427.5729067"
6) "purchase:Steam Shape.1691190837.8731797"
7) "purchase:Above & Beyond feat. Richard Bedford.1691439106.4859512"
8) "purchase:PCMM, The Dag, Veta.M, MSKD.1691190930.5391734"
9) "purchase:BFT Records.1691190921.0629845"
10) "purchase:izzy wise.1691441019.9086132"
11) "purchase:RoadkillSoda.1691428340.360715"
```

Or that ends with one:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index "@country:{*States}" RETURN 0
1) "3274"
2) "purchase:Afterbirth.1691190197.8307443"
3) "purchase:Tall Black Guy Productions.1691190326.2734075"
4) "purchase:HOARIES.1691196302.6774447"
5) "purchase:Open Mike Eagle.1691186756.928919"
6) "purchase:Johnny Cash.1691440469.9247208"
7) "purchase:Milk For The Angry..1691193714.2669945"
8) "purchase:Homestuck.1691439018.8037124"
9) "purchase:White Girl Wasted.1691420516.2932742"
10) "purchase:Emeralds.1691197026.0496516"
11) "purchase:Cyberfunk.1691430570.7871802"
```

Or that contains one:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index "@country:{*ana*}" RETURN 0
1) "358"
2) "purchase:DNNS, INFEED, Leo Bufera, JGMZ, Onelas, CLASS-N, SIKOTI.1691430179.079796"
3) "purchase:TT the Artist, Sir JoQ.1691425567.877955"
4) "purchase:Humanity's Last Breath.1691190017.2188866"
5) "purchase:DJ SWISHA.1691430528.3166127"
6) "purchase:Eva Geist.1691437379.3576982"
7) "purchase:Current Value.1691441022.482898"
8) "purchase:GODSPEED \xe9\x9f\xb3.1691195997.4208724"
9) "purchase:Koncept Jack$on & Sadhugold.1691430627.3927033"
10) "purchase:Robin Hastings.1691440242.1652005"
11) "purchase:Dart Mouth.1691438175.160421"
```

But you must specify at least two characters or you won't get any results at all:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index "@country:{*y}" RETURN 0
1) "0"
```

## Searching NUMERIC Fields

NUMERIC fields, unsurprisingly, contain numbers. These can be integers or floating-point numbers. If we have indexed JSON documents, these can be actual numbers in the JSON. If we are working with Hashes, these are Strings that contain numbers. Remember, in Redis, that Strings that contain numbers are stored as numbers internally. So, NUMERIC fields are actual numbers.

Searching NUMERIC fields in RediSearch is pretty easy. Just provide the upper and lower bounds for the number range you want for a particular field. For example, to find all transactions between $50.00 and $75.00 inclusive, we would issue the following query:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index "@utc_date:[1691195997 1691430627]" RETURN 1 utc_date
1) "1628"
2) "purchase:Petteril.1691424617.6611695"
3) 1) "utc_date"
   2) "1691424617"
4) "purchase:HOARIES.1691196302.6774447"
5) 1) "utc_date"
   2) "1691196302"
6) "purchase:Nickodemus feat The Illustrious Blacks.1691430141.2878995"
7) 1) "utc_date"
   2) "1691430141"
8) "purchase:Courtney Barnett.1691425420.3041718"
9) 1) "utc_date"
   2) "1691425420"
10) "purchase:White Girl Wasted.1691420516.2932742"
11) 1) "utc_date"
   2) "1691420516"
12) "purchase:ADVORSA.1691429799.5121384"
13) 1) "utc_date"
   2) "1691429799"
14) "purchase:Emeralds.1691197026.0496516"
15) 1) "utc_date"
   2) "1691197026"
16) "purchase:An Avrin.1691421853.031164"
17) 1) "utc_date"
   2) "1691421853"
18) "purchase:DNNS, INFEED, Leo Bufera, JGMZ, Onelas, CLASS-N, SIKOTI.1691430179.079796"
19) 1) "utc_date"
   2) "1691430179"
20) "purchase:Various Artists compiled by Tundra.1691424789.3147879"
21) 1) "utc_date"
   2) "1691424789"
```

To make it _exclusive_ instead of inclusive we add parentheses:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index "@utc_date:[(1691195997 (1691430627]" RETURN 1 utc_date
1) "1612"
2) "purchase:Petteril.1691424617.6611695"
3) 1) "utc_date"
   2) "1691424617"
4) "purchase:HOARIES.1691196302.6774447"
5) 1) "utc_date"
   2) "1691196302"
6) "purchase:Nickodemus feat The Illustrious Blacks.1691430141.2878995"
7) 1) "utc_date"
   2) "1691430141"
8) "purchase:Courtney Barnett.1691425420.3041718"
9) 1) "utc_date"
   2) "1691425420"
10) "purchase:White Girl Wasted.1691420516.2932742"
11) 1) "utc_date"
   2) "1691420516"
12) "purchase:ADVORSA.1691429799.5121384"
13) 1) "utc_date"
   2) "1691429799"
14) "purchase:Emeralds.1691197026.0496516"
15) 1) "utc_date"
   2) "1691197026"
16) "purchase:An Avrin.1691421853.031164"
17) 1) "utc_date"
   2) "1691421853"
18) "purchase:DNNS, INFEED, Leo Bufera, JGMZ, Onelas, CLASS-N, SIKOTI.1691430179.079796"
19) 1) "utc_date"
   2) "1691430179"
20) "purchase:Various Artists compiled by Tundra.1691424789.3147879"
21) 1) "utc_date"
   2) "1691424789"
```

Try poking around with the query and see if you can prove to yourself that this works. You may need to look at the `utc_date` values that exist in your application instance to figure it out.

If you want to remove the upper limit, you can use `+inf` instead of a number:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index "@utc_date:[1691195997 +inf]" RETURN 1 utc_date
1) "5454"
2) "purchase:Phil Berg.1691437047.6419933"
3) 1) "utc_date"
   2) "1691437047"
4) "purchase:PREP.1691442224.3394294"
5) 1) "utc_date"
   2) "1691442224"
6) "purchase:Skee Mask.1691445709.690774"
7) 1) "utc_date"
   2) "1691445709"
8) "purchase:Petteril.1691424617.6611695"
9) 1) "utc_date"
   2) "1691424617"
10) "purchase:HOARIES.1691196302.6774447"
11) 1) "utc_date"
   2) "1691196302"
12) "purchase:Missy Elliott.1691437413.4373164"
13) 1) "utc_date"
   2) "1691437413"
14) "purchase:Johnny Cash.1691440469.9247208"
15) 1) "utc_date"
   2) "1691440469"
16) "purchase:Homestuck.1691439018.8037124"
17) 1) "utc_date"
   2) "1691439018"
18) "purchase:Nickodemus feat The Illustrious Blacks.1691430141.2878995"
19) 1) "utc_date"
   2) "1691430141"
20) "purchase:DJ Powerbank.1691439830.069184"
21) 1) "utc_date"
   2) "1691439830"
```

If you want to remove the lower limit, you can use `-inf` in a similar way:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index "@utc_date:[-inf 1691430627]" RETURN 1 utc_date
1) "3788"
2) "purchase:Afterbirth.1691190197.8307443"
3) 1) "utc_date"
   2) "1691190197"
4) "purchase:Tall Black Guy Productions.1691190326.2734075"
5) 1) "utc_date"
   2) "1691190326"
6) "purchase:Petteril.1691424617.6611695"
7) 1) "utc_date"
   2) "1691424617"
8) "purchase:HOARIES.1691196302.6774447"
9) 1) "utc_date"
   2) "1691196302"
10) "purchase:Kelvin K.1691183796.2771487"
11) 1) "utc_date"
   2) "1691183796"
12) "purchase:Open Mike Eagle.1691186756.928919"
13) 1) "utc_date"
   2) "1691186756"
14) "purchase:Milk For The Angry..1691193714.2669945"
15) 1) "utc_date"
   2) "1691193714"
16) "purchase:Nickodemus feat The Illustrious Blacks.1691430141.2878995"
17) 1) "utc_date"
   2) "1691430141"
18) "purchase:Courtney Barnett.1691425420.3041718"
19) 1) "utc_date"
   2) "1691425420"
20) "purchase:White Girl Wasted.1691420516.2932742"
21) 1) "utc_date"
   2) "1691420516"
```

And, if you really want to, you can specify `-inf` and `+inf` in the same query. This pretty much just makes sure that the amount is a number and will filter out things that are null or non-numeric:

```bash
127.0.0.1:6379> FT.SEARCH purchases:index "@utc_date:[-inf +inf]" RETURN 1 utc_date LIMIT 0 0
1) "7641"
```

You can see here that there are 7641 transactions with an amount, which is all of them.
