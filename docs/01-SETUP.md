# Setup Instructions

This tutorial serves as an interactive guide to walk you through all of the features of Beats By Redis. It provides a custom RedisInsight tutorial that you can import directly into RedisInsight, where you can work with the data in real-time. The goal of this tutorial is to show you how to run the Beats By Redis app locally, and then use that data to learn about Redis Streams, JSON, Search, Sorted Sets, and Time Series.

Before you begin, you will need to follow the steps below:

1. Clone the repo:

```bash
git clone https://github.com/redis-developer/beats-by-redis.git
```

2. Enter the repository:

```bash
cd beats-by-redis
```

Once installed you have some options on how you want to run this. We recommend using a [free Redis Cloud database](https://redis.com/try-free) for Redis and Docker for the client app.

## Using A Free Redis Cloud Database

Visit [redis.com/try-free](https://redis.com/try-free) and sign up for a free account. Once you've done that, create a database. You'll need the connection information for the database you create. Below is a gif showing how to get your connection string:

![Redis Cloud connection string](redis-cloud-connection-string.gif)

With your connection string, you'll need to create a `.env` file. The `.env` file is used by the Node.js application to get the connection information for Redis. You can copy `.env.example` to `.env` and start from there. The `.env` file should look like this:

```bash
REDIS_HOST=<username>:<password>@<host>
REDIS_PORT=<port>
AUTH_SECRET=<your-secret>
SESSION_SECRET=<your-secret>
```

So if your connection string is `redis://default:kKLjflk3k24kmnNLLKDJj3k@redis-12345.c12.us-east-1-2.ec2.cloud.redislabs.com:12345`, and you want to use `p1zz4` as your secret, your `.env` file would look like this:

```bash
REDIS_HOST=redis://default:kKLjflk3k24kmnNLLKDJj3k@redis-12345.c12.us-east-1-2.ec2.cloud.redislabs.com
REDIS_PORT=12345
AUTH_SECRET=p1zz4
SESSION_SECRET=p1zz4
```

NOTE: The `AUTH_SECRET` and `SESSION_SECRET` are values used for signing cookies and encrypting tokens. You can make these whatever you want, but they should be random.

## Running Locally With Docker (i.e. Easy Mode)

To start up the sample application, just start the Docker image in the traditional way:

```bash
docker compose up -d
```

The Node.js server—that thing that is listening on port `8080` is using `nodemon`. So, you can make changes to the code while all this glorious stuff is running and the server will automatically reload.

## Confirming the Installation

Once you have successfully installed the application, you should be able to access it at [localhost:8080](http://localhost:8080). You should see the following:

![Beats By Redis login screen](login-screen.png)

In order to get to the dashboard, you will need to click the "Sign up here" link and register an account. This is all local to your Redis database, so you can use whatever you want for your username and password. Just make sure to remember it. Registering will automatically log you in as well.

## RedisInsight Tutorial

The rest of this tutorial will utilize the interactive tutorials feature of RedisInsight. Since you already have the app running, you will use RedisInsight to import the tutorial and then work with your data in real-time. Follow the steps below to get setup.

1. If you haven't already, download and install [RedisInsight](https://redis.com/redisinsight/) for working with and visualizing data.
2. Open RedisInsight and add a database. Use the same connection string you copied earlier in this tutorial, and follow the GIF below:
   ![RedisInsight add database](redisinsight-add-database.gif)
3. Once you have connected to your database, you should see some of the keys added by the Beats By Redis app. In order to import the tutorial, you will need to click the "Workbench" icon on the left side of the RedisInsight. Follow the GIF below if you are stuck:
   ![RedisInsight Workbench](workbench-custom-tutorial.gif)
4. In Workbench, click "Upload tutorial," copy/paste the following link, and then click "Submit"

```
https://redis.com/wp-content/uploads/2023/08/beats-by-redisinsight.zip
```

5. Alternatively, you can upload the [./beats-by-redisinsight.zip](./beats-by-redisinsight.zip) file.
6. You should now see "BEATS BY REDIS" under "My Tutorials." Click on it to proceed.

The rest of this tutorial will be self-guided within RedisInsight. If you are having trouble, feel free to drop a question in our [Discord](https://discord.gg/redis) server.
