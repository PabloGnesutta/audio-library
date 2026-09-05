import BaseController from "@/controller/base-controller";

class UserController extends BaseController {
  static createFolder(name) {
    return this.post(`/user/folder`, { name });
  }

  static deleteFolder(id) {
    return this.delete(`/user/folder/${id}`);
  }

  static renameFolder(id, newName) {
    return this.put(`/user/folder`, { id, newName });
  }

  static changePassword(currentPassword, newPassword) {
    return this.put(`/user/password`, { currentPassword, newPassword });
  }
}

export default UserController;