# Using RediSearch #

[RediSearch](https://redis.io/docs/stack/search/) is a module that adds indexing and full-text search to Redis. You can use it to make your Hashes and JSON documents fully searchable. RediSearch is a *really* big topic and would probably be suitable as a workshop all its own. We're just going to cover the basics here. You can check out the [full search query syntax](https://redis.io/docs/stack/search/reference/query_syntax/) and learn more about what you can do.

In this section, we'll be using [FT.CREATE](https://redis.io/commands/ft.create/) to create an index, [FT.SEARCH](https://redis.io/commands/ft.search/) to search, and [FT.DROPINDEX](https://redis.io/commands/ft.dropindex/) to delete an index. We'll also use [FT.INFO](https://redis.io/commands/ft.info/) to get information about our index and [FT._LIST](https://redis.io/commands/ft._list/) to get a list of existing indices.


## Preloaded Data ##

To really show off RediSearch, we need some data. Fortunately, the Docker images you cloned come with data loaded and ready to go. You probably saw it in the previous two exercises. That data is in the `/data` folder of this repository and is named `dump.rdb`.


## Creating Indices ##

So, let's create an index to use it. Take a look at the following command. In fact, go ahead and run it:

```bash
127.0.0.1:6379> FT.CREATE exercise:transaction:index
  ON JSON
  PREFIX 1 exercise:transaction:
  SCHEMA
    $.id AS id TAG
    $.date AS date NUMERIC
    $.fromAccount AS fromAccount TAG
    $.toAccount AS toAccount TAG
    $.amount AS amount NUMERIC
    $.description AS description TEXT
    $.location AS location GEO
OK
```

Let's break this down a bit.

This creates an index named `exercise:transaction:index`. If you look for this index in your keyspace, you won't find it. But if you use the FT._LIST command, you will. Go ahead and try it:

```bash
127.0.0.1:6379> FT._LIST
1) "exercise:transaction:index"
```

Yep. There it is.

Immediately after we specify the name of the index, we can provide the data structure that RediSearch should index. RediSearch can index both JSON documents and Hashes, specified by adding either `ON JSON` or `ON HASH`. If this is not specified, it defaults to `ON HASH`.

After specifying the data structure, we can provide one or more keyspaces for this index to, well, index. Whenever a change is made in this keyspace, our index is updated automatically with the change. We have specified `PREFIX 1 exercise:transaction:` so we'll look at any JSON document that starts with `exercise:transaction:`. The `1` tells Redis that we only have one prefix. If we had more, it might look like this:

```
PREFIX 3 exercise:transaction: another:exercise:transaction: real:transaction:
```

Then, we specify the schema for the index. This tells RediSearch how to index our data. Each section in the schema tells Redis three things.

The first is the location of the field. This is the [JSONPath](https://redis.io/docs/stack/json/path/#jsonpath-syntax) to the field if we are indexing JSON documents or just the name of the field if we are indexing Hashes.

Next, is an optional alias to use when we search with the index later. With Hashes, this is only mildly useful. But with JSON documents, this allows us to rename something like `$.foo.bar[*].baz` to `baz`.

Third and lastly, we tell Redis the type of data that is stored at that location. Valid types are TEXT, TAG, NUMERIC, and GEO. We'll cover these more later when we search on them.


## Removing Indices ##

If for some reason we don't like our index, we can always remove it using FT.DROPINDEX. Go ahead and remove the index:

```bash
127.0.0.1:6379> FT.DROPINDEX exercise:transaction:index
OK
```

A quick check of the indices will confirm it is removed:

```bash
127.0.0.1:6379> FT._LIST
(empty array)
```

And it's gone! Of course, we *want* our index, `cuz we're gonna search against it. So go ahead and recreate it:

```bash
127.0.0.1:6379> FT.CREATE exercise:transaction:index
  ON JSON
  PREFIX 1 exercise:transaction:
  SCHEMA
    $.id AS id TAG
    $.date AS date NUMERIC
    $.fromAccount AS fromAccount TAG
    $.toAccount AS toAccount TAG
    $.amount AS amount NUMERIC
    $.description AS description TEXT
    $.location AS location GEO
OK
```

## Searching Indices ##

We search our index using the FT.SEARCH command. The simplest of searches is a search for everything. Go ahead and try it out:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index *
 1) (integer) 98
 2) "exercise:transaction:184247"
 3) 1) "$"
    2) "{\"id\":\"184247\",\"date\":1680129728.687,\"fromAccount\":\"1474579449\",\"toAccount\":\"8146699789\",\"amount\":192.77,\"description\":\"Dental appointment payment\",\"location\":\"-150.471,-24.293\"}"
 4) "exercise:transaction:827534"
 5) 1) "$"
    2) "{\"id\":\"827534\",\"date\":1678918819.458,\"fromAccount\":\"5376210367\",\"toAccount\":\"1956797544\",\"amount\":245.34,\"description\":\"Amazon purchase\",\"location\":\"-11.297,-28.065\"}"
 6) "exercise:transaction:320144"
 7) 1) "$"
    2) "{\"id\":\"320144\",\"date\":1679872372.511,\"fromAccount\":\"4052206129\",\"toAccount\":\"8192028256\",\"amount\":308.93,\"description\":\"Car repair expense\",\"location\":\"-63.620,-26.208\"}"
 8) "exercise:transaction:859209"
 9) 1) "$"
    2) "{\"id\":\"859209\",\"date\":1678836334.951,\"fromAccount\":\"9260167207\",\"toAccount\":\"9062981215\",\"amount\":87.67,\"description\":\"Gym membership fee\",\"location\":\"126.537,-30.782\"}"
