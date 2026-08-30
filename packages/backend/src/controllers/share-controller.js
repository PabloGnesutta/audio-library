const ErrorFactory = require('../factory/ErrorFactory');
const ShareService = require('../service/ShareService');

exports.createShare = async (req, res, next) => {
  console.log('createShare', req.body);
  try {
    const resourceType = req.body.resourceType || 'file';
    const share = resourceType === 'folder'
      ? await ShareService.shareFolder(req.user, req.body)
      : await ShareService.shareFile(req.user, req.body);
    res.json({ share });
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while sharing'));
  }
};

exports.getOutgoingShares = async (req, res, next) => {
  console.log('getOutgoingShares');
  try {
    const shares = await ShareService.getOutgoingShares(req.user);
    res.json({ shares });
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while getting outgoing shares'));
  }
};

exports.getIncomingShares = async (req, res, next) => {
  console.log('getIncomingShares');
  try {
    const shares = await ShareService.getIncomingShares(req.user);
    res.json({ shares });
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while getting incoming shares'));
  }
};

exports.getSharedFolderFiles = async (req, res, next) => {
  console.log('getSharedFolderFiles', req.params.shareId);
  try {
    const files = await ShareService.getSharedFolderFiles(req.user, req.params.shareId);
    res.json({ files });
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while getting shared folder files'));
  }
};

exports.revokeShare = async (req, res, next) => {
  console.log('revokeShare', req.params);
  try {
    await ShareService.revokeShare(req.user, req.params._id);
    res.json({ shareId: req.params._id });
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while revoking share'));
  }
};
