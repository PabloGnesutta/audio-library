jest.mock('../../src/helper/BookmarkHelper');

const BookmarkHelper = require('../../src/helper/BookmarkHelper');
const BookmarkService = require('../../src/service/BookmarkService');

beforeEach(() => {
  jest.clearAllMocks();
});

function makeUser(overrides = {}) {
  return {
    _id: 'u1',
    folders: [{ id: 1, name: 'Podcasts' }, { id: 2, name: 'Lectures' }],
    ...overrides,
  };
}

describe('BookmarkService.searchBookmarks', () => {
  test('returns an empty array without querying when the search term is blank', async () => {
    const result = await BookmarkService.searchBookmarks(makeUser(), '   ');
    expect(result).toEqual([]);
    expect(BookmarkHelper.searchByLabel).not.toHaveBeenCalled();
  });

  test('maps matching bookmarks to include file name and folder name', async () => {
    BookmarkHelper.searchByLabel.mockResolvedValue([
      { _id: 'b1', time: 42, label: 'important part', content: 'remember this', file: { _id: 'f1', name: 'ep1.mp3', folderId: 1 } },
    ]);

    const result = await BookmarkService.searchBookmarks(makeUser(), 'important');

    expect(BookmarkHelper.searchByLabel).toHaveBeenCalledWith(expect.any(Object), 'important');
    expect(result).toEqual([
      { _id: 'b1', time: 42, label: 'important part', content: 'remember this', fileId: 'f1', fileName: 'ep1.mp3', folderId: 1, folderName: 'Podcasts' },
    ]);
  });

  test('skips bookmarks whose file has since been deleted', async () => {
    BookmarkHelper.searchByLabel.mockResolvedValue([
      { _id: 'b1', time: 0, label: 'orphaned', file: null },
    ]);

    const result = await BookmarkService.searchBookmarks(makeUser(), 'orphaned');

    expect(result).toEqual([]);
  });
});
