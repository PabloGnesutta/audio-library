import { describe, test, expect } from 'vitest';
import Helpers from '../../src/helpers/helper-functions';

describe('computeHHMMSS', () => {
  test.each([
    [0, { hh: 0, mm: '00', ss: '00' }],
    [65, { hh: 0, mm: '01', ss: '05' }],
    [3661, { hh: 1, mm: '01', ss: '01' }],
  ])('%i seconds -> %j', (input, expected) => {
    expect(Helpers.computeHHMMSS(input)).toEqual(expected);
  });
});

describe('toHHMMSS', () => {
  test('omits the hour segment when under an hour', () => {
    expect(Helpers.toHHMMSS(125)).toBe('02:05');
  });

  test('includes the hour segment when an hour or more', () => {
    expect(Helpers.toHHMMSS(3725)).toBe('1:02:05');
  });
});

describe('toHHMMSSNoTrim', () => {
  test('always zero-pads the hour segment', () => {
    expect(Helpers.toHHMMSSNoTrim(65)).toEqual({ hh: '00', mm: '01', ss: '05' });
  });
});
