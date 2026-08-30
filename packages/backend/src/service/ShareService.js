const FileHelper = require('../helper/FileHelper');
const UserHelper = require('../helper/UserHelper');
const ShareHelper = require('../helper/ShareHelper');
const ShareFactory = require('../factory/ShareFactory');
const BusinessError = require('../exception/BusinessError');

class ShareService {
  static async shareFile(user, { fileId, recipientEmail, expiresAt }) {
    const email = (recipientEmail || '').trim().toLowerCase();
    if (!email) throw new BusinessError('Recipient email is required');
    if (email === user.email.toLowerCase()) {
      throw new BusinessError("You can't share a file with yourself");
    }

    const file = await FileHelper.getUserFileById(user, fileId);
    if (!file) throw new BusinessError("Couldn't find file");

    const recipient = await UserHelper.getUserByEmail(email);
    if (!recipient) throw new BusinessError('No account found with that email');

    const existing = await ShareHelper.findActiveFileShare(file._id, recipient._id);
    if (existing) throw new BusinessError('Already shared with this user');

    const share = await ShareFactory.fileShareObject({
      owner: user._id,
      fileId: file._id,
      sharedWith: recipient._id,
      expiresAt,
    }).save();

    return share;
  }

  static getOutgoingShares(user) {
    return ShareHelper.getOutgoingShares(user._id);
  }

  static getIncomingShares(user) {
    return ShareHelper.getIncomingShares(user._id);
  }

  static async revokeShare(user, _id) {
    const share = await ShareHelper.findOneAndDelete(user._id, _id);
    if (!share) throw new BusinessError("Couldn't find share to revoke");
    return true;
  }
}

module.exports = ShareService;
