<template>
  <div
    class="backdrop z-100 fixed top-0 left-0 flex justify-center items-center"
    @click.self="onClickBackdrop"
  >
    <div
      class="backdrop-content relative of-y-auto color-text-dark"
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
  beforeDestroy() {
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
  background: rgba(0, 0, 0, 0.5);
}

.backdrop-content {
  background: #d3d3d3;
  border-radius: 10px;
  width: 90%;
  white-space: normal;
  box-shadow: 0 2px 10px 1px var(--color-text-dark);
  padding: 1.5rem;
}

.title {
  max-width: 600px;
  margin: 0 auto 2rem;
}

.close-icon {
  top: 5px;
  right: 16px;
  font-size: 2.5rem;
  font-weight: bold;
  cursor: pointer;
  &:hover {
    color: var(--color-2);
  }
}
</style>