10) "exercise:transaction:386261"
11) 1) "$"
    2) "{\"id\":\"386261\",\"date\":1679826029.547,\"fromAccount\":\"9055818725\",\"toAccount\":\"7423560078\",\"amount\":438.86,\"description\":\"Online movie rental\",\"location\":\"-153.249,-27.738\"}"
12) "exercise:transaction:615181"
13) 1) "$"
    2) "{\"id\":\"615181\",\"date\":1679769109.83,\"fromAccount\":\"0162498158\",\"toAccount\":\"3512775382\",\"amount\":431.99,\"description\":\"Haircut expense\",\"location\":\"-31.694,-4.553\"}"
14) "exercise:transaction:542586"
15) 1) "$"
    2) "{\"id\":\"542586\",\"date\":1678628097.583,\"fromAccount\":\"8043209428\",\"toAccount\":\"0888215922\",\"amount\":433.78,\"description\":\"Gym membership fee\",\"location\":\"-103.384,-59.674\"}"
16) "exercise:transaction:421262"
17) 1) "$"
    2) "{\"id\":\"421262\",\"date\":1677869272.05,\"fromAccount\":\"0862827800\",\"toAccount\":\"5740618193\",\"amount\":469.74,\"description\":\"Gasoline purchase\",\"location\":\"178.429,-77.039\"}"
18) "exercise:transaction:285427"
19) 1) "$"
    2) "{\"id\":\"285427\",\"date\":1678834249.871,\"fromAccount\":\"0058434285\",\"toAccount\":\"0281941245\",\"amount\":315.16,\"description\":\"Beauty salon expense\",\"location\":\"-176.406,30.202\"}"
20) "exercise:transaction:265457"
21) 1) "$"
    2) "{\"id\":\"265457\",\"date\":1679227762.641,\"fromAccount\":\"5092096745\",\"toAccount\":\"4536406317\",\"amount\":161.35,\"description\":\"Investment account management fee\",\"location\":\"151.813,58.315\"}"
