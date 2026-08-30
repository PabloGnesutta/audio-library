import BaseController from "@/controller/base-controller";

class AuthController extends BaseController {
  static signup(email, password) {
    return this.post('/auth/user', { email, password });
  }

  static verifyEmail(token) {
    return this.post('/auth/confirmar-email', { token });
  }

  static login(email, password) {
    return this.post('/auth/sesion', { email, password });
  }

  static verifySession() {
    return this.get('/auth/sesion', {});
  }
}

export default AuthController;