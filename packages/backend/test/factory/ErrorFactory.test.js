const ErrorFactory = require('../../src/factory/ErrorFactory');
const BusinessError = require('../../src/exception/BusinessError');
const SystemError = require('../../src/exception/SystemError');

describe('ErrorFactory.create', () => {
  test('passes a 400 (BusinessError) through unchanged', () => {
    const businessError = new BusinessError('Email already taken');
    const result = ErrorFactory.create(businessError, 'fallback message');
    expect(result).toBe(businessError);
    expect(result.status).toBe(400);
  });

  test('wraps a non-400 error into a SystemError with the fallback message', () => {
    const dbError = new Error('connection refused');
    const result = ErrorFactory.create(dbError, 'Error while doing X');
    expect(result).toBeInstanceOf(SystemError);
    expect(result.status).toBe(500);
    expect(result.message).toBe('Error while doing X');
  });

  test('wraps an error with no fallback message into a generic SystemError', () => {
    const result = ErrorFactory.create(new Error('boom'));
    expect(result).toBeInstanceOf(SystemError);
    expect(result.message).toBe('System error');
  });
});