```

RediSearch returns a lot of data. The very first thing is the total number of items that matched our query: 98 in our case. After that, you get the key name followed by the contents of that key. The contents for a Hash would be a series of field names followed by values. But for JSON, the "field name" is just `$` and then "value" is the JSON text.

You might have noticed that we only got 10 results back but we have 98 total results. The call to FT.SEARCH has a default limit of `10`. You can override this and paginate the results using the `LIMIT` option. Try just getting five results:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index * LIMIT 0 5
 1) (integer) 98
 2) "exercise:transaction:184247"
 3) 1) "$"
    2) "{\"id\":\"184247\",\"date\":1680129728.687,\"fromAccount\":\"1474579449\",\"toAccount\":\"8146699789\",\"amount\":192.77,\"description\":\"Dental appointment payment\",\"location\":\"-150.471,-24.293\"}"
 4) "exercise:transaction:827534"
 5) 1) "$"
    2) "{\"id\":\"827534\",\"date\":1678918819.458,\"fromAccount\":\"5376210367\",\"toAccount\":\"1956797544\",\"amount\":245.34,\"description\":\"Amazon purchase\",\"location\":\"-11.297,-28.065\"}"
 6) "exercise:transaction:320144"
 7) 1) "$"
    2) "{\"id\":\"320144\",\"date\":1679872372.511,\"fromAccount\":\"4052206129\",\"toAccount\":\"8192028256\",\"amount\":308.93,\"description\":\"Car repair expense\",\"location\":\"-63.620,-26.208\"}"
 8) "exercise:transaction:859209"
 9) 1) "$"
    2) "{\"id\":\"859209\",\"date\":1678836334.951,\"fromAccount\":\"9260167207\",\"toAccount\":\"9062981215\",\"amount\":87.67,\"description\":\"Gym membership fee\",\"location\":\"126.537,-30.782\"}"
10) "exercise:transaction:386261"
11) 1) "$"
    2) "{\"id\":\"386261\",\"date\":1679826029.547,\"fromAccount\":\"9055818725\",\"toAccount\":\"7423560078\",\"amount\":438.86,\"description\":\"Online movie rental\",\"location\":\"-153.249,-27.738\"}"
```

The `LIMIT` option takes a starting point within the results and a total number of results to return. So, to get the fifth result you would enter:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index * LIMIT 4 1
1) (integer) 98
2) "exercise:transaction:386261"
3) 1) "$"
   2) "{\"id\":\"386261\",\"date\":1679826029.547,\"fromAccount\":\"9055818725\",\"toAccount\":\"7423560078\",\"amount\":438.86,\"description\":\"Online movie rental\",\"location\":\"-153.249,-27.738\"}"
```

If you tell LIMIT to return zero items, you will get only the count of items that match your query:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index * LIMIT 0 0
1) (integer) 98
```

You can also specify what fields you want to be returned with the `RETURN` option. This can use either the aliased we defined in `FT.CREATE`, JSONPath queries, or both:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index * RETURN 2 id $.amount
 1) (integer) 98
 2) "exercise:transaction:184247"
 3) 1) "id"
    2) "184247"
    3) "$.amount"
    4) "192.77"
 4) "exercise:transaction:827534"
 5) 1) "id"
    2) "827534"
    3) "$.amount"
    4) "245.34"
 6) "exercise:transaction:320144"
 7) 1) "id"
    2) "320144"
    3) "$.amount"
    4) "308.93"
 8) "exercise:transaction:859209"
 9) 1) "id"
    2) "859209"
    3) "$.amount"
    4) "87.67"
10) "exercise:transaction:386261"
11) 1) "id"
    2) "386261"
    3) "$.amount"
    4) "438.86"
12) "exercise:transaction:615181"
13) 1) "id"
    2) "615181"
    3) "$.amount"
    4) "431.99"
14) "exercise:transaction:542586"
15) 1) "id"
    2) "542586"
    3) "$.amount"
    4) "433.78"
16) "exercise:transaction:421262"
17) 1) "id"
    2) "421262"
    3) "$.amount"
    4) "469.74"
18) "exercise:transaction:285427"
19) 1) "id"
    2) "285427"
    3) "$.amount"
    4) "315.16"
20) "exercise:transaction:265457"
21) 1) "id"
    2) "265457"
    3) "$.amount"
    4) "161.35"
