// @ts-check

/**
 * Replacement for the Vue 2-based EventBus.
 *
 * @template EventName
 */
class Bus {
  constructor() {
    this.eventListeners = new Map();
  }

  /**
   * @param {EventName} eventName
   * @param {Function} callback
   * @param {boolean} [once]
   * @private
   */
  registerEventListener(eventName, callback, once = false) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }

    const eventListeners = this.eventListeners.get(eventName);
    eventListeners.push({ callback, once });
  }

  /**
   * See: https://v2.vuejs.org/v2/api/#vm-on
   *
   * @param {EventName} eventName
   * @param {Function} callback
   */
  $on(eventName, callback) {
    this.registerEventListener(eventName, callback);
  }

  /**
   * See: https://v2.vuejs.org/v2/api/#vm-once
   *
   * @param {EventName} eventName
   * @param {Function} callback
   */
  $once(eventName, callback) {
    const once = true;
    this.registerEventListener(eventName, callback, once);
  }

  $off(eventNameOrNames, callback = undefined) {
    const eventNames = Array.isArray(eventNameOrNames)
      ? eventNameOrNames
      : [eventNameOrNames];

    for (const eventName of eventNames) {
      const eventListeners = this.eventListeners.get(eventName);

      if (eventListeners === undefined) {
        continue;
      }

      if (typeof callback === 'function') {
        for (let i = eventListeners.length - 1; i >= 0; i--) {
          if (eventListeners[i].callback === callback) {
            eventListeners.splice(i, 1);
          }
        }
      } else {
        this.eventListeners.delete(eventName);
      }
    }
  }

  $emit(eventName, ...args) {
    if (!this.eventListeners.has(eventName)) {
      return;
    }

    const eventListeners = this.eventListeners.get(eventName);
    const eventListenerIndexesToDelete = [];
    for (const [
      eventListenerIndex,
      eventListener,
    ] of eventListeners.entries()) {
      eventListener.callback(...args);

      if (eventListener.once) {
        eventListenerIndexesToDelete.push(eventListenerIndex);
      }
    }

    for (let i = eventListenerIndexesToDelete.length - 1; i >= 0; i--) {
      eventListeners.splice(eventListenerIndexesToDelete[i], 1);
    }
  }
}

const EventBus = new Bus();

export default EventBus;
