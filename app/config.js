function parseRedisConnectionInfo() {
  let redisHost = process.env.REDIS_HOST ?? 'redis';
  let redisPort = process.env.REDIS_PORT ?? 6379;

  if (!/\/\//.test(redisHost)) {
    redisHost = `redis://${redisHost}`;
  }

  const parsedUrl = new URL(redisHost);

  redisHost = `${parsedUrl.protocol}//`;

  if (parsedUrl.username && parsedUrl.password) {
    redisHost += `${parsedUrl.username}:${parsedUrl.password}@`;
  }

  redisHost += parsedUrl.host;

  if (!redisPort) {
    redisPort = parsedUrl.port;
  }

  return {
    redisHost,
    redisPort,
  };
}

export const config = {
  expressPort: process.env.SERVER_PORT ?? 8080,
  ...parseRedisConnectionInfo(),
  session: {
    SECRET: process.env.SESSION_SECRET ?? '5UP3r 53Cr37',
  },
  auth: {
    ACCESS_PREFIX: 'access',
    REFRESH_PREFIX: 'refresh',
    TOKEN_EXPIRATION: [1, 'hour'],
    REFRESH_EXPIRATION: [120, 'days'],
    crypto: {
      SALT_ROUNDS: 1000,
      HASH_LENGTH: 64,
      SECRET: process.env.AUTH_SECRET ?? 'Amaze9-Thrill5-Disdain5-Fraying0',
      ALGORITHM_NAME: 'aes-128-gcm',
      ALGORITHM_NONCE_SIZE: 12,
      ALGORITHM_TAG_SIZE: 16,
      ALGORITHM_KEY_SIZE: 16,
      PBKDF2_NAME: 'sha512',
      PBKDF2_SALT_SIZE: 16,
      PBKDF2_ITERATIONS: 32767,
    },
  },
};
