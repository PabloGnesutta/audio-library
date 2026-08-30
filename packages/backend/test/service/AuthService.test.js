jest.mock('../../src/helper/AuthHelper');
jest.mock('../../src/helper/UserHelper');
jest.mock('../../src/factory/UserFactory');
jest.mock('../../src/service/EmailService');

const AuthHelper = require('../../src/helper/AuthHelper');
const UserHelper = require('../../src/helper/UserHelper');
const UserFactory = require('../../src/factory/UserFactory');
const EmailService = require('../../src/service/EmailService');
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
    const builtUser = { email: 'new@example.com', emailToken: 'tok123' };
    UserFactory.user.mockResolvedValue(builtUser);
    UserHelper.saveUser.mockResolvedValue({ _id: 'u1', ...builtUser });

    const result = await AuthService.signUp({ email: 'new@example.com', password: 'x' });

    expect(UserHelper.saveUser).toHaveBeenCalledWith(builtUser);
    expect(result).toEqual({ _id: 'u1', email: 'new@example.com', emailToken: 'tok123' });
  });

  // Regression test: the verification email send was commented out in AuthService.signUp
  // (dead code from some earlier debugging session) -- newly created accounts never got
  // a verification email, silently (see DIAGNOSIS.md).
  test('sends the verification email with the new user\'s email and token', async () => {
    AuthHelper.validateEmail.mockResolvedValue(null);
    const builtUser = { email: 'new@example.com', emailToken: 'tok123' };
    UserFactory.user.mockResolvedValue(builtUser);
    UserHelper.saveUser.mockResolvedValue({ _id: 'u1', ...builtUser });

    await AuthService.signUp({ email: 'new@example.com', password: 'x' });

    expect(EmailService.sendVerifyEmailMail).toHaveBeenCalledWith({
      to: 'new@example.com',
      token: 'tok123',
    });
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
    UserHelper.sessionData.mockReturnValue({ user, accessToken: 'access-token', refreshToken: 'refresh-token' });

    const result = await AuthService.login({ email: 'user@example.com', password: 'correct' });

    expect(UserHelper.sessionData).toHaveBeenCalledWith(
      user,
      { accessToken: 'access-token', refreshToken: 'refresh-token' }
    );
    expect(result).toMatchObject({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });
});