```

The `2` in the above command is similar to the number in the `PREFIX` option of `FT.CREATE`—it tells Redis how many arguments to expect. Interestingly, you can tell Redis to return `0` fields.

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index * RETURN 0
 1) (integer) 98
 2) "exercise:transaction:184247"
 3) "exercise:transaction:827534"
 4) "exercise:transaction:320144"
 5) "exercise:transaction:859209"
 6) "exercise:transaction:386261"
 7) "exercise:transaction:615181"
 8) "exercise:transaction:542586"
 9) "exercise:transaction:421262"
10) "exercise:transaction:285427"
11) "exercise:transaction:265457"
```

When you do this, you just get the key names back.


## Searching TEXT Fields ##

A TEXT field in Redis search indicates a field that contains human-readable text that we want to perform full-text search against. TEXT fields understand related words using a process called *stemming*. So RediSearch knows that a search for `give` should match text with `gives`, `gave`, `given`, and `giving`. TEXT fields also know that certain words—called *stopwords*—are common and not useful for search. Thus, words like `a`, `and`, and `the` are ignored when searching TEXT fields.

By default, RediSearch will search all text fields in the index. Let's find some transactions with the word `payment` in any TEXT field:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index bill RETURN 0
 1) (integer) 12
 2) "exercise:transaction:930386"
 3) "exercise:transaction:025542"
 4) "exercise:transaction:787148"
 5) "exercise:transaction:747674"
 6) "exercise:transaction:593666"
 7) "exercise:transaction:092470"
 8) "exercise:transaction:388710"
 9) "exercise:transaction:388401"
10) "exercise:transaction:888707"
11) "exercise:transaction:452020"
```

Looks like we got a few. So many bills to pay.

To search with a specific field, prefix it with the field name. Let's look for transactions with the word `payment` in the `description` field:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index @description:payment RETURN 0
 1) (integer) 37
 2) "exercise:transaction:184247"
 3) "exercise:transaction:352378"
 4) "exercise:transaction:930386"
 5) "exercise:transaction:751438"
 6) "exercise:transaction:068845"
 7) "exercise:transaction:098276"
 8) "exercise:transaction:025542"
 9) "exercise:transaction:766790"
10) "exercise:transaction:681781"
11) "exercise:transaction:942070"
```

Lots of payments. Guess that's why we have bank accounts.

So far, our queries haven't used quotes. But it's usually needed for anything beyond the most basic searches. Let's search for transactions sightings with the word `bill` and the word `payment` in the `description`:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@description:bill @description:payment" RETURN 0
 1) (integer) 12
 2) "exercise:transaction:930386"
 3) "exercise:transaction:025542"
 4) "exercise:transaction:787148"
 5) "exercise:transaction:747674"
 6) "exercise:transaction:593666"
 7) "exercise:transaction:092470"
 8) "exercise:transaction:388710"
 9) "exercise:transaction:388401"
10) "exercise:transaction:888707"
11) "exercise:transaction:452020"
```

Twelve again. Looks like every bill was a payment. That means that if we do an `or` instead of an `and`—which is what RediSearch does by default—we should get all 37 payments. Let's try it by adding a `|` between the two elements of our query:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@description:bill | @description:payment" RETURN 0
 1) (integer) 37
 2) "exercise:transaction:930386"
 3) "exercise:transaction:025542"
 4) "exercise:transaction:787148"
 5) "exercise:transaction:747674"
 6) "exercise:transaction:593666"
 7) "exercise:transaction:092470"
 8) "exercise:transaction:388710"
 9) "exercise:transaction:388401"
10) "exercise:transaction:888707"
11) "exercise:transaction:452020"
```

Yep. There're all our payments.


## Searching TAG Fields ##

TAG fields represent a single string or a collection of strings. They are stored in Hashes and JSON as comma-delimited strings like:

```
Checking,Savings,Money Market
```

In JSON, they can also be stored as any JSONPath that would return an array of strings. For example, look at the following JSON:

```json
{
  "customerId": "12345",
  "accounts": [
    {
      "accountNumber": "5558675309",
      "type": "Checking"
    },
    {
      "accountNumber": "2015551212",
      "type": "Checking"
    },
    {
      "accountNumber": "1234567890",
      "type": "Savings"
    }
  ]
}
```

