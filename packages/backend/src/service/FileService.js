const config = require('../config');
const FileFactory = require('../factory/FileFactory');
const FileHelper = require('../helper/FileHelper');
const S3Helper = require('../helper/S3Helper');
const ShareHelper = require('../helper/ShareHelper');
const BusinesError = require('../exception/BusinessError');


class FileService {
  static async getFileUrl(user, fileId) {
    const file = await FileHelper.getFileById(fileId);
    if (!file) throw new BusinesError('File not found');

    const hasAccess = await ShareHelper.canAccessFile(user, file);
    if (!hasAccess) throw new BusinesError('File not found');

    const url = await S3Helper.getSignedUrl('getObject', { Key: file.key, Expires: 3600 });
    return { url };
  }

  static async getUploadUrls(user, { files }) {
    if (files.length > config.maxFilesPerUpload) {
      throw new BusinesError(`You can upload up to ${config.maxFilesPerUpload} files at once`);
    }

    const ts = Date.now();

    // todo: check total storage used by user, duplicate file names?
    return Promise.all(files.map(async ({ fileName, fileType, fileSize }, i) => {
      if (fileSize > config.maxFileSize) throw new BusinesError(`${fileName} is too large`);

      const key = `audio-library/${user.email}/${fileName}__ts--${ts}-${i}`;
      const url = await S3Helper.getSignedUrl('putObject', { Key: key, ContentType: fileType, Expires: 3600 });

      return { fileName, url, key };
    }));
  }

  static async confirmUpload(user, { key, folderId, duration, fileName, fileType, fileSize }) {
    const savedFile = await FileHelper.saveFile(
      FileFactory.fileObject({ name: fileName, type: fileType, size: fileSize, key, user, folderId, duration })
    );
    if (!savedFile) throw new BusinesError("Error while updating file");

    return { file: savedFile };
  }

  static async deleteFile(user, _id) {
    const file = await FileHelper.getUserFileById(user, _id);
    if (!file) throw new BusinesError('File not found');

    await S3Helper.deleteFile({ Key: file.key });
    await file.deleteOne();

    if (user.lastFileSeen == _id) {
      user.lastFileSeen = null;
    }
    user = await user.save();

    return user;
  }

  static async deleteMultipleFiles(user, files) {
    for (const file of files) {
      console.log(' * deleting file', file.name, file.id);
      await S3Helper.deleteFile({ Key: file.key });
      await file.deleteOne();
      if (user.lastFileSeen == file._id.toString()) {
        user.lastFileSeen = null;
        await user.save();
      }
    }
  }

  static async getUserFiles(user) {
    const userFiles = await FileHelper.getUserFiles(user);
    if (!userFiles) throw new BusinesError("Couldn't get user files");
    return userFiles;
  }

  static async getUserFilesByFolderId(user, folderId) {
    const userFiles = await FileHelper.getUserFilesByFolderId(user, folderId);
    if (!userFiles) throw new BusinesError("Couldn't get folder files");
    return userFiles;
  }

  static async searchFiles(user, query) {
    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    const files = await FileHelper.searchByName(user, trimmed);
    return files.map((file) => {
      const folder = (user.folders || []).find((f) => f.id === file.folderId);
      return {
        _id: file._id,
        name: file.name,
        folderId: file.folderId,
        folderName: folder ? folder.name : null,
      };
    });
  }

  static async markLastFileSeen(user, fileId, folderId) {
    try {
      const folderIndex = user.folders.findIndex(c => c.id == folderId);
      if (folderIndex === -1) return;
      user.folders[folderIndex].lastFileSeen = fileId;
      user.lastFileSeen = fileId;
      user.lastFolderSeen = folderId;
      user.markModified("folders");
      await user.save();
    } catch (_err) {
      // Fire-and-forget bookkeeping from the caller's perspective -- a
      // failure here (e.g. a VersionError from a racing concurrent save)
      // must not crash the request or the process; the URL was already
      // returned to the client regardless of this write's outcome.
      console.error('markLastFileSeen failed', _err);
    }
  }

  static async updateFileMetadata(user, { _id, param, value }) {
    var file = await FileHelper.getUserFileById(user, _id);
    if (!file) throw new BusinesError("Couldn't find user file");
    file.metaData[param] = value;
    file.markModified("metaData");
    const responseFile = await file.save();
    return responseFile;
  }

  static async updateFile(user, { _id, param, value }) {
    const file = await FileHelper.getUserFileById(user, _id);
    if (!file) throw new BusinesError("Couldn't find user file");
    file[param] = value;
    file.lastInteraction = new Date();
    file.markModified(param);
    await file.save();

    return user;
  }

  static async updateMultipleFiles(user, { fileIdsList, param, value }) {
    for (const _id of fileIdsList) {
      const file = await FileHelper.getUserFileById(user, _id);
      if (!file) throw new BusinesError("Couldn't find user file");
      file[param] = value;
      file.lastInteraction = new Date();
      file.markModified(param);
      await file.save();
    }
    return user;
  }

  static async addTagsToMultipleFiles(user, { fileIdsList, tags }) {
    for (const _id of fileIdsList) {
      const file = await FileHelper.getUserFileById(user, _id);
      if (!file) throw new BusinesError("Couldn't find user file");
      file.tags = Array.from(new Set([...(file.tags || []), ...tags]));
      file.lastInteraction = new Date();
      file.markModified('tags');
      await file.save();
    }
    return user;
  }
}

module.exports = FileService;