import { describe, test, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ShareModal from '../../../../src/components/tree/popups/ShareModal.vue';
import ShareController from '../../../../src/controller/share-controller';

vi.mock('../../../../src/controller/share-controller', () => ({
  default: {
    shareFile: vi.fn(),
    shareFolder: vi.fn(),
    getOutgoing: vi.fn(),
    revoke: vi.fn(),
  },
}));

function makeStore() {
  const store = createStore({
    modules: {
      share: {
        namespaced: true,
        state: {},
        getters: { sharesForResource: () => () => [] },
        mutations: { setOutgoing: () => {}, removeShare: () => {} },
      },
    },
  });
  store.commit = vi.fn();
  return store;
}

function mountModal() {
  const store = makeStore();
  const wrapper = mount(ShareModal, { global: { plugins: [store] } });
  return { wrapper, store };
}

beforeEach(() => {
  vi.clearAllMocks();
  ShareController.getOutgoing.mockResolvedValue({ data: { shares: [] } });
});

describe('ShareModal single-file mode', () => {
  test('is not rendered until a share is prompted', () => {
    const { wrapper } = mountModal();
    expect(wrapper.findComponent({ name: 'ModalBox' }).exists()).toBe(false);
  });

  test('promptShareFile titles the modal with the file name', async () => {
    const { wrapper } = mountModal();
    await wrapper.vm.promptShareFile({ _id: 'f1', name: 'lecture.mp3' });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Share file');
    expect(wrapper.text()).toContain('lecture.mp3');
  });

  test('share() shares only the single file and does not emit multipleFilesShared', async () => {
    const { wrapper } = mountModal();
    await wrapper.vm.promptShareFile({ _id: 'f1', name: 'lecture.mp3' });
    wrapper.vm.recipientEmail = 'friend@example.com';

    await wrapper.vm.share();

    expect(ShareController.shareFile).toHaveBeenCalledWith('f1', 'friend@example.com');
    expect(wrapper.emitted('multipleFilesShared')).toBeFalsy();
  });
});

describe('ShareModal multiple-files mode', () => {
  test('promptShareMultipleFiles lists every file and titles the modal with a count', async () => {
    const { wrapper } = mountModal();
    await wrapper.vm.promptShareMultipleFiles([
      { _id: 'a', name: 'a.mp3' },
      { _id: 'b', name: 'b.mp3' },
    ]);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Share 2 files');
    expect(wrapper.text()).toContain('a.mp3');
    expect(wrapper.text()).toContain('b.mp3');
    expect(wrapper.find('.shares-list').exists()).toBe(false);
  });

  test('share() shares every selected file with the given email and emits multipleFilesShared', async () => {
    const { wrapper } = mountModal();
    await wrapper.vm.promptShareMultipleFiles([{ _id: 'a' }, { _id: 'b' }]);
    wrapper.vm.recipientEmail = 'friend@example.com';

    await wrapper.vm.share();

    expect(ShareController.shareFile).toHaveBeenCalledWith('a', 'friend@example.com');
    expect(ShareController.shareFile).toHaveBeenCalledWith('b', 'friend@example.com');
    expect(wrapper.emitted('multipleFilesShared')).toBeTruthy();
    expect(wrapper.vm.recipientEmail).toBe('');
  });
});
