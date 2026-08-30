const Share = require('../model/Share');
const User = require('../model/User');

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

  static findActiveFolderShare(owner, folderId, sharedWith) {
    return Share.findOne({
      resourceType: 'folder',
      owner,
      folderId,
      mode: 'account',
      sharedWith,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });
  }

  static async canAccessFile(user, file) {
    if (String(file.owner) === String(user._id)) return true;

    const fileShare = await this.findActiveFileShare(file._id, user._id);
    if (fileShare) return true;

    const folderShare = await this.findActiveFolderShare(file.owner, file.folderId, user._id);
    return !!folderShare;
  }

  // Recipient-facing lookup: an incoming folder share by its own _id, scoped
  // to the requesting user so they can't probe someone else's share by id.
  static findIncomingFolderShareById(sharedWith, _id) {
    return Share.findOne({
      _id,
      sharedWith,
      mode: 'account',
      resourceType: 'folder',
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });
  }

  // Folders aren't their own collection (they're embedded in User.folders),
  // so resolving a folder's name for display needs a scoped positional
  // projection rather than a populate -- this returns only the one matching
  // folder subdocument, not the owner's whole folder list.
  static async getFolderName(ownerId, folderId) {
    const user = await User.findOne(
      { _id: ownerId, 'folders.id': folderId },
      { 'folders.$': 1 }
    );
    return user && user.folders[0] ? user.folders[0].name : null;
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
