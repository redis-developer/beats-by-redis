import { Repository, Schema } from 'redis-om';

import { redis } from './client.js';

const sessionSchema = new Schema('session', {
  tokenexpireson: { type: 'date', indexed: false },
  refreshexpireson: { type: 'date', indexed: false },
  entityId: { type: 'string' },
});

export const sessionRepository = new Repository(sessionSchema, redis);

await sessionRepository.createIndex();
