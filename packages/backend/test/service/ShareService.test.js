jest.mock('../../src/helper/FileHelper');
jest.mock('../../src/helper/UserHelper');
jest.mock('../../src/helper/ShareHelper');
jest.mock('../../src/factory/ShareFactory');

const FileHelper = require('../../src/helper/FileHelper');
const UserHelper = require('../../src/helper/UserHelper');
const ShareHelper = require('../../src/helper/ShareHelper');
const ShareFactory = require('../../src/factory/ShareFactory');
const ShareService = require('../../src/service/ShareService');
const BusinessError = require('../../src/exception/BusinessError');

beforeEach(() => {
  jest.clearAllMocks();
});

function makeUser(overrides = {}) {
  return { _id: 'owner-1', email: 'owner@example.com', ...overrides };
}

describe('ShareService.shareFile', () => {
  test('rejects sharing with the file owner\'s own email', async () => {
    await expect(
      ShareService.shareFile(makeUser(), { fileId: 'f1', recipientEmail: 'Owner@Example.com' })
    ).rejects.toBeInstanceOf(BusinessError);
    expect(FileHelper.getUserFileById).not.toHaveBeenCalled();
  });

  test('rejects when the file does not belong to the requesting user', async () => {
    FileHelper.getUserFileById.mockResolvedValue(null);
    await expect(
      ShareService.shareFile(makeUser(), { fileId: 'f1', recipientEmail: 'friend@example.com' })
    ).rejects.toBeInstanceOf(BusinessError);
  });

  test('rejects when no account exists for the recipient email', async () => {
    FileHelper.getUserFileById.mockResolvedValue({ _id: 'f1' });
    UserHelper.getUserByEmail.mockResolvedValue(null);
    await expect(
      ShareService.shareFile(makeUser(), { fileId: 'f1', recipientEmail: 'nobody@example.com' })
    ).rejects.toBeInstanceOf(BusinessError);
  });

  test('rejects when the file is already actively shared with that recipient', async () => {
    FileHelper.getUserFileById.mockResolvedValue({ _id: 'f1' });
    UserHelper.getUserByEmail.mockResolvedValue({ _id: 'recipient-1' });
    ShareHelper.findActiveFileShare.mockResolvedValue({ _id: 'existing-share' });

    await expect(
      ShareService.shareFile(makeUser(), { fileId: 'f1', recipientEmail: 'friend@example.com' })
    ).rejects.toBeInstanceOf(BusinessError);
  });

  test('creates and saves a share when everything checks out', async () => {
    const file = { _id: 'f1' };
    const recipient = { _id: 'recipient-1' };
    const savedShare = { _id: 'share-1' };
    FileHelper.getUserFileById.mockResolvedValue(file);
    UserHelper.getUserByEmail.mockResolvedValue(recipient);
    ShareHelper.findActiveFileShare.mockResolvedValue(null);
    const save = jest.fn().mockResolvedValue(savedShare);
    ShareFactory.fileShareObject.mockReturnValue({ save });

    const user = makeUser();
    const result = await ShareService.shareFile(user, { fileId: 'f1', recipientEmail: 'friend@example.com' });

    expect(ShareFactory.fileShareObject).toHaveBeenCalledWith({
      owner: user._id,
      fileId: file._id,
      sharedWith: recipient._id,
      expiresAt: undefined,
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(result).toBe(savedShare);
  });
});

describe('ShareService.revokeShare', () => {
  test('throws a BusinessError when the share does not exist or is not owned by the user', async () => {
    ShareHelper.findOneAndDelete.mockResolvedValue(null);
    await expect(ShareService.revokeShare(makeUser(), 'share-1')).rejects.toBeInstanceOf(BusinessError);
  });

  test('resolves when the share was found and deleted', async () => {
    ShareHelper.findOneAndDelete.mockResolvedValue({ _id: 'share-1' });
    await expect(ShareService.revokeShare(makeUser(), 'share-1')).resolves.toBe(true);
  });
});
