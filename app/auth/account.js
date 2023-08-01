import moment from 'moment';
import { EntityId } from 'redis-om';
import { userRepository } from '../om/user-repository.js';
import { checkPassword, decode, encode, generateHash } from './security.js';
import { sessionRepository } from '../om/session-repository.js';

const ACCESS_PREFIX = 'access';
const REFRESH_PREFIX = 'refresh';

/**
 * Create an access token
 * 1. Create session in db
 * 2. Create access token
 * 3. Create refresh token
 * 4. Return both tokens
 *
 * @param {string} userId
 * @returns {Promise<{tokenexpireson: Date, refreshexpireson: Date, token: string, refresh: string}>}
 */
async function createAccessToken(userId) {
  const session = await sessionRepository.save({
    tokenexpireson: moment.utc().add(1, 'hour').toDate(),
    refreshexpireson: moment.utc().add(120, 'days').toDate(),
    userId,
  });
  const token = await encode(`${ACCESS_PREFIX}_${session[EntityId]}`);
  const refresh = await encode(`${REFRESH_PREFIX}_${session[EntityId]}`);

  return {
    tokenexpireson: session.tokenexpireson,
    refreshexpireson: session.refreshexpireson,
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
 * @param {string} refreshToken
 * @returns {Promise<{tokenexpireson: Date, refreshexpireson: Date, token: string, refresh: string}>}
 */
async function refresh(refreshToken) {
  if (typeof refreshToken !== 'string') {
    throw new Error('Expired');
  }

  const decoded = await decode(refreshToken);

  if (!decoded.startsWith(REFRESH_PREFIX)) {
    throw new Error('Expired');
  }

  const entityId = decoded.replace(`${REFRESH_PREFIX}_`, '');
  const session = await sessionRepository.fetch(entityId);

  if (!session || session.refreshexpireson < moment.utc().toDate()) {
    throw new Error('Expired');
  }

  await sessionRepository.remove(entityId);
  const user = await userRepository.fetch(session.userId);

  if (!user) {
    throw new Error('Expired');
  }

  return createAccessToken(session.userId);
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
 * @returns {Promise<{tokenexpireson: Date, refreshexpireson: Date, token: string, refresh: string}>}
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
    throw new Error('Login failed, invalid credentials');
  }

  const isPasswordCorrect = await checkPassword(
    password,
    dbUser.hash,
    dbUser.salt,
  );

  if (!isPasswordCorrect) {
    throw new Error('Login failed, invalid credentials');
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
 * @returns {Promise<{tokenexpireson: Date, refreshexpireson: Date, token: string, refresh: string}>}
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
    const sessionId = accessToken.replace(`${ACCESS_PREFIX}_`, '');
    const session = await sessionRepository.fetch(sessionId);

    if (!session) {
        return;
    }

    const { userId, tokenexpireson } = session;

    if (tokenexpireson < moment.utc().toDate() && refreshToken) {
        const result = await refresh(refreshToken);

        return getUserWithToken(result);
    }

    const user = await userRepository.fetch(userId);

    return user;
}

export { login, register, createAccessToken, refresh, getUserWithToken };
