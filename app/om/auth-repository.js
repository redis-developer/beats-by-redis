import { Repository, Schema } from 'redis-om';

import { redis } from './client.js';

const authSchema = new Schema('auth', {
  tokenExpiresOn: { type: 'date', indexed: false },
  refreshExpiresOn: { type: 'date', indexed: false },
  entityId: { type: 'string' },
});

export const authRepository = new Repository(authSchema, redis);

await authRepository.createIndex();
