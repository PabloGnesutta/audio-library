process.env.SECRET_KEY = 'test-secret-key';

const AuthHelper = require('../../src/helper/AuthHelper');
const bcrypt = require('bcryptjs');

describe('AuthHelper.isValidEmailFormat', () => {
  test.each([
    ['user@example.com', true],
    ['user.name+tag@example.co.uk', true],
    ['not-an-email', false],
    ['missing@domain', false],
    ['@missing-local.com', false],
    ['', false],
  ])('%s -> %s', (email, expected) => {
    expect(AuthHelper.isValidEmailFormat(email)).toBe(expected);
  });
});

describe('AuthHelper.verifyPassword', () => {
  test('resolves true for a matching hash', async () => {
    const hash = await bcrypt.hash('correct-password', 4);
    await expect(AuthHelper.verifyPassword('correct-password', hash)).resolves.toBe(true);
  });

  test('resolves false for a non-matching hash', async () => {
    const hash = await bcrypt.hash('correct-password', 4);
    await expect(AuthHelper.verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });
});

describe('token sign/verify roundtrip', () => {
  test('createAccessToken produces a token validateToken can decode', async () => {
    const token = AuthHelper.createAccessToken({ userId: 'abc123' }, '1h');
    const decoded = await AuthHelper.validateToken(token);
    expect(decoded.data.userId).toBe('abc123');
  });

  test('validateToken rejects a garbage token with a 403', async () => {
    await expect(AuthHelper.validateToken('not.a.jwt')).rejects.toMatchObject({
      status: 403,
    });
  });

  test('validateToken rejects an expired token with a 401', async () => {
    const token = AuthHelper.createAccessToken({ userId: 'abc123' }, '-1s');
    await expect(AuthHelper.validateToken(token)).rejects.toMatchObject({
      status: 401,
      message: 'Token expired',
    });
  });
});
