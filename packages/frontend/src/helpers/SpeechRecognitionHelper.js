// Thin wrapper around the (vendor-prefixed) Web Speech API for one-shot
// dictation. Feature-detected -- callers must check isSupported() before
// offering any voice-input UI, since support is Chromium-only at the time
// of writing (no Firefox, patchy Safari) and requires a secure context
// (HTTPS, or localhost for dev).
class SpeechRecognitionHelper {
  static isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  // Starts listening for a single utterance and stops automatically once the
  // speech engine detects the end of speech (non-continuous mode). Returns a
  // `{ stop }` handle to cancel early, or null if unsupported or it failed to
  // start (e.g. InvalidStateError, or a secure-context failure).
  static listenOnce({ lang = 'en-US', onResult, onError, onEnd }) {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return null;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript || '';
      onResult(transcript);
    };
    recognition.onerror = (e) => {
      if (onError) onError(e.error);
    };
    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    try {
      recognition.start();
    } catch (_err) {
      return null;
    }

    return { stop: () => recognition.stop() };
  }
}

export default SpeechRecognitionHelper;
