# Installation Instructions #

Gotta get some Redis and get the code before we can do anything, right? So let's do that:

1. Clone the repo:
```bash
git clone https://github.com/redis-developer/banking-on-redis.git
```

2. Enter the repository:
```bash
cd banking-on-redis
```

Once installed you have some options on how you want to run this. We recommend using Docker but if you don't have Docker or don't like it for some reason, I've included some instructions on how to do it without Docker.


## Running Locally With Docker (i.e. Easy Mode) ##

This application can be run locally with Docker. A Redis instance and the Node.js server will run concurrently. Note, if you have an instance of Redis running already *and* it's running on port `6379`, you might want to stop it first or this will fail.

To start up Redis and the sample application, just start the Docker image in the traditional way:

```bash
docker-compose up --build
```

Redis is now listening on port `6379`. Your code will talk to Redis on this port. Nothing for you to do here.

RedisInsight is listening on port `8001`. To use it, open a browser and point it at [localhost:8001](http://localhost:8001).

And, the application itself is listening on port `8080`. Use a browser to access this at [localhost:8080](http://localhost:8080).

The Node.js server—that thing that is listening on port `8080` is using `nodemon`. So, you can make changes to the code while all this glorious stuff is running and the server will automatically reload.


## Running Locally Without Docker (i.e. Hard Mode) ##

This method has you downloading and installing a version of Redis on your machine. You'll start up Redis then start up the _Banking on Redis_ application.

There are a [few options](https://redis.io/docs/stack/get-started/install/) for installing Redis Stack locally. Pick one that makes sense for you and follow the instructions. We can help if you get stuck.

Depending on how you install Redis Stack, you might also need to install RedisInsight. [Instuctions for that](https://redis.com/redisinsight/) are online as well. Again, we can help if you get stuck.

To get the app running, you'll need to have a recent version of Node.js installed. We'll assume you are able to download and install that. Hopefully, you've got it already!

To start the application, do the following:

```bash
cd app
npm run dev:watch
```

You can do this later if you'd prefer.


## Confirming the Installation ##

You've got it all installed. Great! Let's do a quick test to ensure that Redis is running locally. Go to RedisInsight, select the workbench option or the CLI option, and then send a `PING` command. You should get a `PONG` back.

Like this:

```bash
127.0.0.1:6379> PING
PONG
```

And, as always, if you have any questions or need help, we're here to serve.
