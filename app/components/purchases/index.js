export * as generator from './purchase-generator.js';
export * from './purchase-router.js';
import { purchaseRepository } from './purchase-repository.js';

export const repositories = {
  purchase: purchaseRepository,
};
