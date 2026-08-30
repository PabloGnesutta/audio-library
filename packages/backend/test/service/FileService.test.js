jest.mock('../../src/helper/FileHelper');
jest.mock('../../src/helper/S3Helper');
jest.mock('../../src/helper/ShareHelper');

const FileHelper = require('../../src/helper/FileHelper');
const S3Helper = require('../../src/helper/S3Helper');
const ShareHelper = require('../../src/helper/ShareHelper');
const FileService = require('../../src/service/FileService');
const BusinessError = require('../../src/exception/BusinessError');

function makeFile(overrides = {}) {
  return {
    _id: 'file-1',
    key: 'audio-library/user/file.mp3',
    deleteOne: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeUser(overrides = {}) {
  return {
    lastFileSeen: null,
    save: jest.fn().mockImplementation(function () { return Promise.resolve(this); }),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('FileService.getFileUrl', () => {
  test('returns a signed url when the requesting user has access (owner or share)', async () => {
    const file = makeFile();
    FileHelper.getFileById.mockResolvedValue(file);
    ShareHelper.canAccessFile.mockResolvedValue(true);
    S3Helper.getSignedUrl.mockResolvedValue('https://signed.example/file.mp3');

    const { url } = await FileService.getFileUrl(makeUser(), 'file-1');

    expect(ShareHelper.canAccessFile).toHaveBeenCalledWith(expect.any(Object), file);
    expect(S3Helper.getSignedUrl).toHaveBeenCalledWith('getObject', { Key: file.key, Expires: 3600 });
    expect(url).toBe('https://signed.example/file.mp3');
  });

  test('throws a BusinessError when the file does not exist', async () => {
    FileHelper.getFileById.mockResolvedValue(null);
    await expect(FileService.getFileUrl(makeUser(), 'missing-file'))
      .rejects.toBeInstanceOf(BusinessError);
    expect(ShareHelper.canAccessFile).not.toHaveBeenCalled();
  });

  test('throws a BusinessError when the user neither owns nor has been shared the file', async () => {
    FileHelper.getFileById.mockResolvedValue(makeFile());
    ShareHelper.canAccessFile.mockResolvedValue(false);

    await expect(FileService.getFileUrl(makeUser(), 'file-1'))
      .rejects.toBeInstanceOf(BusinessError);
    expect(S3Helper.getSignedUrl).not.toHaveBeenCalled();
  });
});

describe('FileService.deleteFile', () => {
  // Regression test: Mongoose 7+ removed Document#remove()/#delete() --
  // this must call deleteOne(), not the old aliases (see DIAGNOSIS.md).
  test('deletes from S3 and calls deleteOne() on the document (not delete()/remove())', async () => {
    const file = makeFile();
    FileHelper.getUserFileById.mockResolvedValue(file);
    S3Helper.deleteFile.mockResolvedValue();
    const user = makeUser({ lastFileSeen: 'file-1' });

    await FileService.deleteFile(user, 'file-1');

    expect(S3Helper.deleteFile).toHaveBeenCalledWith({ Key: file.key });
    expect(file.deleteOne).toHaveBeenCalledTimes(1);
    expect(file.delete).toBeUndefined();
    expect(user.lastFileSeen).toBeNull();
    expect(user.save).toHaveBeenCalled();
  });

  test('throws a BusinessError when the file does not belong to the user', async () => {
    FileHelper.getUserFileById.mockResolvedValue(null);
    await expect(FileService.deleteFile(makeUser(), 'missing-file'))
      .rejects.toBeInstanceOf(BusinessError);
  });
});

describe('FileService.deleteMultipleFiles', () => {
  test('deletes every file via deleteOne() and clears lastFileSeen when it matches', async () => {
    const fileA = makeFile({ _id: 'a', name: 'a.mp3' });
    const fileB = makeFile({ _id: 'b', name: 'b.mp3' });
    S3Helper.deleteFile.mockResolvedValue();
    const user = makeUser({ lastFileSeen: 'a' });

    await FileService.deleteMultipleFiles(user, [fileA, fileB]);

    expect(fileA.deleteOne).toHaveBeenCalledTimes(1);
    expect(fileB.deleteOne).toHaveBeenCalledTimes(1);
    expect(user.lastFileSeen).toBeNull();
  });
});

describe('FileService.addTagsToMultipleFiles', () => {
  test('merges new tags into each file\'s existing tags without duplicating', async () => {
    const fileA = makeFile({ _id: 'a', tags: ['podcast'], markModified: jest.fn(), save: jest.fn().mockResolvedValue() });
    const fileB = makeFile({ _id: 'b', tags: ['podcast', 'spanish'], markModified: jest.fn(), save: jest.fn().mockResolvedValue() });
    FileHelper.getUserFileById.mockImplementation((_user, _id) =>
      Promise.resolve(_id === 'a' ? fileA : fileB)
    );
    const user = makeUser();

    await FileService.addTagsToMultipleFiles(user, { fileIdsList: ['a', 'b'], tags: ['spanish', 'favorite'] });

    expect(fileA.tags).toEqual(['podcast', 'spanish', 'favorite']);
    expect(fileB.tags).toEqual(['podcast', 'spanish', 'favorite']);
    expect(fileA.save).toHaveBeenCalledTimes(1);
    expect(fileB.save).toHaveBeenCalledTimes(1);
  });

  test('throws a BusinessError when a file does not belong to the user', async () => {
    FileHelper.getUserFileById.mockResolvedValue(null);
    await expect(
      FileService.addTagsToMultipleFiles(makeUser(), { fileIdsList: ['missing'], tags: ['x'] })
    ).rejects.toBeInstanceOf(BusinessError);
  });
});
