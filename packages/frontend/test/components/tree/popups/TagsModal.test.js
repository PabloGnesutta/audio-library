import { describe, test, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import TagsModal from '../../../../src/components/tree/popups/TagsModal.vue';
import FileController from '../../../../src/controller/file-controller';

vi.mock('../../../../src/controller/file-controller', () => ({
  default: {
    updateFile: vi.fn(),
    addTagsToMultipleFiles: vi.fn(),
  },
}));

function makeStore() {
  const store = createStore({
    modules: {
      tree: {
        namespaced: true,
        state: {},
        getters: { allTags: () => ['podcast', 'spanish'] },
        mutations: { refreshTree: () => {} },
      },
    },
  });
  store.commit = vi.fn();
  return store;
}

function mountModal() {
  const store = makeStore();
  const wrapper = mount(TagsModal, { global: { plugins: [store] } });
  return { wrapper, store };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TagsModal single-file mode', () => {
  test('is not rendered until an edit is prompted', () => {
    const { wrapper } = mountModal();
    expect(wrapper.findComponent({ name: 'ModalBox' }).exists()).toBe(false);
  });

  test('promptEditTags seeds the tag list from the file and titles the modal with its name', async () => {
    const { wrapper } = mountModal();
    await wrapper.vm.promptEditTags({ _id: 'f1', name: 'lecture.mp3', tags: ['spanish'] });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.tags).toEqual(['spanish']);
    expect(wrapper.text()).toContain('Tags for lecture.mp3');
    expect(wrapper.text()).toContain('Save');
  });

  test('save() replaces the file\'s tags and refreshes the tree', async () => {
    FileController.updateFile.mockResolvedValue({
      data: { folders: ['f'], files: ['x'] },
    });
    const { wrapper, store } = mountModal();
    await wrapper.vm.promptEditTags({ _id: 'f1', name: 'lecture.mp3', tags: ['spanish'] });
    wrapper.vm.tags = ['spanish', 'favorite'];

    await wrapper.vm.save();

    expect(FileController.updateFile).toHaveBeenCalledWith('f1', 'tags', ['spanish', 'favorite']);
    expect(store.commit).toHaveBeenCalledWith('tree/refreshTree', { folders: ['f'], files: ['x'] });
    expect(wrapper.vm.mode).toBeNull();
  });
});

describe('TagsModal multiple-files mode', () => {
  test('promptEditTagsForMultipleFiles starts with an empty tag list and a count-based title', async () => {
    const { wrapper } = mountModal();
    await wrapper.vm.promptEditTagsForMultipleFiles([
      { _id: 'a', tags: ['x'] },
      { _id: 'b', tags: ['y', 'z'] },
    ]);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.tags).toEqual([]);
    expect(wrapper.text()).toContain('Apply tags to 2 files');
    expect(wrapper.text()).toContain('Apply tags');
  });

  test('save() applies (not replaces) tags across every selected file and emits tagsAppliedToMultipleFiles', async () => {
    FileController.addTagsToMultipleFiles.mockResolvedValue({
      data: { folders: ['f'], files: ['x'] },
    });
    const { wrapper, store } = mountModal();
    await wrapper.vm.promptEditTagsForMultipleFiles([{ _id: 'a' }, { _id: 'b' }]);
    wrapper.vm.tags = ['favorite'];

    await wrapper.vm.save();

    expect(FileController.addTagsToMultipleFiles).toHaveBeenCalledWith(['a', 'b'], ['favorite']);
    expect(FileController.updateFile).not.toHaveBeenCalled();
    expect(store.commit).toHaveBeenCalledWith('tree/refreshTree', { folders: ['f'], files: ['x'] });
    expect(wrapper.emitted('tagsAppliedToMultipleFiles')).toBeTruthy();
    expect(wrapper.vm.mode).toBeNull();
  });
});

describe('TagsModal tag editing', () => {
  test('addTag trims, lowercases, and dedupes', async () => {
    const { wrapper } = mountModal();
    await wrapper.vm.promptEditTagsForMultipleFiles([{ _id: 'a' }]);

    wrapper.vm.newTag = '  Spanish  ';
    wrapper.vm.addTag();
    wrapper.vm.newTag = 'spanish';
    wrapper.vm.addTag();
    wrapper.vm.newTag = '   ';
    wrapper.vm.addTag();

    expect(wrapper.vm.tags).toEqual(['spanish']);
  });

  test('removeTag removes only the given tag', async () => {
    const { wrapper } = mountModal();
    await wrapper.vm.promptEditTags({ _id: 'f1', name: 'x.mp3', tags: ['a', 'b', 'c'] });

    wrapper.vm.removeTag('b');

    expect(wrapper.vm.tags).toEqual(['a', 'c']);
  });
});
