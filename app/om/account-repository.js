import { Repository, Schema } from 'redis-om'

import { redis } from './client.js'

const accountSchema = new Schema('account', {
  accountNumber: { type: 'string' },
  firstName: { type: 'string', path: '$.name.first' },
  lastName: { type: 'string', path: '$.name.last' },
  balance: { type: 'number' },
  asOfDate: { type: 'date' }
})

export const accountRepository = new Repository(accountSchema, redis)

await accountRepository.createIndex()