You could create a TAG field with a JSONPath of `$.acounts[*].type`.

You can think of TAGs as the tags clouds on a blog. You can search for JSON documents and Hashes that contain a specific value within that TAG. So, you could search for `Checking` and any document tagged with `Checking` will be returned.

If you provide only a single value in a TAG, it can make an excellent key—foreign or primary. In the above JSON, you can specify a TAG field for the `customerId` property with a JSONPath of `$.customerId`. As all of the TAGs in our example are randomly generated, this is the primary scenario we'll be using in our examples.

You can search on a TAG field using the following syntax:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@fromAccount:{9018380779}" RETURN 0
1) (integer) 1
2) "exercise:transaction:452020"
```

You can search on documents tagged with one value *or* another with a `|`:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@fromAccount:{9018380779 | 2516807716}" RETURN 0
1) (integer) 2
2) "exercise:transaction:888707"
3) "exercise:transaction:452020"
```

You can search on documents tagged with one value *and* another by specifying the same field twice:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@fromAccount:{9018380779} @fromAccount:{2516807716}" RETURN 0
1) (integer) 0
```

Of course, transactions only come from a single account, so this returns zero results.

You can wildcard TAG fields. So, we can find all of the transactions that have a `fromAccount` that starts with a particular value:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@fromAccount:{90*}" RETURN 0
1) (integer) 2
2) "exercise:transaction:386261"
3) "exercise:transaction:452020"
```

Or that ends with one:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@fromAccount:{*79}" RETURN 0
1) (integer) 2
2) "exercise:transaction:798385"
3) "exercise:transaction:452020"
```

Or that contains one:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@fromAccount:{*00*}" RETURN 0
 1) (integer) 14
 2) "exercise:transaction:421262"
 3) "exercise:transaction:285427"
 4) "exercise:transaction:788526"
 5) "exercise:transaction:681781"
 6) "exercise:transaction:787148"
 7) "exercise:transaction:747674"
 8) "exercise:transaction:366843"
 9) "exercise:transaction:267842"
10) "exercise:transaction:388710"
11) "exercise:transaction:388401"
```

But you must specify at least two characters or you won't get any results at all:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@fromAccount:{*0*}" RETURN 0
1) (integer) 0
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@fromAccount:{*0}" RETURN 0
1) (integer) 0
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@fromAccount:{0*}" RETURN 0
1) (integer) 0
```


## Searching NUMERIC Fields ##

NUMERIC fields, unsurprisingly, contain numbers. These can be integers or floating-point numbers. If we have indexed JSON documents, these can be actual numbers in the JSON. If we are working with Hashes, these are Strings that contain numbers. Remember, in Redis, that Strings that contain numbers are stored as numbers internally. So, NUMERIC fields are actual numbers.

Searching NUMERIC fields in RediSearch is pretty easy. Just provide the upper and lower bounds for the number range you want for a particular field. For example, to find all transactions between $50.00 and $75.00 inclusive, we would issue the following query:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@amount:[50 75]" RETURN 1 amount
 1) (integer) 5
 2) "exercise:transaction:174450"
 3) 1) "amount"
    2) "59.59"
 4) "exercise:transaction:614815"
 5) 1) "amount"
    2) "52.67"
 6) "exercise:transaction:530901"
 7) 1) "amount"
    2) "71.04"
 8) "exercise:transaction:242538"
 9) 1) "amount"
    2) "65.58"
10) "exercise:transaction:888707"
11) 1) "amount"
    2) "70.89"
```

To make it *exclusive* instead of inclusive we add parentheses:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@amount:[(50 (75]" RETURN 1 amount
 1) (integer) 5
 2) "exercise:transaction:174450"
 3) 1) "amount"
    2) "59.59"
 4) "exercise:transaction:614815"
 5) 1) "amount"
    2) "52.67"
 6) "exercise:transaction:530901"
 7) 1) "amount"
    2) "71.04"
 8) "exercise:transaction:242538"
 9) 1) "amount"
    2) "65.58"
