const Bookmark = require('../model/Bookmark');

class BookmarkFactory {
  static bookmarkObject({ label, content, time, user, file }) {
    return new Bookmark({
      owner: user,
      label,
      content,
      time,
      file,
    });
  }
}

module.exports = BookmarkFactory;