import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import AudioPlayer from '../../../src/components/audio-player/AudioPlayer.vue';

function makeStore() {
  return createStore({
    state: { pageFirstInteraction: false, avoidKeyListeners: false },
    getters: {
      pageFirstInteraction: (state) => state.pageFirstInteraction,
      avoidKeyListeners: (state) => state.avoidKeyListeners,
    },
    modules: {
      audioPlayer: {
        namespaced: true,
        mutations: { setTotalDuration: () => {}, setFlooredCurrentTime: () => {} },
      },
    },
  });
}

function mountPlayer() {
  return mount(AudioPlayer, {
    props: { audioUrl: '', fileName: 'lecture.mp3', fileType: 'audio/mpeg', startAt: 0, bookmarks: [] },
    global: { plugins: [makeStore()] },
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AudioPlayer sleep timer', () => {
  test('clicking cycles through the preset durations and back to off', async () => {
    const wrapper = mountPlayer();
    const toggle = wrapper.find('.sleep-timer');

    await toggle.trigger('click');
    expect(wrapper.vm.sleepTimerMinutes).toBe(15);
    await toggle.trigger('click');
    expect(wrapper.vm.sleepTimerMinutes).toBe(30);
    await toggle.trigger('click');
    expect(wrapper.vm.sleepTimerMinutes).toBe(45);
    await toggle.trigger('click');
    expect(wrapper.vm.sleepTimerMinutes).toBe(60);
    await toggle.trigger('click');
    expect(wrapper.vm.sleepTimerMinutes).toBeNull();
  });

  test('shows the remaining time while active and hides it when off', async () => {
    const wrapper = mountPlayer();
    expect(wrapper.find('.sleep-timer').text()).not.toMatch(/\d/);

    wrapper.vm.startSleepTimer(15);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.sleep-timer').text()).toContain('15:00');

    vi.advanceTimersByTime(60_000);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.sleep-timer').text()).toContain('14:00');
  });

  test('pauses playback and turns itself off once the countdown reaches zero', async () => {
    const wrapper = mountPlayer();
    wrapper.vm.AP = { pause: vi.fn() };

    wrapper.vm.startSleepTimer(15);
    vi.advanceTimersByTime(15 * 60 * 1000);

    expect(wrapper.vm.AP.pause).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.sleepTimerMinutes).toBeNull();
    expect(wrapper.vm.sleepTimerRemainingSeconds).toBe(0);
  });

  test('cancelling clears the interval so it never fires late', async () => {
    const wrapper = mountPlayer();
    wrapper.vm.AP = { pause: vi.fn() };

    wrapper.vm.startSleepTimer(15);
    wrapper.vm.cancelSleepTimer();
    vi.advanceTimersByTime(15 * 60 * 1000);

    expect(wrapper.vm.AP.pause).not.toHaveBeenCalled();
  });

  test('unmounting the player clears the interval', () => {
    const wrapper = mountPlayer();
    wrapper.vm.AP = { pause: vi.fn() };
    wrapper.vm.startSleepTimer(15);

    wrapper.unmount();
    vi.advanceTimersByTime(15 * 60 * 1000);

    expect(wrapper.vm.AP.pause).not.toHaveBeenCalled();
  });
});
