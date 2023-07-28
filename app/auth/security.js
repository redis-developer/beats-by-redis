/**
 *
 */
import crypto from 'crypto';
import util from 'util';

const SALT_ROUNDS = 1000;
const HASH_LENGTH = 64;
const SECRET = process.env.AUTH_SECRET ?? 'Amaze9-Thrill5-Disdain5-Fraying0';
const ALGORITHM_NAME = 'aes-128-gcm';
const ALGORITHM_NONCE_SIZE = 12;
const ALGORITHM_TAG_SIZE = 16;
const ALGORITHM_KEY_SIZE = 16;
const PBKDF2_NAME = 'sha512';
const PBKDF2_SALT_SIZE = 16;
const PBKDF2_ITERATIONS = 32767;
const pbkdf2 = util.promisify(crypto.pbkdf2);

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

async function checkPassword(password, hash, salt) {
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

function encrypt(text, key) {
  // Generate a 96-bit nonce using a CSPRNG.
  const nonce = crypto.randomBytes(ALGORITHM_NONCE_SIZE);

  // Create the cipher instance.
  const cipher = crypto.createCipheriv(ALGORITHM_NAME, key, nonce);

  // Encrypt and prepend nonce.
  const cipherText = Buffer.concat([cipher.update(text), cipher.final()]);

  return Buffer.concat([nonce, cipherText, cipher.getAuthTag()]);
}

function decrypt(cipherTextAndNonce, key) {
  // Create buffers of nonce, cipherText and tag.
  const nonce = cipherTextAndNonce.slice(0, ALGORITHM_NONCE_SIZE);
  const cipherText = cipherTextAndNonce.slice(
    ALGORITHM_NONCE_SIZE,
    cipherTextAndNonce.length - ALGORITHM_TAG_SIZE,
  );
  const tag = cipherTextAndNonce.slice(
    cipherText.length + ALGORITHM_NONCE_SIZE,
  );

  // Create the cipher instance.
  const cipher = crypto.createDecipheriv(ALGORITHM_NAME, key, nonce);

  // Decrypt and return result.
  cipher.setAuthTag(tag);

  return Buffer.concat([cipher.update(cipherText), cipher.final()]);
}

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

async function decode(base64CipherTextAndNonceAndSalt) {
  try {
    // Decode the base64.
    const cipherTextAndNonceAndSalt = Buffer.from(
      base64CipherTextAndNonceAndSalt,
      'base64',
    );

    // Create buffers of salt and cipherTextAndNonce.
    const salt = cipherTextAndNonceAndSalt.slice(0, PBKDF2_SALT_SIZE);
    const cipherTextAndNonce =
      cipherTextAndNonceAndSalt.slice(PBKDF2_SALT_SIZE);

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
