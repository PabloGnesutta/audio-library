import BaseController from "@/controller/base-controller";

class BookmarkController extends BaseController {
  static create(params) {
    return this.post('/bookmark', params);
  }

  static deleteBookmark(_id) {
    return this.delete('/bookmark/' + _id);
  }

  static updateBookmark(_id, params) {
    return this.patch('/bookmark/' + _id, params);
  }

  static getForFile(fileId) {
    return this.get('/bookmark/for-file/' + fileId);
  }

  static search(query) {
    return this.get('/bookmark/search', { q: query });
  }
}

export default BookmarkController;