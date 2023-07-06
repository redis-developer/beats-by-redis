# Using RedisJSON #

[RedisJSON](https://redis.io/docs/stack/json/) is a module. Modules are plugins to Redis that extend it with new data structures and new commands. Anyone can [write a module](https://redis.io/docs/reference/modules/) if they are handy with a systems-level programing language like C or Rust.

RedisJSON, as you might have guessed based on the name, adds a JSON document data structure and [commands](https://redis.io/commands/?group=json) to manipulate those documents.

Let's try it out from RedisInsight first. Then we can take a look at changing our API to write out to JSON instead.

## Getting and Setting JSON ##

Let's store a simple transaction in RedisJSON using the [JSON.SET](https://redis.io/commands/json.set/) command:

```bash
127.0.0.1:6379> JSON.SET exercise:transaction:5558675309:123456 $ '{ "payee": "Justin Castilla", "amount": 123.45, "cleared": false }'
OK
```

Note that the JSON.SET command takes a JSON string. Since JSON strings are full of double quotes, I always use single quotes when providing this string. However, you *can* use double quotes if you want, you just need to escape the inner quotes. Like this:

```bash
127.0.0.1:6379> JSON.SET exercise:transaction:5558675309:123456 $ "{ \"payee\": \"Justin Castilla\", \"amount\": 123.45, \"cleared\": false }"
OK
```

Probably not worth it.

Now, let's get our JSON string using [JSON.GET](https://redis.io/commands/json.get/):

```bash
127.0.0.1:6379> JSON.GET exercise:transaction:5558675309:123456
"{\"payee\":\"Justin Castilla\",\"amount\":123.45,\"cleared\":false}"
```

We can get individual properties from our JSON document too. Just provide the path to the property you want to get in [JSONPath](https://redis.io/docs/stack/json/path/) syntax:

```bash
127.0.0.1:6379> JSON.GET exercise:transaction:5558675309:123456 $.payee
"[\"Justin Castilla\"]"
```

Note that a JSON array is returned. This can seem annoying, but since a JSONPath query might return multiple items, RedisJSON needs to return arrays. For example, let's say we have a JSON document in Redis that looks like this:

```json
{
  "transactions": [
    { "payee": "Justin Castilla", "amount": 123.45, "cleared": true },
    { "payee": "Guy Royse", "amount": 67.89, "cleared": true },
    { "payee": "Paul Ford", "amount": 9.99, "cleared": false }
  ]
}
```

If we queried it with a JSONPath of `$..payee`—which would return any property in the entire JSON document with the name of `userName`—we would get back an array of values.

Let's go ahead and try this out. Set the following JSON:

```bash
127.0.0.1:6379> JSON.SET exercise:transactions:5558675309 $ '{ "transactions": [ { "payee": "Justin Castilla", "amount": 123.45, "cleared": true }, { "payee": "Guy Royse", "amount": 67.89, "cleared": true}, { "payee": "Paul Ford", "amount": 9.99, "cleared": false } ] }'
OK
```

And let's query it with the aforementioned query:

```bash
127.0.0.1:6379> JSON.GET exercise:transactions:5558675309 $..payee
"[\"Justin Castilla\",\"Guy Royse\",\"Paul Ford\"]"
```

That array is kinda handy now.

Of course, you can query arrays and objects as well:

```bash
127.0.0.1:6379> JSON.GET exercise:transactions:5558675309 $.transactions
"[[{\"payee\":\"Justin Castilla\",\"amount\":123.45,\"cleared\":true},{\"payee\":\"Guy Royse\",\"amount\":67.89,\"cleared\":true},{\"payee\":\"Paul Ford\",\"amount\":9.99,\"cleared\":false}]]"
127.0.0.1:6379> JSON.GET exercise:transactions:5558675309 $.transactions[0]
"[{\"payee\":\"Justin Castilla\",\"amount\":123.45,\"cleared\":true}]"
```

You can also get multiple properties by providing multiple paths:

```bash
127.0.0.1:6379> JSON.GET exercise:transactions:5558675309 $..payee $..amount
"{\"$..payee\":[\"Justin Castilla\",\"Guy Royse\",\"Paul Ford\"],\"$..amount\":[123.45,67.89,9.99]}"
```

Note that when you provide multiple paths, you get back an object with each of your queries as property names. The values in those properties are the arrays from that query.

In addition to getting properties on a document, we can also set properties. Just provide the path to the property you want to set. If it doesn't exist, it will be created. If it does exist, it will be changed:

```bash
127.0.0.1:6379> JSON.SET exercise:transaction:5558675309:123456 $.memo '"Justin needs a new pair of hiking boots"'
OK
127.0.0.1:6379> JSON.SET exercise:transaction:5558675309:123456 $.transactionId '"123456"'
OK
127.0.0.1:6379> JSON.GET exercise:transaction:5558675309:123456
"{\"payee\":\"Justin Castilla\",\"amount\":123.45,\"cleared\":false,\"memo\":\"Justin needs a new pair of hiking boots\",\"transactionId\":\"5034\"}"
```

Note the odd syntax here. The values we are setting are JSON. For a string to be valid JSON, it needs to be in quotes, double quotes specifically. If we set a string in Redis, we need to put it in quotes. So, we wrap it in single quotes. Strings in strings. Yo dawg.

You can also set paths that match more than one property in a document. If you do, it will update everything that matches. Let's update all of our `payee` properties to a worthy human:

```bash
127.0.0.1:6379> JSON.SET exercise:transactions:5558675309 $..payee '"Alfred E. Neuman"'
OK
127.0.0.1:6379> JSON.GET exercise:transactions:5558675309
"{\"transactions\":[{\"payee\":\"Alfred E. Neuman\",\"amount\":123.45,\"cleared\":true},{\"payee\":\"Alfred E. Neuman\",\"amount\":67.89,\"cleared\":true},{\"payee\":\"Alfred E. Neuman\",\"amount\":9.99,\"cleared\":false}]}"
```

We'll cover one last command here: [JSON.DEL](https://redis.io/commands/json.del/). As you might imagine, this deletes all or part of a JSON document based on a JSONPath. Let's delete a transaction from `exercise:transactions:5558675309`:

```bash
127.0.0.1:6379> JSON.DEL exercise:transactions:5558675309 $.transactions[0]
(integer) 1
127.0.0.1:6379> JSON.GET exercise:transactions:5558675309
"{\"transactions\":[{\"payee\":\"Alfred E. Neuman\",\"amount\":67.89,\"cleared\":true},{\"payee\":\"Alfred E. Neuman\",\"amount\":9.99,\"cleared\":false}]}"
```

Our first user transaction, paid to Alfred E. Neuman for $123.45, has been removed.

If a JSONPath matches multiple properties in the document, everything matching will be removed. Let's remove the `cleared` property for all of our exercise:transactions:

```bash
127.0.0.1:6379> JSON.DEL exercise:transactions:5558675309 $.transactions[*].cleared
(integer) 2
127.0.0.1:6379> JSON.GET exercise:transactions:5558675309
"{\"transactions\":[{\"payee\":\"Alfred E. Neuman\",\"amount\":67.89},{\"payee\":\"Alfred E. Neuman\",\"amount\":9.99}]}"
```

If we delete all of the properties in the document, we have just an empty document:

```bash
127.0.0.1:6379> JSON.DEL exercise:transactions:5558675309 $.transactions
(integer) 1
127.0.0.1:6379> JSON.GET exercise:transactions:5558675309
"{}"
```

If we want to remove the JSON document itself, we need to delete the root. Or just call delete without a path:

```bash
127.0.0.1:6379> JSON.DEL exercise:transactions:5558675309 $
(integer) 1
127.0.0.1:6379> JSON.GET exercise:transactions:5558675309
(nil)
127.0.0.1:6379> JSON.DEL exercise:transaction:5558675309:123456
(integer) 1
127.0.0.1:6379> JSON.GET exercise:transaction:5558675309:123456
(nil)
```

That's plenty to get you started with RedisJSON. There are [lots of additional commands](https://redis.io/commands/?group=json) to manipulate JSON documents in Redis. I encourage you to play around with them.
