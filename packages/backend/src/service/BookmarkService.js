const BookmarkFactory = require('../factory/BookmarkFactory');
const BookmarkHelper = require('../helper/BookmarkHelper');
const FileHelper = require('../helper/FileHelper');
const ShareHelper = require('../helper/ShareHelper');
const BusinesError = require('../exception/BusinessError');

class BookmarkService {
  static async createBookmark(user, { label, file, time, content }) {
    const targetFile = await FileHelper.getFileById(file);
    if (!targetFile) throw new BusinesError('File not found');

    const hasAccess = await ShareHelper.canAccessFile(user, targetFile);
    if (!hasAccess) throw new BusinesError('File not found');

    const bookmark = await BookmarkFactory.bookmarkObject({ label, content, file, user, time }).save();
    if (!bookmark) {
      throw new BusinesError('Couldnt create bookmark');
    }
    return bookmark.publicData();
  }

  static async deleteBookmark(user, _id) {
    const bookmark = await BookmarkHelper.findOneAndDelete(user, _id);
    if (!bookmark) {
      throw new BusinesError('Couldnt delete bookmark');
    }
    return true;
  }

  static async updateBookmark(user, _id, params) {
    const bookmark = await BookmarkHelper.findOneAndUpdate(user, _id, params);
    if (!bookmark) {
      throw new BusinesError('Couldnt update bookmark');
    }
    return bookmark;
  }

  static async getUserFileBookmarks(user, fileId) {
    const bookmarks = await BookmarkHelper.userBookmarksByFileId(user, fileId);
    if (!bookmarks) {
      throw new BusinesError('Couldnt get bookmarks for file');
    }
    return bookmarks;
  }

  static async searchBookmarks(user, query) {
    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    const bookmarks = await BookmarkHelper.searchByLabel(user, trimmed);
    return bookmarks
      .filter((bookmark) => bookmark.file)
      .map((bookmark) => {
        const folder = (user.folders || []).find((f) => f.id === bookmark.file.folderId);
        return {
          _id: bookmark._id,
          time: bookmark.time,
          label: bookmark.label,
          content: bookmark.content,
          fileId: bookmark.file._id,
          fileName: bookmark.file.name,
          folderId: bookmark.file.folderId,
          folderName: folder ? folder.name : null,
        };
      });
  }
}

module.exports = BookmarkService;