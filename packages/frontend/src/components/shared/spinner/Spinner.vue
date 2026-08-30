<template>
  <div
    class="spinner"
    :style="{
      width: radiusInPixels,
      height: radiusInPixels,
      borderWidth: thicknessInPixels,
    }"
  ></div>
</template>

<script>
export default {
  props: {
    radius: { type: String, default: "20" },
    thickness: { type: String, default: "2" },
  },
  computed: {
    radiusInPixels() {
      return this.radius + "px";
    },
    thicknessInPixels() {
      return this.thickness + "px";
    },
  },
};
</script>

<style lang="scss" scoped>
.spinner {
  animation: loading-animation 0.7s linear infinite;
  border-right-style: solid;
  border-bottom-style: solid;
  border-radius: 50%;
  border-color: #e15b64;
  border-width: 2px;
}

@keyframes loading-animation {
  0% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(180deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
