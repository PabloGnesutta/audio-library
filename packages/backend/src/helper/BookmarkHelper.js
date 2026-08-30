const Bookmark = require('../model/Bookmark');

class BookmarkHelper {
  static findOneAndDelete(owner, _id) {
    return Bookmark.findOneAndDelete({ owner, _id });
  }

  static findOneAndUpdate(owner, _id, params) {
    return Bookmark.findOneAndUpdate({ owner, _id }, params, { new: true });
  }

  static userBookmarksByFileId(owner, file) {
    return Bookmark.find({ owner, file }, '_id time label file').sort({ time: 'asc' });
  }

  static searchByLabel(owner, query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return Bookmark.find({ owner, label: { $regex: escaped, $options: 'i' } })
      .populate('file', 'name folderId')
      .sort({ label: 'asc' });
  }

}

module.exports = BookmarkHelper;