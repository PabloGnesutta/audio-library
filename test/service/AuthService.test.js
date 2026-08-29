jest.mock('../../src/helper/AuthHelper');
jest.mock('../../src/helper/UserHelper');
jest.mock('../../src/factory/UserFactory');
jest.mock('../../src/service/EmailService');

const AuthHelper = require('../../src/helper/AuthHelper');
const UserHelper = require('../../src/helper/UserHelper');
const UserFactory = require('../../src/factory/UserFactory');
const AuthService = require('../../src/service/AuthService');
const BusinessError = require('../../src/exception/BusinessError');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthService.signUp', () => {
  test('rejects with a BusinessError when the email is invalid/taken', async () => {
    AuthHelper.validateEmail.mockResolvedValue('Email already taken');

    await expect(AuthService.signUp({ email: 'dup@example.com', password: 'x' }))
      .rejects.toBeInstanceOf(BusinessError);
    expect(UserFactory.user).not.toHaveBeenCalled();
  });

  test('saves and returns the new user when validation passes', async () => {
    AuthHelper.validateEmail.mockResolvedValue(null);
    const builtUser = { email: 'new@example.com' };
    UserFactory.user.mockResolvedValue(builtUser);
    UserHelper.saveUser.mockResolvedValue({ _id: 'u1', ...builtUser });

    const result = await AuthService.signUp({ email: 'new@example.com', password: 'x' });

    expect(UserHelper.saveUser).toHaveBeenCalledWith(builtUser);
    expect(result).toEqual({ _id: 'u1', email: 'new@example.com' });
  });
});

describe('AuthService.login', () => {
  test('rejects with a BusinessError when no verified user exists for the email', async () => {
    UserHelper.getUserByEmail.mockResolvedValue(null);

    await expect(AuthService.login({ email: 'nobody@example.com', password: 'x' }))
      .rejects.toBeInstanceOf(BusinessError);
  });

  test('rejects with a BusinessError on a wrong password', async () => {
    UserHelper.getUserByEmail.mockResolvedValue({ _id: 'u1', password: 'hashed' });
    AuthHelper.verifyPassword.mockResolvedValue(false);

    await expect(AuthService.login({ email: 'user@example.com', password: 'wrong' }))
      .rejects.toBeInstanceOf(BusinessError);
  });

  test('returns client data with fresh tokens on success', async () => {
    const user = { _id: 'u1', email: 'user@example.com', password: 'hashed' };
    UserHelper.getUserByEmail.mockResolvedValue(user);
    AuthHelper.verifyPassword.mockResolvedValue(true);
    AuthHelper.createAccessToken.mockReturnValue('access-token');
    AuthHelper.createRefreshToken.mockReturnValue('refresh-token');
    UserHelper.clientData.mockResolvedValue({ user, accessToken: 'access-token', refreshToken: 'refresh-token' });

    const result = await AuthService.login({ email: 'user@example.com', password: 'correct' });

    expect(UserHelper.clientData).toHaveBeenCalledWith(
      user,
      { accessToken: 'access-token', refreshToken: 'refresh-token' }
    );
    expect(result).toMatchObject({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });
});
