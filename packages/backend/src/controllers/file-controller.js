const ErrorFactory = require('../factory/ErrorFactory');
const FileService = require('../service/FileService');
const UserHelper = require('../helper/UserHelper');

exports.getFileUrl = async (req, res, next) => {
  console.log('getFileUrl', req.params, req.body);
  try {
    const { url } = await FileService.getFileUrl(req.user, req.params._id);
    if (url) {
      FileService.markLastFileSeen(req.user, req.params._id, req.body.folderId);
    }
    res.json({ url });
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while getting file url'));
  }
};

exports.getUploadUrls = async (req, res, next) => {
  console.log('getUploadUrls', req.body.files?.length);
  try {
    const urls = await FileService.getUploadUrls(req.user, req.body);
    res.json({ urls });
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while getting upload urls'));
  }
};

exports.confirmUpload = async (req, res, next) => {
  console.log('confirmUpload', req.body);
  try {
    const { file } = await FileService.confirmUpload(req.user, req.body);
    res.json({ file });
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while confirming upload'));
  }
};

exports.getFilesForFolder = async (req, res, next) => {
  console.log('getFilesForFolder', req.params.folderId);
  try {
    const files = await FileService.getUserFilesByFolderId(req.user, req.params.folderId);
    res.json({ files });
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while getting folder files'));
  }
};

exports.searchFiles = async (req, res, next) => {
  console.log('searchFiles', req.query.q);
  try {
    const files = await FileService.searchFiles(req.user, req.query.q);
    res.json({ files });
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while searching files'));
  }
};

exports.updateFile = async (req, res, next) => {
  console.log('updateFile', req.body);
  try {
    const user = await FileService.updateFile(req.user, req.body);
    const response = await UserHelper.clientData(user);
    res.json(response);
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while updating file'));
  }
};

exports.updateMultipleFiles = async (req, res, next) => {
  console.log('updateMultipleFiles', req.body);
  try {
    const user = await FileService.updateMultipleFiles(req.user, req.body);
    const response = await UserHelper.clientData(user);
    res.json(response);
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while updating multile files'));
  }
};

exports.addTagsToMultipleFiles = async (req, res, next) => {
  console.log('addTagsToMultipleFiles', req.body);
  try {
    const user = await FileService.addTagsToMultipleFiles(req.user, req.body);
    const response = await UserHelper.clientData(user);
    res.json(response);
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while applying tags to multiple files'));
  }
};

exports.deleteFile = async (req, res, next) => {
  console.log('deleteFile', req.params);
  try {
    await FileService.deleteFile(req.user, req.params._id);
    res.json({ fileId: req.params._id });
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while deleting file'));
  }
};

exports.updateFileMetadata = async (req, res, next) => {
  console.log('updateFileMetadata', req.body);
  try {
    const savedFile = await FileService.updateFileMetadata(req.user, req.body);
    res.json(savedFile);
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while updating file metadata'));
  }
};