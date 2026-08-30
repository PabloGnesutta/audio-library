<template>
  <div
    class="backdrop z-100 fixed top-0 left-0 flex justify-center items-center"
    @click.self="onClickBackdrop"
  >
    <div
      class="backdrop-content relative of-y-auto"
      :style="{ maxWidth, maxHeight }"
    >
      <div @click="cerrarModal" class="close-icon absolute pointer">
        &times;
      </div>

      <!-- Title -->
      <h3 class="title text-center">{{ title }}</h3>

      <slot>
        <!-- Content -->
      </slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: { type: String, default: 'Modal' },
    evitarCierre: { type: Boolean, default: true },
    maxWidth: { type: String, default: '700px' },
    maxHeight: { type: String, default: '90vh' },
  },
  mounted() {
    document.addEventListener('keyup', this.handleEscape);
    console.log(this.maxWidth);
  },
  beforeUnmount() {
    document.removeEventListener('keyup', this.handleEscape);
  },
  methods: {
    cerrarModal() {
      document.removeEventListener('keyup', this.handleEscape);
      this.$emit('cerrarModal');
    },
    onClickBackdrop() {
      if (this.evitarCierre) return;
      this.cerrarModal();
    },
    handleEscape({ keyCode }) {
      if (keyCode === 27) this.cerrarModal();
    },
  },
};
</script>

<style lang="scss" scoped>
.backdrop {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: rgba(0, 0, 0, 0.65);
}

.backdrop-content {
  background: var(--color-4);
  color: var(--color-text);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  width: 90%;
  white-space: normal;
  box-shadow: var(--shadow-lg);
  padding: 1.75rem;
}

.title {
  max-width: 600px;
  margin: 0 0 1.5rem;
  padding-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.close-icon {
  top: 0.65rem;
  right: 0.65rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 1.5rem;
  line-height: 1;
  color: rgba(255, 255, 255, 0.55);
  transition: background-color 0.15s ease-out, color 0.15s ease-out;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-2);
  }
}
</style>
