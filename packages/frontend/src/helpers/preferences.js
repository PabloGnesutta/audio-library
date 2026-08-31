const AUTOPLAY_KEY = 'autoplayEnabled';
const PLAYBACK_RATE_KEY = 'playbackRate';

export function getAutoplayEnabled() {
  const stored = localStorage.getItem(AUTOPLAY_KEY);
  return stored === null ? true : stored === 'true';
}

export function setAutoplayEnabled(enabled) {
  localStorage.setItem(AUTOPLAY_KEY, enabled ? 'true' : 'false');
}

export function getPlaybackRate() {
  const stored = Number(localStorage.getItem(PLAYBACK_RATE_KEY));
  return stored > 0 ? stored : 1;
}

export function setPlaybackRate(rate) {
  localStorage.setItem(PLAYBACK_RATE_KEY, rate);
}
