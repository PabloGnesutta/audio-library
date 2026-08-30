<template>
  <div class="toasts">
    <transition-group name="slide" tag="ul" mode="out-in">
      <li
        v-for="(message, index) in messages"
        :key="message.id"
        class="toast"
        :class="{ success: message.success }"
      >
        <span> {{ message.text }} </span>
        <span class="close-icon" @click="closeToast(index)">&times;</span>
      </li>
    </transition-group>
  </div>
</template>

<script>
import eventBus from '@/plugins/event-bus';
export default {
  name: 'Toast',
  data() {
    return {
      toastDuration: 6000,
      idCount: 0,
      messages: [],
    };
  },
  mounted() {
    eventBus.$on('push_toast', this.onPushToast);
  },
  methods: {
    onPushToast({ msg, success }) {
      const msgObj = {
        text: msg,
        id: ++this.idCount,
        success: success || false,
      };

      this.messages.unshift(msgObj);

      setTimeout(() => {
        const index = this.messages.findIndex((m) => m.id === msgObj.id);
        this.messages.splice(index, 1);
      }, this.toastDuration);

      success ? console.log(msg) : console.warn(msg);
    },

    closeToast(index) {
      this.messages.splice(index, 1);
    },
  },
};
</script>

<style scoped lang="scss">
.toasts {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 999;
}
.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: #870000;
  margin-bottom: 0.25rem;
  .close-icon {
    font-size: 1.5rem;
    cursor: pointer;
  }
}
.toast.success {
  background: #318700;
}

.slide-enter-active {
  animation: slide-in 300ms ease-out forwards;
}

.slide-leave-active {
  animation: slide-out 300ms ease-out forwards;
}

@keyframes slide-in {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slide-out {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}
</style>
