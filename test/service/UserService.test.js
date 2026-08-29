jest.mock('../../src/helper/FileHelper');
jest.mock('../../src/service/FileService');

const FileHelper = require('../../src/helper/FileHelper');
const FileService = require('../../src/service/FileService');
const UserService = require('../../src/service/UserService');
const BusinessError = require('../../src/exception/BusinessError');

function makeUser(overrides = {}) {
  return {
    folders: [{ id: 0, name: 'Desktop' }],
    folderIdCounter: 1,
    lastFolderSeen: 0,
    markModified: jest.fn(),
    save: jest.fn().mockImplementation(function () { return Promise.resolve(this); }),
    ...overrides,
  };
}

describe('UserService.createFolder', () => {
  test('assigns the next id, increments the counter, and sorts by name', async () => {
    const user = makeUser();
    const newFolder = await UserService.createFolder(user, 'Archive');

    expect(newFolder).toMatchObject({ name: 'Archive', id: 1 });
    expect(user.folderIdCounter).toBe(2);
    // sorted alphabetically: Archive before Desktop
    expect(user.folders.map((f) => f.name)).toEqual(['Archive', 'Desktop']);
    expect(user.markModified).toHaveBeenCalledWith('folders');
    expect(user.save).toHaveBeenCalled();
  });
});

describe('UserService.deleteFolder', () => {
  test('deletes the folder and its files', async () => {
    const user = makeUser({
      folders: [{ id: 0, name: 'Desktop' }, { id: 1, name: 'Archive' }],
      lastFolderSeen: 1,
    });
    const files = [{ _id: 'f1' }];
    FileHelper.getUserFilesByFolderId.mockResolvedValue(files);
    FileService.deleteMultipleFiles.mockResolvedValue();

    const result = await UserService.deleteFolder(user, 1);

    expect(FileService.deleteMultipleFiles).toHaveBeenCalledWith(user, files);
    expect(user.folders.find((f) => f.id === 1)).toBeUndefined();
    expect(user.lastFolderSeen).toBeNull();
    expect(result).toBe(user);
  });

  test('throws a BusinessError when the folder does not exist', async () => {
    const user = makeUser();
    FileHelper.getUserFilesByFolderId.mockResolvedValue([]);
    FileService.deleteMultipleFiles.mockResolvedValue();

    await expect(UserService.deleteFolder(user, 999)).rejects.toBeInstanceOf(BusinessError);
  });
});

describe('UserService.renameFolder', () => {
  test('renames the matching folder', async () => {
    const user = makeUser();
    const result = await UserService.renameFolder(user, { id: 0, newName: 'Renamed' });

    expect(user.folders[0].name).toBe('Renamed');
    expect(result).toEqual({ success: true });
  });

  test('throws a BusinessError when the folder does not exist', async () => {
    const user = makeUser();
    await expect(
      UserService.renameFolder(user, { id: 999, newName: 'x' })
    ).rejects.toBeInstanceOf(BusinessError);
  });
});
