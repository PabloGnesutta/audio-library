const AUTOPLAY_KEY = 'autoplayEnabled';

export function getAutoplayEnabled() {
  const stored = localStorage.getItem(AUTOPLAY_KEY);
  return stored === null ? true : stored === 'true';
}

export function setAutoplayEnabled(enabled) {
  localStorage.setItem(AUTOPLAY_KEY, enabled ? 'true' : 'false');
}
