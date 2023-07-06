# Using Streams #

To make things a bit easier, I've preloaded Redis with a stream of 100 randomly-generated events in the key `exercise:transactions`. This'll give you a decent number of things to query against when we get there.

But first, we'll add to it.

## Adding Events to a Stream ##

We add to a Stream using the [XADD](https://redis.io/commands/xadd/) command. Go ahead and add a couple of events:

```bash
127.0.0.1:6379> XADD exercise:transactions * toAccount 5558675309 fromAccount 2015551212 amount 12.34
"1681413276864-0"
```

```bash
127.0.0.1:6379> XADD exercise:transactions * toAccount 2015551212 fromAccount 5558675309 amount 100.99
"1681413282778-0"
```

XADD returns the ID of the event that was just added. Yours will be different from mine as I added them well before this event.

Not much to see here, really. But let's read what we have wrought.


## Reading Events ##

You read events from a Stream with the [XREAD](https://redis.io/commands/xread/) command. XREAD actually does quiet a bit. In its simplest form, it returns all of the events _after_ a particular key. Let's get everything since the start of the stream:

```
127.0.0.1:6379> XREAD STREAMS exercise:transactions 0-0
1) 1) "exercise:transactions"
   2)   1) 1) "1677641327288-0"
           2)  1) "id"
               2) "518452"
               3) "date"
               4) "1677641327288"
               5) "fromAccount"
               6) "7378540306"
               7) "toAccount"
               8) "5869900191"
               9) "amount"
              10) "267.21"
              11) "description"
              12) "House cleaning service payment"
              13) "longitude"
              14) "72.455"
              15) "latitude"
              16) "59.352"
        2) 1) "1677643989569-0"
           2)  1) "id"
               2) "125169"
               3) "date"
               4) "1677643989569"
               5) "fromAccount"
               6) "9550221958"
               7) "toAccount"
               8) "8624371484"
               9) "amount"
              10) "402.79"
              11) "description"
              12) "Airbnb booking"
              13) "longitude"
              14) "96.012"
              15) "latitude"
              16) "20.693"
...snip...
      101) 1) "1681413276864-0"
           2) 1) "toAccount"
              2) "5558675309"
              3) "fromAccount"
              4) "2015551212"
              5) "amount"
              6) "12.34"
      102) 1) "1681413282778-0"
           2) 1) "toAccount"
              2) "2015551212"
              3) "fromAccount"
              4) "5558675309"
              5) "amount"
              6) "100.99"
```

You can see that the earlier events are ones that were already there. The last two are the ones you just added.

Generally, getting everything isn't that useful. Let's just get the stuff that we added. To do that, we need to provide an event ID *before* the one we added. You should be able to pull this out of the response you just got.

```bash
127.0.0.1:6379> XREAD STREAMS exercise:transactions 1680291881007-0
1) 1) "exercise:transactions"
   2) 1) 1) "1681413276864-0"
         2) 1) "toAccount"
            2) "5558675309"
            3) "fromAccount"
            4) "2015551212"
            5) "amount"
            6) "12.34"
      2) 1) "1681413282778-0"
         2) 1) "toAccount"
            2) "2015551212"
            3) "fromAccount"
            4) "5558675309"
            5) "amount"
            6) "100.99"
```

What if we ask for events beyond the end of the Stream? Try it and find out. Read the Stream using the last event ID we received:

```bash
127.0.0.1:6379> XREAD STREAMS exercise:transactions 1681413282778-0
(nil)
```

You can also specify how many items you want back using `COUNT`. You'll get at most that many but sometimes less. Let's read the Stream in groups of 10. Start from the beginning:

```bash
127.0.0.1:6379> XREAD COUNT 10 STREAMS exercise:transactions 0-0
1) 1) "exercise:transactions"
   2)  1) 1) "1677641327288-0"
          2)  1) "id"
              2) "518452"
              3) "date"
              4) "1677641327288"
              5) "fromAccount"
              6) "7378540306"
              7) "toAccount"
              8) "5869900191"
              9) "amount"
             10) "267.21"
             11) "description"
             12) "House cleaning service payment"
             13) "longitude"
             14) "72.455"
             15) "latitude"
             16) "59.352"
...
      10) 1) "1677936313017-0"
          2)  1) "id"
              2) "170169"
              3) "date"
              4) "1677936313017"
              5) "fromAccount"
              6) "7390773947"
              7) "toAccount"
              8) "9354465376"
              9) "amount"
             10) "417.49"
             11) "description"
             12) "Yoga class payment"
             13) "longitude"
             14) "-95.837"
             15) "latitude"
             16) "-58.618"
```

Then pass in the ID from the last one you received and do it again:

```bash
127.0.0.1:6379> XREAD COUNT 10 STREAMS exercise:transactions 1677936313017-0
1) 1) "exercise:transactions"
   2)  1) 1) "1677947788413-0"
          2)  1) "id"
              2) "238499"
              3) "date"
              4) "1677947788413"
              5) "fromAccount"
              6) "0355136591"
              7) "toAccount"
              8) "7644995250"
              9) "amount"
             10) "82.93"
             11) "description"
             12) "Dental appointment payment"
             13) "longitude"
             14) "-63.594"
             15) "latitude"
             16) "7.648"
...snip...
```

Repeat until you've read the entire stream.


## Waiting for Events ##

One of the nice things about Streams is that they can make nifty queues. Redis will allow us to read from a Stream and will BLOCK until something new arrives. If there's something there, it returns immediately. If not, it waits a bit to find out.

Note that blocking commands don't work with the workbench in RedisInsight. So, you'll need to use the link labeled `>_CLI` in the bottom left which gives more of a command-line feel. So, click on that and let's try a blocking command against data that is already there:

```bash
127.0.0.1:6379> XREAD BLOCK 60000 COUNT 1 STREAMS exercise:transactions 0-0
1) 1) "exercise:transactions"
   2) 1) 1) "1677641327288-0"
         2)  1) "id"
             2) "518452"
             3) "date"
             4) "1677641327288"
             5) "fromAccount"
             6) "7378540306"
             7) "toAccount"
             8) "5869900191"
             9) "amount"
            10) "267.21"
            11) "description"
            12) "House cleaning service payment"
            13) "longitude"
            14) "72.455"
            15) "latitude"
            16) "59.352"
```

Here we've waited 60 seconds for something, anything. And we asked for just one item, mostly so your screen didn't fill up. But what if we are only interested in *new* events. Well, we use the special event ID of `$`:

```bash
127.0.0.1:6379> XREAD BLOCK 1000 COUNT 1 STREAMS exercise:transactions $
(nil)
(1.05s)
```

Here, we waited 1000ms and didn't get anything so Redis returned a `(nil)`. Let's give ourselves some more time and try to get a transaction in there. From the CLI inside of RedisInsight, enter a nice, patient command:

```bash
127.0.0.1:6379> XREAD BLOCK 300000 COUNT 1 STREAMS exercise:transactions $
```

Doesn't return much. Now, from *Workbench* add something to the Stream:

```bash
127.0.0.1:6379> XADD exercise:transactions * toAccount 5558675309 fromAccount 2015551212 amount 99.99
"1681414734509-0"
```

Note that the CLI responds immediately with the newly added event:

```bash
1) 1) "exercise:transactions"
   2) 1) 1) "1681414734509-0"
         2) 1) "toAccount"
            2) "5558675309"
            3) "fromAccount"
            4) "2015551212"
            5) "amount"
            6) "99.99"
(64.63s)
```

And, as you can see, the event IDs match. Hooray!

That's pretty much it for adding and reading Streams. Next, we'll look at a few other commands.


## Removing Events and Some Other Commands ##

You can delete an item from a Stream with the [XDEL](https://redis.io/commands/xdel/) command.

Let's delete the event you just added:

```bash
127.0.0.1:6379> xdel exercise:transactions 1681414734509-0
(integer) 1
```

And it's gone. Let's confirm it using the [XRANGE](https://redis.io/commands/xrange/) command. XRANGE works like XREAD except you just give it start and stop event IDs. If we give it a start and stop ID of the same value, it'll just return that event:

```bash
127.0.0.1:6379> XRANGE exercise:transactions 1681414734509-0 1681414734509-0
(empty array)
```

XRANGE supports a COUNT parameter as well. And it recognizes the special event ID of `+` which is the last item in the Stream and `-` which is the first. So, we could get the first item in the Stream like this:

```bash
127.0.0.1:6379> XRANGE exercise:transactions - + COUNT 1
1) 1) "1677641327288-0"
   2)  1) "id"
       2) "518452"
       3) "date"
       4) "1677641327288"
       5) "fromAccount"
       6) "7378540306"
       7) "toAccount"
       8) "5869900191"
       9) "amount"
      10) "267.21"
      11) "description"
      12) "House cleaning service payment"
      13) "longitude"
      14) "72.455"
      15) "latitude"
      16) "59.352"
```

The other way to remove items from a Stream is to trim it with [XTRIM](https://redis.io/commands/xtrim/). XTRIM has two modes of trimming. You can trim with MINID, or minimum ID, which removes anything before a given event ID. Or, you can trim with MAXLEN with ensures that the Stream has, as most, a given number of items in it.

Before we do that, let's check the length of the Stream using XLEN so we can see it change:

```bash
127.0.0.1:6379> XLEN exercise:transactions
(integer) 102
```

Now, let's trim stuff from before the middle of the stream:

```
127.0.0.1:6379> XTRIM exercise:transactions MINID 1678986077060-0
(integer) 50
```

> I used XRANGE to find the 51st item in the stream and get its ID so we could remove anything before it. What might that query look like?

And check the length again:
```bash
127.0.0.1:6379> XLEN exercise:transactions
(integer) 52
```

Let's get the first item. It should match the MINID we specified above:

```bash
127.0.0.1:6379> XRANGE exercise:transactions - + COUNT 1
1) 1) "1678986077060-0"
   2)  1) "id"
       2) "434413"
       3) "date"
       4) "1678986077060"
       5) "fromAccount"
       6) "5520287025"
       7) "toAccount"
       8) "8532913730"
       9) "amount"
      10) "20.85"
      11) "description"
      12) "Netflix subscription payment"
      13) "longitude"
      14) "40.939"
      15) "latitude"
      16) "-15.208"
```

Sure enough. It does.

Let's trim it with MAXLEN this time. We know we have 52 items. Let's split the deck:

```bash
127.0.0.1:6379> XTRIM exercise:transactions MAXLEN 26
(integer) 26
```

And confirm that our Stream is now even shorter:

```bash
127.0.0.1:6379> XLEN exercise:transactions
(integer) 26
```

And that's Streams. We now return you to your regularly scheduled instruction.
