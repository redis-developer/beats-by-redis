export * as authenticator from './account-authenticator.js';
export * as middleware from './account-middleware.js';
export * from './account-router.js';
import { accountRepository } from './account-repository.js';
import { userRepository } from './account-user-repository.js';

export const repositories = {
    account: accountRepository,
    user: userRepository,
};
