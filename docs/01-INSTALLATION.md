# Installation Instructions

Gotta get some Redis and get the code before we can do anything, right? So let's do that:

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

You will also want to download and install [RedisInsight](https://redis.com/redisinsight/) for working with and visualizing data.

## Running Locally With Docker (i.e. Easy Mode)

To start up the sample application, just start the Docker image in the traditional way:

```bash
docker-compose up -d
```

The Node.js server—that thing that is listening on port `8080` is using `nodemon`. So, you can make changes to the code while all this glorious stuff is running and the server will automatically reload.

## Confirming the Installation

Once you have successfully installed the application, you should be able to access it at [localhost:8080](http://localhost:8080). You should see the following:

![Beats By Redis login screen](login-screen.png)
