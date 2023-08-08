# Using Redis for Searching and Querying

Note, this step in the tutorial assumes you have followed the instructions in the [Setup](https://github.com/redis-developer/beats-by-redis/blob/main/docs/01-SETUP.md) instructions and have the application running locally.

Redis Stack adds [indexing and full-text search](https://redis.io/docs/stack/search/) to Redis. You can use it to make your Hashes and JSON documents fully searchable. Searching in Redis is a _really_ big topic and would probably be suitable as a tutorial all its own. We're just going to cover the basics here. You can check out the [full search query syntax](https://redis.io/docs/stack/search/reference/query_syntax/) and learn more about what you can do.

In this section, we'll be using [FT.CREATE](https://redis.io/commands/ft.create/) to create an index, [FT.SEARCH](https://redis.io/commands/ft.search/) to search, and [FT.DROPINDEX](https://redis.io/commands/ft.dropindex/) to delete an index. We'll also use [FT.INFO](https://redis.io/commands/ft.info/) to get information about our index and [FT.\_LIST](https://redis.io/commands/ft._list/) to get a list of existing indices.

## Creating Indices

Let's create an index to use. Take a look at the following command. In fact, go ahead and run it:

```redis Create index
FT.CREATE purchases:index
  ON JSON
  PREFIX 1 purchase:
  SCHEMA
    $.utc_date AS utc_date NUMERIC
    $.utc_date_raw AS utc_date_raw NUMERIC
    $.artist_name AS artist_name TAG
    $.item_description AS item_description TEXT
    $.country AS country TAG
    $.album_title AS album_title TAG
```

Let's break this down a bit.

This creates an index named `purchases:index`. If you look for this index in your keyspace, you won't find it. But if you use the FT.\_LIST command, you will. Go ahead and try it:

```redis List indexes
FT._LIST
```

Yep. There it is. There are also a few other indexes that were created by the Beats By Redis app.

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

```redis Drop index
FT.DROPINDEX purchases:index
```

A quick check of the indices will confirm it is removed:

```redis List indexes
FT._LIST
```

And it's gone! Of course, we _want_ our index, `cuz we're gonna search against it. So go ahead and recreate it:

```redis Recreate index
FT.CREATE purchases:index
  ON JSON
  PREFIX 1 purchase:
  SCHEMA
    $.utc_date AS utc_date NUMERIC
    $.utc_date_raw AS utc_date_raw NUMERIC
    $.artist_name AS artist_name TAG
    $.item_description AS item_description TEXT
    $.country AS country TAG
    $.album_title AS album_title TEXT
```

## Searching Indices

We search our index using the FT.SEARCH command. The simplest of searches is a search for everything. Go ahead and try it out:

```redis Search for everything
FT.SEARCH purchases:index *
```

Redis returns a lot of data. The very first thing is the total number of items that matched our query: 7118 in my case. Yours will be difference based on how long you have been running the app. After that, you get the key name followed by the contents of that key. The contents for a Hash would be a series of field names followed by values. But for JSON, the "field name" is just `$` and then "value" is the JSON text.

You might have noticed that we only got 10 results back but we have more total results. The call to FT.SEARCH has a default limit of `10`. You can override this and paginate the results using the `LIMIT` option. Try just getting five results:

```redis Limit to 5 purchases
FT.SEARCH purchases:index * LIMIT 0 5
```

The `LIMIT` option takes a starting point within the results and a total number of results to return. So, to get the fifth result you would enter:

```redis Get fifth result
FT.SEARCH purchases:index * LIMIT 4 1
```

If you tell LIMIT to return zero items, you will get only the count of items that match your query:

```redis Get count of results
FT.SEARCH purchases:index * LIMIT 0 0
```

You can also specify what fields you want to be returned with the `RETURN` option. This can use either the aliased we defined in `FT.CREATE`, JSONPath queries, or both:

```redis Return fields
FT.SEARCH purchases:index * RETURN 2 $.utc_date $.artist_name
```

The `2` in the above command is similar to the number in the `PREFIX` option of `FT.CREATE`—it tells Redis how many arguments to expect. Interestingly, you can tell Redis to return `0` fields.

```redis Return no fields
FT.SEARCH purchases:index * RETURN 0
```

When you do this, you just get the key names back.

## Searching TEXT Fields

A TEXT field in Redis search indicates a field that contains human-readable text that we want to perform full-text search against. TEXT fields understand related words using a process called _stemming_. So Redis knows that a search for `give` should match text with `gives`, `gave`, `given`, and `giving`. TEXT fields also know that certain words—called _stopwords_—are common and not useful for search. Thus, words like `a`, `and`, and `the` are ignored when searching TEXT fields.

By default, Redis will search all text fields in the index. Let's find some purchases with the word `feat` in any TEXT field:

```redis Full-text search
FT.SEARCH purchases:index feat RETURN 0
```

Looks like we got a few. Plenty of albums with the word "feat" in the title.

To search with a specific field, prefix it with the field name. Let's look for transactions with the word `record` in the `item_description` field:

```redis Search specific field
FT.SEARCH purchases:index @item_description:record RETURN 0
```

Plenty of matching purchases with "record" in the description.

So far, our queries haven't used quotes. But it's usually needed for anything beyond the most basic searches. Let's search for transactions sightings with the word `go` and the word `feat` in the `item_description`:

```redis Search multiple words
FT.SEARCH purchases:index "@item_description:feat @item_description:go" RETURN 0
```

A lot fewer this time. If we do an `or` instead of an `and`—which is what Redis does by default—we should get more purchases. Let's try it by adding a `|` between the two elements of our query:

```redis OR Search
FT.SEARCH purchases:index "@item_description:feat | @item_description:go" RETURN 0
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

```redis Search TAG field
FT.SEARCH purchases:index "@country:{France}" RETURN 0
```

You can search on documents tagged with one value _or_ another with a `|`:

```redis Multiple OR TAG search
FT.SEARCH purchases:index "@country:{France | Germany}" RETURN 0
```

You can search on documents tagged with one value _and_ another by specifying the same field twice:

```redis Multiple AND TAG search
FT.SEARCH purchases:index "@country:{France} @country:{Germany}" RETURN 0
```

Of course, purchases only come from a single country, so this returns zero results.

You can wildcard TAG fields. So, we can find all of the purchases that have a `country` that starts with a particular value:

```redis TAG starts with
FT.SEARCH purchases:index "@country:{United*}" RETURN 0
```

Or that ends with one:

```redis TAG ends with
FT.SEARCH purchases:index "@country:{*States}" RETURN 0
```

Or that contains one:

```redis TAG contains
FT.SEARCH purchases:index "@country:{*ana*}" RETURN 0
```

But you must specify at least two characters or you won't get any results at all:

```redis Invalid TAG search
FT.SEARCH purchases:index "@country:{*y}" RETURN 0
```

## Searching NUMERIC Fields

NUMERIC fields, unsurprisingly, contain numbers. These can be integers or floating-point numbers. If we have indexed JSON documents, these can be actual numbers in the JSON. If we are working with Hashes, these are Strings that contain numbers. Remember, in Redis, that Strings that contain numbers are stored as numbers internally. So, NUMERIC fields are actual numbers.

Searching NUMERIC fields in RediSearch is pretty easy. Just provide the upper and lower bounds for the number range you want for a particular field. For example, to find all transactions between $50.00 and $75.00 inclusive, we would issue the following query:

```redis NUMERIC search
FT.SEARCH purchases:index "@utc_date:[1691195997 1691430627]" RETURN 1 utc_date
```

To make it _exclusive_ instead of inclusive we add parentheses:

```redis Exclusive NUMERIC search
FT.SEARCH purchases:index "@utc_date:[(1691195997 (1691430627]" RETURN 1 utc_date
```

Try poking around with the query and see if you can prove to yourself that this works. You may need to look at the `utc_date` values that exist in your application instance to figure it out.

If you want to remove the upper limit, you can use `+inf` instead of a number:

```redis No upper limit
FT.SEARCH purchases:index "@utc_date:[1691195997 +inf]" RETURN 1 utc_date
```

If you want to remove the lower limit, you can use `-inf` in a similar way:

```redis No lower limit
FT.SEARCH purchases:index "@utc_date:[-inf 1691430627]" RETURN 1 utc_date
```

And, if you really want to, you can specify `-inf` and `+inf` in the same query. This pretty much just makes sure that the amount is a number and will filter out things that are null or non-numeric:

```redis No limits
FT.SEARCH purchases:index "@utc_date:[-inf +inf]" RETURN 1 utc_date LIMIT 0 0
```

You can see here that there are 7641 transactions with an amount, which is all of them.
