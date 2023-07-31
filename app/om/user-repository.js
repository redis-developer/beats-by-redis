import { Repository, Schema } from 'redis-om';

import { redis } from './client.js';

const userSchema = new Schema('user', {
  username: { type: 'string' },
  hash: { type: 'string', indexed: false },
  salt: { type: 'string', indexed: false },
});

export const userRepository = new Repository(userSchema, redis);

await userRepository.createIndex();
