import { Repository, Schema } from 'redis-om';

import { redis } from '../../om/client.js';

const accountSchema = new Schema('account', {
  tokenExpiresOn: { type: 'date', indexed: false },
  refreshExpiresOn: { type: 'date', indexed: false },
  entityId: { type: 'string' },
});

export const accountRepository = new Repository(accountSchema, redis);

await accountRepository.createIndex();
