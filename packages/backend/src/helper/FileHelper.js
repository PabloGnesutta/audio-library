const File = require('../model/File');

class FileHelper {
  static findOneAndDelete(owner, fileName) {
    return File.findOneAndDelete({ owner, name: fileName });
  }

  static getFileById(id) {
    return File.findById(id);
  }

  static getUserFiles(owner) {
    return File.find({ owner });
  }

  static getUserFilesByFolderId(owner, folderId) {
    return File.find({ owner, folderId });
  }

  static searchByName(owner, query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return File.find({ owner, name: { $regex: escaped, $options: 'i' } }).sort({ name: 'asc' });
  }

  static getUserFileById(owner, _id) {
    return File.findOne({ owner, _id });
  }

  static saveFile(file) {
    return file.save();
  }

  static touchInteraction(fileId) {
    return File.updateOne({ _id: fileId }, { lastInteraction: new Date() });
  }
}

module.exports = FileHelper;