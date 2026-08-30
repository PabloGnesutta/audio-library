import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FileRow from '../../../src/components/tree/FileRow.vue';

function makeFile(overrides = {}) {
  return {
    _id: 'file-1',
    name: 'lecture-01.mp3',
    completed: false,
    tags: [],
    ...overrides,
  };
}

describe('FileRow', () => {
  test('renders the file name', () => {
    const wrapper = mount(FileRow, { props: { file: makeFile() } });
    expect(wrapper.text()).toContain('lecture-01.mp3');
  });

  test('shows the completed icon and styling only when the file is completed', () => {
    const incomplete = mount(FileRow, { props: { file: makeFile({ completed: false }) } });
    expect(incomplete.find('.completed-icon').exists()).toBe(false);
    expect(incomplete.find('.file-name').classes()).not.toContain('completed');

    const completed = mount(FileRow, { props: { file: makeFile({ completed: true }) } });
    expect(completed.find('.completed-icon').exists()).toBe(true);
    expect(completed.find('.file-name').classes()).toContain('completed');
  });

  test('renders each tag as a chip', () => {
    const wrapper = mount(FileRow, {
      props: { file: makeFile({ tags: ['spanish', 'podcast'] }) },
    });
    const chips = wrapper.findAll('.tag-chip');
    expect(chips.map((c) => c.text())).toEqual(['spanish', 'podcast']);
  });

  // Regression: selection used to be local/uncontrolled state on the
  // checkbox, so a parent clearing its selection list after an in-place
  // bulk action (tags, mark complete) left the box visibly checked even
  // though nothing was selected anymore. `selected` is now parent-driven.
  test('checkbox reflects the selected prop rather than owning its own state', async () => {
    const wrapper = mount(FileRow, {
      props: { file: makeFile(), selected: true },
    });
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(true);

    await wrapper.setProps({ selected: false });
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(false);
  });

  test('toggling the checkbox emits toggleFileSelected with the new checked state', async () => {
    const wrapper = mount(FileRow, { props: { file: makeFile(), selected: false } });
    const checkbox = wrapper.find('input[type="checkbox"]');

    await checkbox.setValue(true);
    expect(wrapper.emitted('toggleFileSelected')[0]).toEqual([true]);

    await checkbox.setValue(false);
    expect(wrapper.emitted('toggleFileSelected')[1]).toEqual([false]);
  });

  test('clicking the file name emits openFile when the row is not active', async () => {
    const wrapper = mount(FileRow, { props: { file: makeFile(), active: false } });
    await wrapper.find('.file-name').trigger('click');
    expect(wrapper.emitted('openFile')).toBeTruthy();
  });

  test('clicking the file name does not emit openFile when the row is already active', async () => {
    const wrapper = mount(FileRow, { props: { file: makeFile(), active: true } });
    await wrapper.find('.file-name').trigger('click');
    expect(wrapper.emitted('openFile')).toBeFalsy();
  });

  test('the action icons emit their events with the file', async () => {
    const file = makeFile();
    const wrapper = mount(FileRow, { props: { file } });
    const icons = wrapper.findAll('.right .icon');

    await icons[0].trigger('click'); // tags
    await icons[1].trigger('click'); // move
    await icons[2].trigger('click'); // delete

    expect(wrapper.emitted('openFileTagsMenu')[0]).toEqual([file]);
    expect(wrapper.emitted('openFileMoveMenu')[0]).toEqual([file]);
    expect(wrapper.emitted('deleteFile')).toBeTruthy();
  });

  test('hides the checkbox and action icons while a delete/move is in flight', () => {
    const wrapper = mount(FileRow, {
      props: { file: makeFile(), status: 'deleting' },
    });
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);
    expect(wrapper.find('.right').exists()).toBe(false);
    expect(wrapper.text()).toContain('deleting');
  });
});
