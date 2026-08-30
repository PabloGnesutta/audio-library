const FileHelper = require('../helper/FileHelper');
const UserHelper = require('../helper/UserHelper');
const ShareHelper = require('../helper/ShareHelper');
const ShareFactory = require('../factory/ShareFactory');
const BusinessError = require('../exception/BusinessError');

class ShareService {
  static async shareFile(user, { fileId, recipientEmail, expiresAt }) {
    const email = this._normalizeRecipientEmail(user, recipientEmail);

    const file = await FileHelper.getUserFileById(user, fileId);
    if (!file) throw new BusinessError("Couldn't find file");

    const recipient = await UserHelper.getUserByEmail(email);
    if (!recipient) throw new BusinessError('No account found with that email');

    const existing = await ShareHelper.findActiveFileShare(file._id, recipient._id);
    if (existing) throw new BusinessError('Already shared with this user');

    return ShareFactory.fileShareObject({
      owner: user._id,
      fileId: file._id,
      sharedWith: recipient._id,
      expiresAt,
    }).save();
  }

  static async shareFolder(user, { folderId, recipientEmail, expiresAt }) {
    const email = this._normalizeRecipientEmail(user, recipientEmail);

    const folder = (user.folders || []).find((f) => f.id == folderId);
    if (!folder) throw new BusinessError("Couldn't find folder");

    const recipient = await UserHelper.getUserByEmail(email);
    if (!recipient) throw new BusinessError('No account found with that email');

    const existing = await ShareHelper.findActiveFolderShare(user._id, folder.id, recipient._id);
    if (existing) throw new BusinessError('Already shared with this user');

    return ShareFactory.folderShareObject({
      owner: user._id,
      folderId: folder.id,
      sharedWith: recipient._id,
      expiresAt,
    }).save();
  }

  static _normalizeRecipientEmail(user, recipientEmail) {
    const email = (recipientEmail || '').trim().toLowerCase();
    if (!email) throw new BusinessError('Recipient email is required');
    if (email === user.email.toLowerCase()) {
      throw new BusinessError("You can't share with yourself");
    }
    return email;
  }

  static getOutgoingShares(user) {
    return ShareHelper.getOutgoingShares(user._id);
  }

  static async getIncomingShares(user) {
    const shares = await ShareHelper.getIncomingShares(user._id);

    return Promise.all(shares.map(async (share) => {
      if (share.resourceType !== 'folder') return share;

      const folderName = await ShareHelper.getFolderName(share.owner._id, share.folderId);
      const shareObject = share.toObject();
      shareObject.folderName = folderName;
      return shareObject;
    }));
  }

  static async getSharedFolderFiles(user, shareId) {
    const share = await ShareHelper.findIncomingFolderShareById(user._id, shareId);
    if (!share) throw new BusinessError("Couldn't find shared folder");

    return FileHelper.getUserFilesByFolderId(share.owner, share.folderId);
  }

  static async revokeShare(user, _id) {
    const share = await ShareHelper.findOneAndDelete(user._id, _id);
    if (!share) throw new BusinessError("Couldn't find share to revoke");
    return true;
  }
}

module.exports = ShareService;
