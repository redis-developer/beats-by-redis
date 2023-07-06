import { createClient } from 'redis'

import { config } from '../config.js'
const url = `redis://${config.redisHost}:${config.redisPort}`

export const redis = createClient({ url })

/* Secondary redis connection for the blocking XREAD command */
export const redis2 = redis.duplicate()

redis.on('error', error => console.log('Redis Client Error', error))

await redis.connect()
await redis2.connect()