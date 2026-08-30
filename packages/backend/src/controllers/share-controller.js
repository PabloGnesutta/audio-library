const ErrorFactory = require('../factory/ErrorFactory');
const ShareService = require('../service/ShareService');

exports.shareFile = async (req, res, next) => {
  console.log('shareFile', req.body);
  try {
    const share = await ShareService.shareFile(req.user, req.body);
    res.json({ share });
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while sharing file'));
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

exports.revokeShare = async (req, res, next) => {
  console.log('revokeShare', req.params);
  try {
    await ShareService.revokeShare(req.user, req.params._id);
    res.json({ shareId: req.params._id });
  } catch (_err) {
    next(ErrorFactory.create(_err, 'Error while revoking share'));
  }
};
