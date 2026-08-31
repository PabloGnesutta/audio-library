import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import FileSearchBox from '../../../src/components/tree/FileSearchBox.vue';
import FileController from '../../../src/controller/file-controller';

vi.mock('../../../src/controller/file-controller', () => ({
  default: {
    search: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

async function typeQuery(wrapper, value) {
  const input = wrapper.find('input');
  await input.setValue(value);
  await input.trigger('input');
}

describe('FileSearchBox', () => {
  test('does not search while the query is blank', async () => {
    const wrapper = mount(FileSearchBox);
    await typeQuery(wrapper, '   ');

    expect(FileController.search).not.toHaveBeenCalled();
    expect(wrapper.find('.results-list').exists()).toBe(false);
  });

  test('debounces input and searches once the query settles', async () => {
    FileController.search.mockResolvedValue({ data: { files: [] } });
    const wrapper = mount(FileSearchBox);

    await typeQuery(wrapper, 'lect');
    await typeQuery(wrapper, 'lecture');
    expect(FileController.search).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(300);

    expect(FileController.search).toHaveBeenCalledTimes(1);
    expect(FileController.search).toHaveBeenCalledWith('lecture');
  });

  test('renders matching results with their folder name', async () => {
    FileController.search.mockResolvedValue({
      data: { files: [{ _id: 'f1', name: 'lecture-1.mp3', folderId: 1, folderName: 'Lectures' }] },
    });
    const wrapper = mount(FileSearchBox);

    await typeQuery(wrapper, 'lecture');
    await vi.advanceTimersByTimeAsync(300);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('lecture-1.mp3');
    expect(wrapper.text()).toContain('Lectures');
  });

  test('shows a "no files found" message when nothing matches', async () => {
    FileController.search.mockResolvedValue({ data: { files: [] } });
    const wrapper = mount(FileSearchBox);

    await typeQuery(wrapper, 'nope');
    await vi.advanceTimersByTimeAsync(300);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('No files found');
  });

  test('selecting a result emits fileSelected and clears the query', async () => {
    const result = { _id: 'f1', name: 'lecture-1.mp3', folderId: 1, folderName: 'Lectures' };
    FileController.search.mockResolvedValue({ data: { files: [result] } });
    const wrapper = mount(FileSearchBox);

    await typeQuery(wrapper, 'lecture');
    await vi.advanceTimersByTimeAsync(300);
    await wrapper.vm.$nextTick();

    await wrapper.find('.result-row').trigger('click');

    expect(wrapper.emitted('fileSelected')).toEqual([[result]]);
    expect(wrapper.vm.query).toBe('');
    expect(wrapper.find('.results-list').exists()).toBe(false);
  });
});
