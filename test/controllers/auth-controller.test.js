jest.mock('../../src/service/AuthService');
jest.mock('../../src/helper/UserHelper');

const AuthService = require('../../src/service/AuthService');
const UserHelper = require('../../src/helper/UserHelper');
const authController = require('../../src/controllers/auth-controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authorizationMiddleware', () => {
  test('responds with 403 and no auth header', () => {
    const req = { headers: {} };
    const res = mockRes();
    authController.authorizationMiddleware(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith('Permission denied');
  });

  // Regression test: this used to reference an undefined `error` variable
  // inside the catch block, throwing a ReferenceError instead of sending a
  // clean status/message response (see DIAGNOSIS.md).
  test('responds with the rejection status/message on an invalid token, not a crash', async () => {
    AuthService.validateToken.mockRejectedValue({ status: 403, message: 'You have no permissions to access this resource' });

    const req = { headers: { authorization: 'Bearer bad-token' } };
    const res = mockRes();
    const next = jest.fn();

    authController.authorizationMiddleware(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith('You have no permissions to access this resource');
  });

  test('attaches req.user and calls next on a valid token', async () => {
    AuthService.validateToken.mockResolvedValue({ data: { userId: 'user-1' } });
    UserHelper.getUserById.mockResolvedValue({ _id: 'user-1', email: 'a@b.com' });

    const req = { headers: { authorization: 'Bearer good-token' } };
    const res = mockRes();
    const next = jest.fn();

    authController.authorizationMiddleware(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(req.user).toEqual({ _id: 'user-1', email: 'a@b.com' });
    expect(next).toHaveBeenCalled();
  });
});

describe('refreshAccessToken', () => {
  // Same regression as above, for the second catch block that had the bug.
  test('responds with the rejection status/message on an invalid refresh token', async () => {
    AuthService.validateToken.mockRejectedValue({ status: 401, message: 'Token expired' });

    const req = { headers: { authorization: 'Bearer expired-refresh-token' } };
    const res = mockRes();

    authController.refreshAccessToken(req, res);
    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith('Token expired');
  });
});
