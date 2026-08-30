const Share = require('../model/Share');

class ShareFactory {
  static fileShareObject({ owner, fileId, sharedWith, expiresAt }) {
    return new Share({
      resourceType: 'file',
      mode: 'account',
      owner,
      fileId,
      sharedWith,
      expiresAt: expiresAt || null,
    });
  }
}

module.exports = ShareFactory;
