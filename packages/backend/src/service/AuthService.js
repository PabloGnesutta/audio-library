const BusinessError = require('../exception/BusinessError');
const AuthHelper = require('../helper/AuthHelper');
const UserHelper = require('../helper/UserHelper');
const UserFactory = require('../factory/UserFactory');
const EmailService = require('../service/EmailService');

const config = require('../config');
const accessTokenExp = config.accessTokenExpiration;
const refreshTokenExp = config.refreshTokenExpiration;

class AuthService {
  static async signUp(userData) {
    const invalidEmailMsg = await AuthHelper.validateEmail(userData.email);
    if (invalidEmailMsg) throw new BusinessError(invalidEmailMsg);

    const user = await UserFactory.user(userData);
    const responseUser = await UserHelper.saveUser(user);
    if (!responseUser) throw new BusinessError('Unable to save user');

    EmailService.sendVerifyEmailMail({
      to: user.email,
      token: user.emailToken,
    });
    return responseUser;
  }

  static async verifyEmail(token) {
    const user = await UserHelper.getUserByToken(token);
    if (!user) throw new BusinessError('Wrong email confirmation link');
    user.emailToken = undefined;
    user.emailTokenExpiration = undefined;
    user.emailVerified = true;
    await UserHelper.saveUser(user);
    return user.email;
  }

  static async login(loginData) {
    const user = await UserHelper.getUserByEmail(loginData.email, {
      emailVerified: true,
    });
    if (!user) throw new BusinessError('Wrong credentials [user]');

    const password = await AuthHelper.verifyPassword(
      loginData.password,
      user.password
    );
    if (!password) throw new BusinessError('Wrong credentials [password]');
    console.log(' -success]');
    const accessToken = this.createAccessToken(user, accessTokenExp);
    const refreshToken = this.createRefreshToken(user, refreshTokenExp);
    const clientData = UserHelper.sessionData(user, {
      accessToken,
      refreshToken,
    });
    return clientData;
  }

  static createAccessToken(user, expiration) {
    const token = AuthHelper.createAccessToken(
      { userId: user._id, email: user.email },
      expiration
    );
    if (!token) throw new SystemError('Error al generar token');
    return token;
  }

  static createRefreshToken(user, expiration) {
    const token = AuthHelper.createRefreshToken(user._id, expiration);
    if (!token) throw new SystemError('Error al generar token');
    return token;
  }

  static async validateToken(token) {
    return AuthHelper.validateToken(token);
  }

  static async changePassword(user, currentPassword, newPassword) {
    const isValid = await AuthHelper.verifyPassword(currentPassword, user.password);
    if (!isValid) throw new BusinessError('Current password is incorrect');
    if (!newPassword || newPassword.length < 8) {
      throw new BusinessError('New password must be at least 8 characters long');
    }

    user.password = await AuthHelper.hashPassword(newPassword);
    await UserHelper.saveUser(user);
    return { success: true };
  }
}

module.exports = AuthService;
