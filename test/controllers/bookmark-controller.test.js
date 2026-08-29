jest.mock('../../src/service/BookmarkService');

const BookmarkService = require('../../src/service/BookmarkService');
const bookmarkController = require('../../src/controllers/bookmark-controller');
const BusinessError = require('../../src/exception/BusinessError');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('updateBookmark', () => {
  // Regression test: this used to catch as `(_err)` but reference the
  // undefined `_err` from an outer scope was actually the other way
  // around -- `catch (err)` while the body referenced `_err`, which is
  // undefined in this function's scope, throwing a ReferenceError instead
  // of forwarding the real error to next() (see DIAGNOSIS.md).
  test('forwards the real error to next() instead of throwing a ReferenceError', async () => {
    const businessError = new BusinessError('Bookmark not found');
    BookmarkService.updateBookmark.mockRejectedValue(businessError);

    const req = { user: { _id: 'user-1' }, params: { _id: 'bm-1' }, body: { label: 'new label' } };
    const res = mockRes();
    const next = jest.fn();

    await bookmarkController.updateBookmark(req, res, next);

    expect(next).toHaveBeenCalledWith(businessError);
    expect(res.json).not.toHaveBeenCalled();
  });

  test('responds with the updated bookmark on success', async () => {
    BookmarkService.updateBookmark.mockResolvedValue({ _id: 'bm-1', label: 'new label' });

    const req = { user: { _id: 'user-1' }, params: { _id: 'bm-1' }, body: { label: 'new label' } };
    const res = mockRes();
    const next = jest.fn();

    await bookmarkController.updateBookmark(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ bookmark: { _id: 'bm-1', label: 'new label' } });
    expect(next).not.toHaveBeenCalled();
  });
});
