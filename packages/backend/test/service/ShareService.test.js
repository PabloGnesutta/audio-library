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

describe('ShareService.shareFolder', () => {
  function makeUserWithFolders(overrides = {}) {
    return makeUser({ folders: [{ id: 1, name: 'Podcasts' }, { id: 2, name: 'Lectures' }], ...overrides });
  }

  test('rejects when the folder does not exist on the requesting user', async () => {
    await expect(
      ShareService.shareFolder(makeUserWithFolders(), { folderId: 99, recipientEmail: 'friend@example.com' })
    ).rejects.toBeInstanceOf(BusinessError);
    expect(UserHelper.getUserByEmail).not.toHaveBeenCalled();
  });

  test('rejects when the folder is already actively shared with that recipient', async () => {
    UserHelper.getUserByEmail.mockResolvedValue({ _id: 'recipient-1' });
    ShareHelper.findActiveFolderShare.mockResolvedValue({ _id: 'existing-share' });

    await expect(
      ShareService.shareFolder(makeUserWithFolders(), { folderId: 1, recipientEmail: 'friend@example.com' })
    ).rejects.toBeInstanceOf(BusinessError);
  });

  test('creates and saves a folder share when everything checks out', async () => {
    const recipient = { _id: 'recipient-1' };
    const savedShare = { _id: 'share-1' };
    UserHelper.getUserByEmail.mockResolvedValue(recipient);
    ShareHelper.findActiveFolderShare.mockResolvedValue(null);
    const save = jest.fn().mockResolvedValue(savedShare);
    ShareFactory.folderShareObject.mockReturnValue({ save });

    const user = makeUserWithFolders();
    const result = await ShareService.shareFolder(user, { folderId: 1, recipientEmail: 'friend@example.com' });

    expect(ShareFactory.folderShareObject).toHaveBeenCalledWith({
      owner: user._id,
      folderId: 1,
      sharedWith: recipient._id,
      expiresAt: undefined,
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(result).toBe(savedShare);
  });
});

describe('ShareService.getIncomingShares', () => {
  test('resolves and attaches a folder name for folder-type shares, leaving file shares untouched', async () => {
    const fileShare = {
      resourceType: 'file',
      toObject: jest.fn(),
    };
    const folderShare = {
      resourceType: 'folder',
      folderId: 3,
      owner: { _id: 'owner-1' },
      toObject: jest.fn().mockReturnValue({ resourceType: 'folder', folderId: 3, owner: { _id: 'owner-1' } }),
    };
    ShareHelper.getIncomingShares.mockResolvedValue([fileShare, folderShare]);
    ShareHelper.getFolderName.mockResolvedValue('Lectures');

    const result = await ShareService.getIncomingShares(makeUser());

    expect(result[0]).toBe(fileShare);
    expect(fileShare.toObject).not.toHaveBeenCalled();
    expect(ShareHelper.getFolderName).toHaveBeenCalledWith('owner-1', 3);
    expect(result[1]).toMatchObject({ folderName: 'Lectures' });
  });
});

describe('ShareService.getSharedFolderFiles', () => {
  test('throws a BusinessError when there is no matching incoming folder share', async () => {
    ShareHelper.findIncomingFolderShareById.mockResolvedValue(null);
    await expect(ShareService.getSharedFolderFiles(makeUser(), 'share-1'))
      .rejects.toBeInstanceOf(BusinessError);
    expect(FileHelper.getUserFilesByFolderId).not.toHaveBeenCalled();
  });

  test('lists the folder owner\'s files by the shared folder id, not the viewer\'s', async () => {
    const share = { owner: 'folder-owner-1', folderId: 5 };
    const files = [{ _id: 'f1' }, { _id: 'f2' }];
    ShareHelper.findIncomingFolderShareById.mockResolvedValue(share);
    FileHelper.getUserFilesByFolderId.mockResolvedValue(files);

    const result = await ShareService.getSharedFolderFiles(makeUser(), 'share-1');

    expect(FileHelper.getUserFilesByFolderId).toHaveBeenCalledWith('folder-owner-1', 5);
    expect(result).toBe(files);
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