10) "exercise:transaction:888707"
11) 1) "amount"
    2) "70.89"
```

Not much of a change. In fact, looks identical. Try poking around with the query and see if you can prove to yourself that this works.

If you want to remove the upper limit, you can use `+inf` instead of a number:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@amount:[490 +inf]" RETURN 1 amount
 1) (integer) 5
 2) "exercise:transaction:192812"
 3) 1) "amount"
    2) "496.93"
 4) "exercise:transaction:747674"
 5) 1) "amount"
    2) "494.64"
 6) "exercise:transaction:778738"
 7) 1) "amount"
    2) "495.82"
 8) "exercise:transaction:469426"
 9) 1) "amount"
    2) "499.1"
10) "exercise:transaction:229655"
11) 1) "amount"
    2) "498.08"
```

If you want to remove the lower limit, you can use `-inf` in a similar way:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@amount:[-inf 10]" RETURN 1 amount
1) (integer) 3
2) "exercise:transaction:681781"
3) 1) "amount"
   2) "3.95"
4) "exercise:transaction:039585"
5) 1) "amount"
   2) "5.02"
6) "exercise:transaction:614745"
7) 1) "amount"
   2) "8.53"
```

And, if you really want to, you can specify `-inf` and `+inf` in the same query. This pretty much just makes sure that the amount is a number and will filter out things that are null or non-numeric:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@amount:[-inf +inf]" RETURN 1 amount LIMIT 0 0
1) (integer) 98
```

You can see here that there are 98 transactions with an amount, which is all of them.


## Searching GEO Fields ##

GEO fields contain a longitude and a latitude. But, for RediSearch to properly index them, they must be in a very specific format. That format is `<longitude>,<latitude>`. Many people, people like me, tend to think latitude and then longitude. Redis doesn't. Take a look at some of the GEO fields with a quick search to see how this formatting looks:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index * RETURN 1 location LIMIT 0 5
 1) (integer) 98
 2) "exercise:transaction:184247"
 3) 1) "location"
    2) "-150.471,-24.293"
 4) "exercise:transaction:827534"
 5) 1) "location"
    2) "-11.297,-28.065"
 6) "exercise:transaction:320144"
 7) 1) "location"
    2) "-63.620,-26.208"
 8) "exercise:transaction:859209"
 9) 1) "location"
    2) "126.537,-30.782"
10) "exercise:transaction:386261"
11) 1) "location"
    2) "-153.249,-27.738"
```

It's worth noting that beyond a certain degree of precision, RediSearch will no longer parse a coordinate. So, don't try to cram 14 decimals worth of precision into your coordinates. Anything more than 6 decimals (~10cm) is [probably pointless](https://en.wikipedia.org/wiki/Decimal_degrees) for your application.

To search a GEO field, we need to specify a longitude, a latitude, a radius, and a unit of measure for the radius. This finds all the transactions within 1,000 miles of Cincinnati:

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@location:[-84.5125 39.1 1000 mi]" RETURN 1 location
1) (integer) 2
2) "exercise:transaction:958874"
3) 1) "location"
   2) "-96.733,34.125"
4) "exercise:transaction:664148"
5) 1) "location"
   2) "-69.777,34.888"
```

Two. There are two. The coordinates were randomly generated so they're not exactly realistic! Many are probably in the middle of the ocean. ¯\_(ツ)_/¯

Regardless, valid units of measure are `m`, `km`, `mi`, and `ft`. I like the freedom units but you do you.

```bash
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@location:[-84.5125 39.1 5280000 ft]" RETURN 0 LIMIT 0 0
1) (integer) 2
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@location:[-84.5125 39.1 1500 km]" RETURN 0 LIMIT 0 0
1) (integer) 2
127.0.0.1:6379> FT.SEARCH exercise:transaction:index "@location:[-84.5125 39.1 1500000 m]" RETURN 0 LIMIT 0 0
1) (integer) 2
```
