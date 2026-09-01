const AUTOPLAY_KEY = 'autoplayEnabled';
const PLAYBACK_RATE_KEY = 'playbackRate';
const PLAY_ON_SELECT_KEY = 'playOnSelectEnabled';

export function getAutoplayEnabled() {
  const stored = localStorage.getItem(AUTOPLAY_KEY);
  return stored === null ? true : stored === 'true';
}

export function setAutoplayEnabled(enabled) {
  localStorage.setItem(AUTOPLAY_KEY, enabled ? 'true' : 'false');
}

export function getPlayOnSelectEnabled() {
  return localStorage.getItem(PLAY_ON_SELECT_KEY) === 'true';
}

export function setPlayOnSelectEnabled(enabled) {
  localStorage.setItem(PLAY_ON_SELECT_KEY, enabled ? 'true' : 'false');
}

export function getPlaybackRate() {
  const stored = Number(localStorage.getItem(PLAYBACK_RATE_KEY));
  return stored > 0 ? stored : 1;
}

export function setPlaybackRate(rate) {
  localStorage.setItem(PLAYBACK_RATE_KEY, rate);
}
