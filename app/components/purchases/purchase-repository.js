import { Repository, Schema } from 'redis-om';

import { redis } from '../../om/client.js';

// TODO: should we add an array of embedded objects that contain all purchases for a specific artist? the embedded object could contain the specifics for the purchase, everything else would be top level to the JSON
const purchaseSchema = new Schema('purchase', {
  utc_date: { type: 'date', sortable: true },
  artist_name: { type: 'text' },
  item_description: { type: 'text' },
  album_title: { type: 'text' },
});

export const purchaseRepository = new Repository(purchaseSchema, redis);

await purchaseRepository.createIndex();
