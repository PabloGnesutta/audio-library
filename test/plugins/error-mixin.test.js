import { describe, test, expect } from 'vitest';
import ErrorMixin from '../../src/plugins/error-mixin';

const formatError = ErrorMixin.methods._formatError;

describe('ErrorMixin._formatError', () => {
  test('extracts response.data from an axios-style error', () => {
    const err = { response: { data: 'Wrong credentials' } };
    expect(formatError(err)).toBe('Wrong credentials');
  });

  test('falls back to the response object when there is no data', () => {
    const response = { status: 500 };
    expect(formatError({ response })).toBe(response);
  });

  test('reads through a nested e.msg.response shape', () => {
    const err = { msg: { response: { data: 'Nested message' } } };
    expect(formatError(err)).toBe('Nested message');
  });

  test('falls back to e.message when there is no response', () => {
    expect(formatError(new Error('Plain failure'))).toBe('Plain failure');
  });

  test('falls back to the raw value when there is neither response nor message', () => {
    expect(formatError('a raw string error')).toBe('a raw string error');
  });
});
