import { describe, test, expect, vi } from 'vitest';

vi.mock('@/store', () => ({
  default: {
    state: {
      tree: {
        arbol: [
          { folder: { id: 0 }, files: [{ _id: 'a' }, { _id: 'b' }] },
          { folder: { id: 1 }, files: [{ _id: 'c' }] },
        ],
      },
    },
  },
}));

const TreeHelper = (await import('../../src/helpers/TreeHelper')).default;

describe('TreeHelper.indexesByFileId', () => {
  test('finds a file in a later folder', () => {
    expect(TreeHelper.indexesByFileId('c')).toEqual({ treeIndex: 1, fileIndex: 0 });
  });

  test('finds a file in the first folder', () => {
    expect(TreeHelper.indexesByFileId('b')).toEqual({ treeIndex: 0, fileIndex: 1 });
  });

  test('returns -1/-1 when the file is not in the tree', () => {
    expect(TreeHelper.indexesByFileId('missing')).toEqual({ treeIndex: -1, fileIndex: -1 });
  });
});
