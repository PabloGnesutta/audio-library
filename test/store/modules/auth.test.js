import { describe, test, expect, beforeEach } from 'vitest';
import authModule from '../../../src/store/modules/auth';

const { mutations } = authModule;

describe('auth store mutations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('setUser stores the payload and marks it loaded', () => {
    const state = { user: {} };
    mutations.setUser(state, { email: 'a@b.com' });
    expect(state.user).toEqual({ email: 'a@b.com', loaded: true });
  });

  test('doLogout clears the user and stored tokens', () => {
    localStorage.setItem('accessToken', 'a');
    localStorage.setItem('refreshToken', 'r');
    const state = { user: { email: 'a@b.com', loaded: true } };

    mutations.doLogout(state);

    expect(state.user).toEqual({});
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  test('setAccessToken/setRefreshToken persist to localStorage', () => {
    mutations.setAccessToken({}, 'access-123');
    mutations.setRefreshToken({}, 'refresh-456');

    expect(localStorage.getItem('accessToken')).toBe('access-123');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-456');
  });
});
