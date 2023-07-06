export const config = {
    expressPort: process.env.SERVER_PORT ?? 8080,
    redisHost: process.env.REDIS_HOST ?? 'redis',
    redisPort: process.env.REDIS_PORT ?? 6379,
}