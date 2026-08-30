import eventBus from '@/plugins/event-bus';
// TODO: rename to toast-mixin
export default {
  methods: {
    _formatError(e) {
      const response = e.msg?.response || e.response;
      let msg = '';
      if (response) {
        if (response.data) {
          msg = response.data;
        } else {
          msg = response;
        }
      } else if (e.message) {
        msg = e.message;
      } else {
        msg = e;
      }
      return msg;
    },

    toastError(e) {
      const msg = this._formatError(e);
      this.pushToast({ msg, success: false });
    },

    pushToast({ msg, success }) {
      eventBus.$emit('push_toast', { msg, success: success || false });
    },
  },
};
