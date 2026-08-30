const Share = require('../model/Share');

class ShareHelper {
  static findActiveFileShare(fileId, sharedWith) {
    return Share.findOne({
      resourceType: 'file',
      fileId,
      mode: 'account',
      sharedWith,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });
  }

  static async canAccessFile(user, file) {
    if (String(file.owner) === String(user._id)) return true;
    const share = await this.findActiveFileShare(file._id, user._id);
    return !!share;
  }

  static getOutgoingShares(owner) {
    return Share.find({ owner })
      .populate('fileId', 'name')
      .populate('sharedWith', 'email name')
      .sort({ createdAt: 'desc' });
  }

  static getIncomingShares(sharedWith) {
    return Share.find({ sharedWith, mode: 'account' })
      .populate('fileId', 'name type duration metaData folderId')
      .populate('owner', 'email name')
      .sort({ createdAt: 'desc' });
  }

  static findOneAndDelete(owner, _id) {
    return Share.findOneAndDelete({ owner, _id });
  }
}

module.exports = ShareHelper;
