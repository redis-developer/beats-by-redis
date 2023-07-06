# Workshop Prerequisites #

Having a few things pre-installed when you show up will help you get the most out of your time at the workshop. So, here's how to get Redis, Docker, and our sample application downloaded and running *before* you come and see us at the event.

0. Install Docker Desktop if you don't have it already. Follow the instructions at [docker.com](https://www.docker.com/).

1. Clone the repo:
```bash
git clone https://github.com/redis-developer/banking-on-redis.git
```

2. Enter the repository:
```bash
cd banking-on-redis
```

This application will be run locally with Docker. A Redis instance and the Node.js server will run concurrently. Note, if you have an instance of Redis running already *and* it's running on port `6379`, you'll need to stop it first or this will fail.

3. Start up Redis and the sample application using docker-compose:
```bash
docker-compose up --build
```

4. Make sure it's all working:

Once everything downloads and starts, you'll have a the following services running:

- *Redis* is now listening on port `6379`. Your code will talk to Redis on this port. Nothing for you to do here.

- *RedisInsight* is listening on port `8001`. To use it, open a browser and point it at [localhost:8001](http://localhost:8001). You'll see lots of data in there. We'll be using it during the workshop.

- The _Banking on Redis_ application itself is listening on port `8080`. Use a browser to access this at [localhost:8080](http://localhost:8080).

5. Once this is all running, shut it down until it's time for the workshop. Just hit Ctrl+C and it'll all shut down.

6. Show up at Redis Days Atlanta, attend the workshop, learn lots, and have a good time!
