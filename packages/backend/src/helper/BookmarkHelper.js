const Bookmark = require('../model/Bookmark');

class BookmarkHelper {
  static findOneAndDelete(owner, _id) {
    return Bookmark.findOneAndDelete({ owner, _id });
  }

  static findOneAndUpdate(owner, _id, params) {
    return Bookmark.findOneAndUpdate({ owner, _id }, params, { new: true });
  }

  static userBookmarksByFileId(owner, file) {
    return Bookmark.find({ owner, file }, '_id time label content file').sort({ time: 'asc' });
  }

  // Matches label or content -- name kept as-is even though it now searches
  // more than the label, to avoid an unrelated rename churning the diff.
  static searchByLabel(owner, query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: escaped, $options: 'i' };
    return Bookmark.find({
      owner,
      $or: [{ label: regex }, { content: regex }],
    })
      .populate('file', 'name folderId')
      .sort({ label: 'asc' });
  }

}

module.exports = BookmarkHelper;