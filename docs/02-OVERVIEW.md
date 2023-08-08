# Beats By Redis Tutorial

Welcome to the Beats By Redis tutorial. In this tutorial you will learn all about the inner workings of Beats By Redis, specifically how all of the data flows in and out of Redis. When building applications on top of Redis you will likely use a higher-level client (such as [node-redis](https://www.npmjs.com/package/redis)) rather than directly calling Redis commands. The Beats By Redis app is no different, it uses node-redis to execute commands against Redis.

This tutorial takes things one level deeper and shows you the specific commands that node-redis uses. This is important because it will help you understand how Redis works and how to use Redis commands directly when you need to.

This tutorial is designed to be interactive. You will find buttons in the later sections that will automatically paste commands into the Workbench CLI window that you can then execute. To execute the commands you will need to click the play button. Let's try running the `PING` command:

```redis PING
PING
```

In order to run it you click the "PING" button, and then click the play button next to the command window. If you ran it correctly you should see "PONG." Assuming you have that figured out, it's time to move on to the next step!

This tutorial assumes you have followed the instructions in the [Setup](https://github.com/redis-developer/beats-by-redis/blob/main/docs/01-SETUP.md) instructions and have the Beats By Redis application running locally.
