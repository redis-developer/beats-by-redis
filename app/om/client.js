import { createClient } from 'redis';

import { config } from '../config.js';
const url = `redis://${config.redisHost}:${config.redisPort}`;

export const redis = createClient({ url });

/* Secondary redis connection for the blocking XREADGROUP command */
export const redisStreamClient = redis.duplicate();

redis.on('error', (error) => console.log('Redis Client Error', error));
redisStreamClient.on('error', (error) => console.log('Redis Stream Client Error', error));

await redis.connect();
await redisStreamClient.connect();
