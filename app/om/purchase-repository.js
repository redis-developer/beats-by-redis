import { Repository, Schema } from 'redis-om'

import { redis } from './client.js'

// TODO: should we add an array of embedded objects that contain all purchases for a specific artist? the embedded object could contain the specifics for the purchase, everything else would be top level to the JSON
const purchaseSchema = new Schema('purchase', {
  utc_date: { type: 'date', sortable: true},
  artist_name: { type: 'text'},
  item_type: { type: 'string'},
  item_description: { type: 'text'},
  album_title: { type: 'string'},
  slug_type: { type: 'string'},
  track_album_slug_text: { type: 'string'},
  currency: { type: 'string'},
  amount_paid: { type: 'number'},
  item_price: { type: 'number'},
  amount_paid_usd: { type: 'number'},
  country: { type: 'string'},
  releases: { type: 'string'},
  package_image_id: { type: 'string'},
  country_code: { type: 'string'},
  art_url: { type: 'string'},
})

export const purchaseRepository = new Repository(purchaseSchema, redis)

await purchaseRepository.createIndex()

