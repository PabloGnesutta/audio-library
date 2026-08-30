<template>
  <div>
    <div class="volume-slider-wrapper focusable">
      <div
        class="icon icon-volume"
        @click="onVolumeClick"
        @mouseenter="onVolumeMouseenter"
        @mouseleave="onVolumeMouseleave"
      >
        <span class="img-svg-icon" v-if="!isMuted">
          <img src="../../../public/icons/volume-up.svg" v-if="volume >= 0.5" />
          <img
            src="../../../public/icons/volume-down.svg"
            v-if="volume > 0.1 && volume < 0.5"
          />
          <img
            src="../../../public/icons/volume-zero.svg"
            v-if="volume <= 0.1"
          />
        </span>
        <span class="img-svg-icon" v-if="isMuted">
          <img src="../../../public/icons/volume-mute.svg" />
        </span>
      </div>

      <!-- SLIDER -->
      <div class="volume-slider-container hidden">
        <div class="volume-slider">
          <div class="volume-slider-track"></div>
          <div
            class="volume-slider-fill"
            :style="{ height: volumeSliderFillPercentage }"
          >
            <div class="volume-slider-dot"></div>
          </div>
          <div
            class="volume-slider-clickable focusable"
            @mousedown="onVolumeSliderMousedown"
            @mouseleave="onVolumeSliderMouseleave"
            @mouseenter="onVolumeSliderMouseenter"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "VolumeSlider",
  props: {},

  data() {
    return {
      volumeSliderFillPercentage: 100,
      volumeSliderHeight: undefined,
      volumeIsSliding: false,
      isMuted: false,
    };
  },

  mounted() {
    this.volumeSliderHeight = document
      .querySelector(".volume-slider-clickable")
      .getBoundingClientRect().height;
  },

  methods: {
    onVolumeClick() {
      this.isMuted = !this.isMuted;
      // emit this
      this.AP.muted = !this.AP.muted;
    },

    onVolumeMouseenter(e) {
      if (this.progressBarIsSliding) return;

      const volumeBtn = e.target;
      if (!volumeBtn.classList.contains("hovered"))
        volumeBtn.classList.add("hovered");

      const slider = document.querySelector(".volume-slider-container");
      if (slider.classList.contains("hidden"))
        slider.classList.remove("hidden");
    },

    onVolumeMouseleave(e) {
      if (this.volumeIsSliding) return;
      const volumeBtn = document.querySelector(".icon-volume");

      if (e)
        if (volumeBtn.classList.contains("hovered"))
          volumeBtn.classList.remove("hovered");

      this.hideVolumeSlider(100);
    },

    onVolumeSliderMouseenter(e) {
      const slider = document.querySelector(".volume-slider-container");
      if (!slider.classList.contains("hovered"))
        slider.classList.add("hovered");
    },

    onVolumeSliderMouseleave(e) {
      const slider = document.querySelector(".volume-slider-container");
      if (slider.classList.contains("hovered"))
        slider.classList.remove("hovered");

      this.onVolumeMouseleave();
    },

    onVolumeSliderMousedown(e) {
      this.volumeIsSliding = true;
      document.addEventListener("mousemove", this.slidingVolume);
      document.addEventListener("mouseup", this.stopSlidingVolume);
    },

    // onVolumeSliderMouseup(e) {
    // this.volumeIsSliding = false;
    // },

    slidingVolume(e) {
      const slider = document
        .querySelector(".volume-slider-clickable")
        .getBoundingClientRect();

      const ypos = (e.clientY - slider.bottom) * -1;

      let percentage = this.volumePercentageWithMousePos(ypos);

      if (percentage <= 0) {
        percentage = 0;
      } else if (percentage >= 100) {
        percentage = 100;
      }

      this.setVolumeWithPercentage(percentage);
    },

    stopSlidingVolume() {
      this.volumeIsSliding = false;
      document.removeEventListener("mousemove", this.slidingVolume);
      this.hideVolumeSlider(100);
    },

    hideVolumeSlider(delay) {
      const slider = document.querySelector(".volume-slider-container");
      const volumeBtn = document.querySelector(".icon-volume");
      setTimeout(() => {
        if (
          !slider.classList.contains("hovered") &&
          !volumeBtn.classList.contains("hovered")
        )
          slider.classList.add("hidden");
      }, delay);
    },

    volumePercentageWithMousePos(ypos) {
      return Math.round((ypos * 100) / this.volumeSliderHeight);
    },

    setVolumeWithPercentage(percentage) {
      // document.querySelector(".volume-slider-fill").style.height =
      //   percentage + "%";
      this.volumeSliderFillPercentage = percentage;

      //emit this:
      this.AP.volume = percentage / 100;
    },
  },
};
</script>

<style scoped lang="scss">
.volume-slider-wrapper {
  display: none;
}

@media (min-width: 700px) {
  $sliderHeight: 120px;
  $sliderOffset: 5px;

  .volume-slider-wrapper {
    // display: block;
    position: relative;
    cursor: pointer;
  }

  .volume-slider-container {
    height: $sliderHeight + 20px;
    background: white;
    position: absolute;
    width: 100%;
    top: $sliderOffset;
    left: 50%;
    transform: translate(-50%, -100%);
    border-top-left-radius: 30px;
    border-top-right-radius: 30px;
  }

  .volume-slider-container.hidden {
    visibility: hidden;
  }

  .volume-slider {
    height: $sliderHeight;
    width: 100%;
    position: absolute;
    bottom: 0;
  }

  .volume-slider-fill,
  .volume-slider-track {
    width: 10px;
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
  }

  .volume-slider-track {
    background: lightgray;
    height: 100%;
  }

  .volume-slider-fill {
    background: coral;
  }

  .volume-slider-dot {
    $size: 20px;
    height: $size;
    width: $size;
    background: #e74105;
    border-radius: 50%;
    position: absolute;
    transform: translate(-25%, -50%);
    transition: height 0.2s ease-out, width 0.2s ease-out;
  }

  .volume-slider-clickable {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background: transparent;
    width: 90%;
    height: 100%;
    cursor: pointer;
  }
}
</style>