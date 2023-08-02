/**
 *
 */
import crypto from 'crypto';
import util from 'util';
import { config } from '../config.js';

const cryptoConfig = config.auth.crypto;
const SALT_ROUNDS = cryptoConfig.SALT_ROUNDS;
const HASH_LENGTH = cryptoConfig.HASH_LENGTH;
const SECRET = cryptoConfig.SECRET;
const ALGORITHM_NAME = cryptoConfig.ALGORITHM_NAME;
const ALGORITHM_NONCE_SIZE = cryptoConfig.ALGORITHM_NONCE_SIZE;
const ALGORITHM_TAG_SIZE = cryptoConfig.ALGORITHM_TAG_SIZE;
const ALGORITHM_KEY_SIZE = cryptoConfig.ALGORITHM_KEY_SIZE;
const PBKDF2_NAME = cryptoConfig.PBKDF2_NAME;
const PBKDF2_SALT_SIZE = cryptoConfig.PBKDF2_SALT_SIZE;
const PBKDF2_ITERATIONS = cryptoConfig.PBKDF2_ITERATIONS;
const pbkdf2 = util.promisify(crypto.pbkdf2);

/**
 * Generates hash for the given password
 *
 * @param {string} password
 * @returns {Promise<{salt: string, hash: string}>}
 */
async function generateHash(password) {
  if (typeof password !== 'string') {
    throw new Error('Password must be a string');
  }

  // Creating a unique salt for a particular user
  const salt = crypto.randomBytes(16).toString('hex');

  // Hashing user's salt and passwordt
  const hash = crypto
    .pbkdf2Sync(password, salt, SALT_ROUNDS, HASH_LENGTH, PBKDF2_NAME)
    .toString(`hex`);

  return {
    salt,
    hash,
  };
}

/**
 * Checks if the given password matches the given hash
 *
 * @param {string} password
 * @param {string} hash
 * @param {string} salt
 * @returns {boolean}
 */
function checkPassword(password, hash, salt) {
  if (
    typeof password !== 'string' ||
    typeof hash !== 'string' ||
    typeof salt !== 'string'
  ) {
    return false;
  }

  const deCodedHash = crypto
    .pbkdf2Sync(password, salt, SALT_ROUNDS, HASH_LENGTH, PBKDF2_NAME)
    .toString(`hex`);
  return deCodedHash === hash;
}

/**
 * Encrypts the given text.
 *
 * @param {Buffer} text
 * @param {Buffer} key
 * @returns {Buffer}
 */
function encrypt(text, key) {
  // Generate a 96-bit nonce using a CSPRNG.
  const nonce = crypto.randomBytes(ALGORITHM_NONCE_SIZE);

  // Create the cipher instance.
  const cipher = crypto.createCipheriv(ALGORITHM_NAME, key, nonce);

  // Encrypt and prepend nonce.
  const cipherText = Buffer.concat([cipher.update(text), cipher.final()]);

  return Buffer.concat([nonce, cipherText, cipher.getAuthTag()]);
}

/**
 * Decrypts the given buffer.
 *
 * @param {Buffer} cipherTextAndNonce
 * @param {Buffer} key
 * @returns {Buffer}
 */
function decrypt(cipherTextAndNonce, key) {
  // Create buffers of nonce, cipherText and tag.
  const nonce = cipherTextAndNonce.subarray(0, ALGORITHM_NONCE_SIZE);
  const cipherText = cipherTextAndNonce.subarray(
    ALGORITHM_NONCE_SIZE,
    cipherTextAndNonce.length - ALGORITHM_TAG_SIZE,
  );
  const tag = cipherTextAndNonce.subarray(
    cipherText.length + ALGORITHM_NONCE_SIZE,
  );

  // Create the cipher instance.
  const cipher = crypto.createDecipheriv(ALGORITHM_NAME, key, nonce);

  // Decrypt and return result.
  cipher.setAuthTag(tag);

  return Buffer.concat([cipher.update(cipherText), cipher.final()]);
}

/**
 * Encrypts the given text.
 *
 * @param {string} text
 * @returns {Promise<string>}
 */
async function encode(text) {
  // Generate a 128-bit salt using a CSPRNG.
  const salt = crypto.randomBytes(PBKDF2_SALT_SIZE);

  // Derive a key using PBKDF2.
  const key = await pbkdf2(
    Buffer.from(SECRET, 'utf8'),
    salt,
    PBKDF2_ITERATIONS,
    ALGORITHM_KEY_SIZE,
    PBKDF2_NAME,
  );

  // Encrypt and prepend salt.
  const cipherTextAndNonceAndSalt = Buffer.concat([
    salt,
    encrypt(Buffer.from(text, 'utf8'), key),
  ]);

  // Return as base64 string.
  return cipherTextAndNonceAndSalt.toString('base64');
}

/**
 * Decrypts the given base64 string.
 *
 * @param {Buffer} base64CipherTextAndNonceAndSalt
 * @returns {Promise<string>}
 */
async function decode(base64CipherTextAndNonceAndSalt) {
  try {
    // Decode the base64.
    const cipherTextAndNonceAndSalt = Buffer.from(
      base64CipherTextAndNonceAndSalt,
      'base64',
    );

    // Create buffers of salt and cipherTextAndNonce.
    const salt = cipherTextAndNonceAndSalt.subarray(0, PBKDF2_SALT_SIZE);
    const cipherTextAndNonce =
      cipherTextAndNonceAndSalt.subarray(PBKDF2_SALT_SIZE);

    // Derive the key using PBKDF2.
    const key = await pbkdf2(
      Buffer.from(SECRET, 'utf8'),
      salt,
      PBKDF2_ITERATIONS,
      ALGORITHM_KEY_SIZE,
      PBKDF2_NAME,
    );

    // Decrypt and return result.
    return decrypt(cipherTextAndNonce, key).toString('utf8');
  } catch (e) {
    return '';
  }
}

export { generateHash, checkPassword, encode, decode };
