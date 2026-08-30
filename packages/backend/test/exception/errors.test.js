const BusinessError = require('../../src/exception/BusinessError');
const SystemError = require('../../src/exception/SystemError');

describe('BusinessError', () => {
  test('sets status 400 and preserves the message', () => {
    const err = new BusinessError('Invalid email');
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(400);
    expect(err.message).toBe('Invalid email');
  });
});

describe('SystemError', () => {
  test('sets status 500 and preserves the message', () => {
    const err = new SystemError('Something broke');
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(500);
    expect(err.message).toBe('Something broke');
  });
});
