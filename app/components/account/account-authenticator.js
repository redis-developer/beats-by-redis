import moment from 'moment';
import { EntityId } from 'redis-om';
import { userRepository } from './account-user-repository.js';
import { checkPassword, decode, encode, generateHash } from './account-security.js';
import { accountRepository } from './account-repository.js';
import { config } from '../../config.js';

const authConfig = config.auth;
const ACCESS_PREFIX = authConfig.ACCESS_PREFIX;
const REFRESH_PREFIX = authConfig.REFRESH_PREFIX;

/**
 * Create an access token
 * 1. Create session in db
 * 2. Create access token
 * 3. Create refresh token
 * 4. Return both tokens
 *
 * @param {string} userId
 * @returns {Promise<{tokenExpiresOn: Date, refreshExpiresOn: Date, token: string, refresh: string}>}
 */
async function createAccessToken(userId) {
  const tokenExpiresOn = moment
    .utc()
    .add(...authConfig.TOKEN_EXPIRATION)
    .toISOString();
  const refreshExpiresOn = moment
    .utc()
    .add(...authConfig.REFRESH_EXPIRATION)
    .toISOString();

  const auth = await accountRepository.save({
    tokenExpiresOn,
    refreshExpiresOn,
    userId,
  });

  const duration = moment.duration(moment(refreshExpiresOn).diff(moment()));
  await accountRepository.expire(auth[EntityId], Math.round(duration.asSeconds()));

  const token = await encode(
    `${ACCESS_PREFIX}_${auth[EntityId]}_${tokenExpiresOn}`,
  );
  const refresh = await encode(
    `${REFRESH_PREFIX}_${token}_${refreshExpiresOn}`,
  );

  return {
    tokenExpiresOn: auth.tokenExpiresOn,
    refreshExpiresOn: auth.refreshExpiresOn,
    token,
    refresh,
  };
}

/**
 * Refresh an access token
 *
 * 1. Decode refresh token
 * 2. Lookup session in db
 * 3. Remove session from db
 * 4. Lookup user in db, make sure one exists
 * 5. Create and return access token
 *
 * @param {string} accessToken
 * @param {string} refreshToken
 * @returns {Promise<{tokenExpiresOn: Date, refreshExpiresOn: Date, token: string, refresh: string}>}
 */
async function refresh(accessToken, refreshToken) {
  if (typeof refreshToken !== 'string') {
    throw new Error('Invalid user credentials');
  }

  const decoded = await decode(refreshToken);

  if (!decoded.startsWith(REFRESH_PREFIX)) {
    throw new Error('Invalid user credentials');
  }

  const [, embeddedAccessToken, expiresOn] = decoded.split('_');

  if (
    !expiresOn ||
    moment(expiresOn).isBefore(moment()) ||
    embeddedAccessToken !== accessToken
  ) {
    throw new Error('Expired user credentials');
  }

  const decodedAccessToken = await decode(embeddedAccessToken);
  const [, authEntityId] = decodedAccessToken.split('_');
  const auth = await accountRepository.fetch(authEntityId);

  if (!auth) {
    throw new Error('Invalid user credentials');
  }

  await accountRepository.remove(authEntityId);
  const user = await userRepository.fetch(auth.userId);

  if (!user) {
    throw new Error('Invalid user credentials');
  }

  return createAccessToken(auth.userId);
}

/**
 * Login a user
 *
 * 1. Lookup username in db, get hash
 * 2. Check password
 * 3. If correct, create and return access token
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{tokenExpiresOn: Date, refreshExpiresOn: Date, token: string, refresh: string}>}
 */
async function login(username, password) {
  // lookup username in db, get hash
  // check password
  // if correct, create access token
  const dbUser = await userRepository
    .search()
    .where('username')
    .equals(username)
    .first();

  if (!dbUser) {
    throw new Error('Login failed, invalid user credentials');
  }

  const isPasswordCorrect = checkPassword(password, dbUser.hash, dbUser.salt);

  if (!isPasswordCorrect) {
    throw new Error('Login failed, invalid user credentials');
  }

  return createAccessToken(dbUser[EntityId]);
}

/**
 * Register a new user
 *
 * 1. Check if user exists
 * 2. Generate hash
 * 3. Save user
 * 4. Create and return access token
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{tokenExpiresOn: Date, refreshExpiresOn: Date, token: string, refresh: string}>}
 */
async function register(username, password) {
  const dbUser = await userRepository
    .search()
    .where('username')
    .equals(username)
    .count();

  if (dbUser > 0) {
    throw new Error('User already exists');
  }

  const { hash, salt } = await generateHash(password);

  const user = await userRepository.save({
    username,
    hash,
    salt,
  });

  return createAccessToken(user[EntityId]);
}

async function getUserWithToken({ token, refresh: refreshToken }) {
  if (!token) {
    return;
  }

  const accessToken = await decode(token);

  if (!(accessToken && accessToken.startsWith(ACCESS_PREFIX))) {
    return;
  }

  const [, authEntityId, tokenExpiresOn] = accessToken.split('_');

  if (
    (!tokenExpiresOn || moment(tokenExpiresOn).isBefore(moment())) &&
    refreshToken
  ) {
    const result = await refresh(token, refreshToken);

    return getUserWithToken(result);
  }

  const auth = await accountRepository.fetch(authEntityId);

  if (!auth) {
    return;
  }

  const { userId } = auth;
  const user = await userRepository.fetch(userId);

  if (!user || !user[EntityId]) {
    return;
  }

  return user;
}

export { login, register, createAccessToken, refresh, getUserWithToken };
