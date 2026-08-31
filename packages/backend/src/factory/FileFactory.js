const File = require('../model/File');

class FileFactory {
  static fileObject({ name, type, size, key, user, folderId, duration }) {
    return new File({
      key,
      duration,
      name,
      type,
      size,
      owner: user,
      folderId: folderId || 0,
      metaData: {
        currentTime: 0,
      },

      lastInteraction: new Date()
    });
  }
}

module.exports = FileFactory;