import { describe, test, expect } from 'vitest';
import treeModule from '../../../src/store/modules/tree';

const { mutations } = treeModule;

function baseState() {
  return { arbol: [], folders: null, currentFolder: null };
}

describe('tree store mutations', () => {
  test('refreshTree builds the tree grouped by folder and sorted by file name', () => {
    const state = baseState();
    const folders = [{ id: 0, name: 'Desktop' }, { id: 1, name: 'Archive' }];
    const files = [
      { name: 'b.mp3', folderId: 0 },
      { name: 'a.mp3', folderId: 0 },
      { name: 'c.mp3', folderId: 1 },
    ];

    mutations.refreshTree(state, { folders, files });

    expect(state.folders).toBe(folders);
    expect(state.currentFolder).toBe(folders[0]);
    expect(state.arbol).toHaveLength(2);
    expect(state.arbol[0].files.map((f) => f.name)).toEqual(['a.mp3', 'b.mp3']);
    expect(state.arbol[1].files.map((f) => f.name)).toEqual(['c.mp3']);
  });

  test('addFolderToTree appends the folder and an empty file list', () => {
    const state = { ...baseState(), folders: [], arbol: [] };
    const folder = { id: 5, name: 'New' };

    mutations.addFolderToTree(state, folder);

    expect(state.folders).toEqual([folder]);
    expect(state.arbol).toEqual([{ folder, files: [] }]);
  });

  test('removeFolderFromTree removes by tree index', () => {
    const state = { ...baseState(), arbol: [{ folder: { id: 0 }, files: [] }, { folder: { id: 1 }, files: [] }] };
    mutations.removeFolderFromTree(state, 0);
    expect(state.arbol).toHaveLength(1);
    expect(state.arbol[0].folder.id).toBe(1);
  });

  test('addFileToTree inserts and keeps the folder file list sorted', () => {
    const state = {
      ...baseState(),
      arbol: [{ folder: { id: 0 }, files: [{ name: 'a.mp3' }, { name: 'c.mp3' }] }],
    };

    mutations.addFileToTree(state, { treeIndex: 0, file: { name: 'b.mp3' } });

    expect(state.arbol[0].files.map((f) => f.name)).toEqual(['a.mp3', 'b.mp3', 'c.mp3']);
  });

  test('updateFileCurrentTimeInTree updates the target file only', () => {
    const state = {
      ...baseState(),
      arbol: [{ folder: { id: 0 }, files: [{ metaData: { currentTime: 0 } }] }],
    };

    mutations.updateFileCurrentTimeInTree(state, { treeIndex: 0, fileIndex: 0, currentTime: 42 });

    expect(state.arbol[0].files[0].metaData.currentTime).toBe(42);
  });

  test('setCurrentFolder replaces the current folder', () => {
    const state = baseState();
    const folder = { id: 2 };
    mutations.setCurrentFolder(state, folder);
    expect(state.currentFolder).toBe(folder);
  });
});
