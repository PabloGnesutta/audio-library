<template>
  <div class="color-3 flex justify-center gap-1">
    <div class="icon p-0.5 pointer select-none" @click="speedDown">&minus;</div>
    <div class="value p-0.5 pointer select-none" @click="resetPlaybackRate">
      {{ playbackRate }}x
    </div>
    <div class="icon p-0.5 pointer select-none" @click="speedUp">&plus;</div>
  </div>
</template>

<script>
export default {
  name: "PlaybackRateSelect",
  props: {
    playbackRate: { type: Number, default: 1 },
  },
  methods: {
    speedUp() {
      this.$emit("speedUp");
    },
    speedDown() {
      this.$emit("speedDown");
    },
    resetPlaybackRate() {
      this.$emit("resetPlaybackRate");
    },
  },
};
</script>

<style scoped>
.icon {
  font-size: 1.5rem;
}
.value {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
}
</style>