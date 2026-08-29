const TokenFactory = require('../../src/factory/TokenFactory');

describe('TokenFactory.generate', () => {
  test('produces a hex string of the requested byte length', async () => {
    const token = await TokenFactory.generate(16);
    expect(token).toMatch(/^[0-9a-f]+$/);
    expect(token).toHaveLength(32);
  });

  test('defaults to 32 bytes (64 hex chars)', async () => {
    const token = await TokenFactory.generate();
    expect(token).toHaveLength(64);
  });

  test('produces different values on each call', async () => {
    const [a, b] = await Promise.all([TokenFactory.generate(), TokenFactory.generate()]);
    expect(a).not.toBe(b);
  });
});
