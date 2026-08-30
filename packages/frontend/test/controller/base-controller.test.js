import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store', () => ({
  default: { commit: vi.fn() },
}));

vi.mock('axios', () => {
  const mockAxios = vi.fn(); // axios(originalRequest) in resendRequest()
  mockAxios.create = vi.fn(() => ({
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }));
  mockAxios.post = vi.fn(); // the refresh-token request
  return { default: mockAxios };
});

const axios = (await import('axios')).default;
const store = (await import('@/store')).default;
const { handleResponseError } = await import('../../src/controller/base-controller');

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('handleResponseError', () => {
  // Regression test: this used to read error.response.status unconditionally,
  // throwing a TypeError on any network-level failure (backend down, CORS,
  // timeout) instead of forwarding the real error (see DIAGNOSIS.md).
  test('forwards a network-level error (no .response) instead of throwing', async () => {
    const networkError = new Error('Network Error');
    await expect(handleResponseError(networkError)).rejects.toBe(networkError);
  });

  test('forwards non-401 errors unchanged', async () => {
    const err = { response: { status: 500 } };
    await expect(handleResponseError(err)).rejects.toBe(err);
  });

  test('logs out and rejects when there is a 401 but no refresh token stored', async () => {
    const err = { response: { status: 401 }, config: {} };
    await expect(handleResponseError(err)).rejects.toBe(err);
    expect(store.commit).toHaveBeenCalledWith('auth/doLogout');
  });

  // Regression test: a failed token refresh used to call handleTokenError()
  // without returning/throwing, so the original request's promise silently
  // resolved as undefined instead of rejecting (see DIAGNOSIS.md).
  test('rejects with the original error when the refresh token is also invalid', async () => {
    localStorage.setItem('refreshToken', 'stale-refresh-token');
    axios.post.mockRejectedValue(new Error('refresh failed'));
    const originalError = { response: { status: 401 }, config: {} };

    await expect(handleResponseError(originalError)).rejects.toBe(originalError);
    expect(store.commit).toHaveBeenCalledWith('auth/doLogout');
  });

  test('resolves with the retried response when the refresh succeeds', async () => {
    localStorage.setItem('refreshToken', 'valid-refresh-token');
    axios.post.mockResolvedValue({ data: 'new-access-token' });
    axios.mockResolvedValue({ data: { ok: true } });
    const originalError = { response: { status: 401 }, config: { headers: {} } };

    await expect(handleResponseError(originalError)).resolves.toEqual({ data: { ok: true } });
    expect(localStorage.getItem('accessToken')).toBe('new-access-token');
  });
});
