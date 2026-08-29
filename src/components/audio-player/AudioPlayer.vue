<template>
  <div class="audio-player">
    <div class="audio-player-container">
      <!-- PROGRESS BAR -->
      <div class="progress select-none">
        <div
          class="progress-bar-buffered"
          :style="{ width: progressBarBufferedPercentage + '%' }"
        ></div>
        <div
          class="progress-bar-fill"
          :style="{ width: progressBarFillPercentage + '%' }"
        >
          <!-- Dot -->
          <div class="progress-bar-dot"></div>
        </div>

        <!-- Bookmarks -->
        <div v-if="!refreshingBookmarks" class="bookmarks">
          <div
            v-for="bookmark in bookmarks"
            :key="bookmark._id"
            :ref="'bm_' + bookmark._id"
            class="bookmark"
            :class="'bm_' + bookmark._id"
            @click="irAMarcador(bookmark)"
          ></div>
        </div>

        <!-- Vertical Mark -->
        <div class="progress-bar-vertical-mark hidden">
          <div class="progress-bar-vertical-mark-info">
            {{ timeAtHoverPoint }}
          </div>
        </div>

        <!-- Mouse Interface -->
        <div
          class="progress-bar-clickable focusable"
          tabindex="0"
          @mousedown="onProgressBarMousedown"
          @mousemove="onProgressBarMousemove"
          @mouseleave="onProgressBarMouseleave"
          @mouseover="onProgressBarMouseover"
        ></div>
      </div>

      <!-- Time Display -->
      <div class="time-display select-none pointer" @click="toggleCountType">
        <span class="countdown-countup">
          <span v-if="countType === 'COUNTUP'"> {{ timeElapsed }} </span>
          <span v-else> -{{ timeRemaining }} </span>
        </span>
        {{ totalDurationDisplay }}
      </div>

      <PlaybackRateSelect
        class="mb-1"
        :playback-rate="playbackRate"
        @resetPlaybackRate="resetPlaybackRate"
        @speedDown="speedDown"
        @speedUp="speedUp"
      />

      <!-- BUTTONS -->
      <div
        class="buttons-row flex items-center justify-around first focusable"
        tabindex="0"
      >
        <div class="buttons" :class="{ disabled: !loadedData }">
          <span
            class="icon control-icon focusable"
            :tabindex="loadedData ? '0' : '-1'"
            @click="selectPrevious"
          >
            <PreviousIcon />
          </span>

          <span
            class="icon control-icon relative focusable"
            :tabindex="loadedData ? '0' : '-1'"
            @click="rewind"
          >
            <RewindIcon />
            <span class="skip-text">{{ amountToSkip }}</span>
          </span>

          <!-- PLAY/PAUSE -->
          <div
            v-if="loadedData"
            class="control-icon play-pause focusable"
            :tabindex="loadedData ? '0' : '-1'"
            @click="togglePlayPause"
          >
            <PlayIcon v-if="status === 'PAUSED'" />
            <PauseIcon v-else />
          </div>
          <div v-else class="control-icon play-pause focusable">
            <PlayIcon />
          </div>

          <span
            class="icon control-icon relative focusable"
            :tabindex="loadedData ? '0' : '-1'"
            @click="forward"
          >
            <ForwardIcon />
            <span class="skip-text">{{ amountToSkip }}</span>
          </span>

          <span
            class="icon control-icon focusable"
            :tabindex="loadedData ? '0' : '-1'"
            @click="selectNext"
          >
            <NextIcon />
          </span>
        </div>
      </div>

      <!-- <VolumeSlider /> -->
    </div>

    <ModalBox
      v-if="pageFirstInteraction"
      titulo="Reanudar reproducción"
      @cerrarModal="resumePlayback(false)"
    >
      <div class="modal-content resume-modal">
        <p>
          Reanudando la reproducción de
          <span class="color-2">
            {{ fileName }}
          </span>
        </p>
        <button class="btn btn-primary" @click.prevent="resumePlayback(true)">
          Reanudar!
        </button>
        <button class="btn btn-cancel" @click.prevent="resumePlayback(false)">
          No reanudar
        </button>
      </div>
    </ModalBox>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import eventBus from "@/plugins/event-bus";
import Helpers from "@/helpers/helper-functions";
import PlaybackRateSelect from "@/components/audio-player/PlaybackRateSelect";
import ModalBox from "@/components/shared/modal/ModalBox";
import RewindIcon from "@/components/shared/svg/RewindIcon.vue";
import PlayIcon from "@/components/shared/svg/PlayIcon.vue";
import PauseIcon from "@/components/shared/svg/PauseIcon.vue";
import ForwardIcon from "@/components/shared/svg/ForwardIcon.vue";
import PreviousIcon from "@/components/shared/svg/PreviousIcon.vue";
import NextIcon from "@/components/shared/svg/NextIcon.vue";

export default {
  name: "AudioPlayer",
  components: {
    PlaybackRateSelect,
    ModalBox,
    PlayIcon,
    PauseIcon,
    RewindIcon,
    ForwardIcon,
    PreviousIcon,
    NextIcon,
  },

  props: ["audioUrl", "fileName", "fileType", "startAt", "bookmarks"],

  data() {
    return {
      AP: null,
      totalDuration: 0,
      timeElapsed: "0:00",
      timeRemaining: "0:00",
      totalDurationDisplay: "0:00",
      timeAtHoverPoint: "0:00",

      progressBarIsSliding: false,
      progressBarWidth: undefined,
      progressBarFillPercentage: 0,
      progressBarBufferedPercentage: 0,

      loadedData: false,
      volume: 1,
      playbackRate: 1,

      amountToSkip: 20,
      status: "PAUSED",
      refreshingBookmarks: false,
      countType: "COUNTUP",

      mostrarModal: false,

      timeUpdateCounter: 0,
      showNativePlayer: false,

      // showResumeModal: true,
      reanudarReproducción: false,
      clickTriggers: ["Enter", "Space"],
    };
  },

  computed: {
    ...mapGetters(["pageFirstInteraction", "avoidKeyListeners"]),
  },

  beforeUnmount() {
    document.removeEventListener("keyup", this.onKeyUp);
  },

  mounted() {
    document.addEventListener("keyup", this.onKeyUp);
    eventBus.$on("setCurrentTime", this.setCurrentTimeOnEvent);
  },

  methods: {
    ...mapMutations({
      setTotalDuration: "audioPlayer/setTotalDuration",
      setFlooredCurrentTime: "audioPlayer/setFlooredCurrentTime",
    }),

    init() {
      if (this.AP) {
        this.AP.pause();
      }
      this.AP = null;
      this.loadedData = false;
      this.playbackRate = 1;
      this.progressBarFillPercentage = 0;
      this.progressBarBufferedPercentage = 0;

      const audio = new Audio();
      audio.onerror = this.onError;
      audio.onplay = this.onPlay;
      audio.onpause = this.onPause;
      audio.onended = this.onEnded;
      audio.ontimeupdate = this.onTimeupdate;
      audio.onloadeddata = this.onLoadeddata;
      audio.ondurationchange = this.onDurationChange;
      audio.onprogress = this.onProgress;
      audio.type = this.fileType;
      audio.src = this.audioUrl;
      this.AP = audio;
    },

    resumePlayback(doResume) {
      this.reanudarReproducción = doResume;
      if (doResume) {
        this.$nextTick(() => {
          this.AP.play();
        });
      }
    },

    onKeyUp(e) {
      if (this.avoidKeyListeners) {
        return;
      }

      const code = e.code;
      if (this.clickTriggers.includes(code)) {
        if (document.activeElement.classList.contains("control-icon")) {
          document.activeElement.click();
        } else {
          this.togglePlayPause();
        }
      } else {
        switch (code) {
          case "ArrowLeft":
            this.rewind();
            break;
          case "ArrowRight":
            this.forward();
            break;
          case "ArrowUp":
            this.speedUp();
            break;
          case "ArrowDown":
            this.speedDown();
            break;
          default:
            console.log(code);
        }
      }
    },

    // Native audio methods

    onTimeupdate(e) {
      const fooredCurrentTime = Math.floor(e.target.currentTime);
      this.setFlooredCurrentTime(fooredCurrentTime);

      this.renderProgress();
      this.timeUpdateCounter++;
      if (this.timeUpdateCounter === 40) {
        this.timeUpdateCounter = 0;
        this.$emit("updateCurrentTime", fooredCurrentTime);
      }
    },

    onDurationChange(e) {
      const duration = e.target.duration;
      if (duration === Infinity) {
        console.log("  Infinity");
      }
      this.totalDuration = duration;
      this.setTotalDuration(duration);
    },

    onLoadeddata(e) {
      this.AP.currentTime = this.startAt;
      this.AP.playbackRate = this.playbackRate;
      this.loadedData = true;

      this.$nextTick(() => {
        this.initProgressBar();

        this.AP.addEventListener("progress", this.progress);
        this.AP.addEventListener("timeupdate", this.timeupdate);

        this.totalDurationDisplay = this.toHHMMSS(this.totalDuration);
        this.positionBookmarks();
        this.renderProgress();
        if (this.reanudarReproducción) {
          this.AP.play();
        }
      });
    },

    initProgressBar() {
      const progressBarUI = document.querySelector(".progress-bar-clickable");
      this.progressBarWidth = progressBarUI.getBoundingClientRect().width;

      progressBarUI.addEventListener("touchmove", this.onProgressBarMousemove, {
        passive: true,
      });

      progressBarUI.addEventListener(
        "touchstart",
        this.onProgressBarMousedown,
        { passive: false }
      );
    },

    onProgress(e) {
      if (this.progressBarIsSliding) return;
      const el = e.target;
      const bf = el.buffered;
      const duration = el.duration;

      for (let i = 0; i < bf.length; i++) {
        // console.log(bf.start(i));
        const percentage = (bf.end(i) * 100) / duration;
        this.progressBarBufferedPercentage = percentage;
      }
    },

    onPlay() {
      this.status = "PLAYING";
    },

    onPause(e, refreshCache = false) {
      this.status = "PAUSED";
      this.timeUpdateCounter = 0;
      if (this.AP.currentTime !== this.AP.duration)
        this.$emit("updateCurrentTime", {
          currentTime: Math.floor(this.AP.currentTime),
          refreshCache,
        });
    },

    onEnded(e) {
      let updateTime = Math.floor(e.target.currentTime) - this.amountToSkip;

      this.$emit(
        "updateCurrentTime",
        (() => (updateTime <= 0 ? 0 : updateTime))()
      );

      setTimeout(() => {
        this.selectNext();
      }, 2000);
    },

    async onError(e) {
      if (e.target.networkState === 3) {
        this.onPause(e, true);
      }
    },

    // Buttons

    speedUp() {
      if (this.playbackRate < 4) {
        this.playbackRate += 0.25;
        this.AP.playbackRate = this.playbackRate;
      }
    },
    speedDown() {
      if (this.playbackRate > 0.25) {
        this.playbackRate -= 0.25;
        this.AP.playbackRate = this.playbackRate;
      }
    },
    resetPlaybackRate() {
      this.playbackRate = 1;
      this.AP.playbackRate = this.playbackRate;
    },

    togglePlayPause() {
      if (this.status === "PAUSED") {
        this.AP.play();
      } else {
        this.AP.pause();
      }
    },

    selectPrevious() {
      this.AP.pause();
      if (this.AP.currentTime < 2) {
        this.$emit("verAnterior");
      } else {
        this.AP.currentTime = 0;
        this.AP.play();
      }
    },

    selectNext() {
      this.AP.pause();
      this.$emit("verSiguiente");
    },

    toggleCountType() {
      this.countType = this.countType === "COUNTDOWN" ? "COUNTUP" : "COUNTDOWN";
      if (this.countType === "COUNTDOWN") {
        this.renderCountdown();
      } else {
        this.renderCountUp();
      }
    },

    rewind() {
      if (this.AP.currentTime - this.amountToSkip <= 1) this.AP.currentTime = 0;
      else this.AP.currentTime -= this.amountToSkip;
    },

    forward() {
      if (this.AP.currentTime + this.amountToSkip >= this.AP.duration) return;
      this.AP.currentTime += this.amountToSkip;
    },

    // Progress Bar Handlers

    onProgressBarMouseover(e) {
      const verticalMark = document.querySelector(
        ".progress-bar-vertical-mark"
      );
      verticalMark.classList.remove("hidden");
    },

    onProgressBarMouseleave(e) {
      const verticalMark = document.querySelector(
        ".progress-bar-vertical-mark"
      );
      verticalMark.classList.add("hidden");
    },

    onProgressBarMousedown(e) {
      let offsetX = e.offsetX;
      this.progressBarIsSliding = true;

      if (offsetX) this.setCurrentTimeWithMousePos(offsetX);

      document.addEventListener("mousemove", this.slideProgressBar);
      document.addEventListener("touchmove", this.slideProgressBar);
      document.addEventListener("mouseup", this.stopSlideProgressBar);
    },

    // onProgressBarMouseup(e) {
    // this.progressBarIsSliding = false;
    // this.setCurrentTimeWithMousePos(e.offsetX);
    // },

    onProgressBarMousemove(e) {
      let clientX;
      if (e.touches) clientX = e.touches[0].clientX;
      else clientX = e.clientX;

      const xpos = clientX - e.target.getBoundingClientRect().left;

      this.timeAtHoverPoint = this.toHHMMSS(this.timeByMousePosition(xpos));

      this.positionVerticalMarkWithMousePos(xpos);
      // if (this.progressBarIsSliding) {
      //   this.setCurrentTimeWithMousePos(xpos);
      // }
    },

    slideProgressBar(e) {
      const slider = document
        .querySelector(".progress-bar-clickable")
        .getBoundingClientRect();

      let clientX;
      if (e.touches) clientX = e.touches[0].clientX;
      else clientX = e.clientX;

      const xpos = clientX - slider.left;
      this.setCurrentTimeWithMousePos(xpos);
    },

    stopSlideProgressBar(e) {
      this.progressBarIsSliding = false;
      document.removeEventListener("mousemove", this.slideProgressBar);
      document.removeEventListener("touchmove", this.slideProgressBar);
    },

    // Progress Bar Helpers

    setCurrentTimeWithMousePos(xpos) {
      this.AP.currentTime = this.timeByMousePosition(xpos);
      this.setProgressBarWithCurrentTime();
    },

    setProgressBarWithCurrentTime() {
      this.progressBarFillPercentage = Math.round(
        (this.AP.currentTime * 100) / this.totalDuration
      );
    },

    setCurrentTimeOnEvent(time) {
      this.AP.currentTime = time;
      this.setProgressBarWithCurrentTime();
    },

    timeByMousePosition(xpos) {
      const percentage = Math.round((xpos * 100) / this.progressBarWidth);
      return (this.AP.duration / 100) * percentage;
    },

    percentageByMousePos(xpos) {
      let percentage = Math.round((xpos * 100) / this.progressBarWidth);
      if (percentage <= 0) {
        percentage = 0;
      } else if (percentage >= 100) {
        percentage = 100;
      }
      return percentage;
    },

    positionVerticalMarkWithMousePos(xpos) {
      const percentage = this.percentageByMousePos(xpos);
      const verticalMark = document.querySelector(
        ".progress-bar-vertical-mark"
      );
      verticalMark.style.left = percentage + "%";
    },

    renderProgress() {
      this.setProgressBarWithCurrentTime();

      if (this.countType === "COUNTUP") {
        this.renderCountUp();
      } else {
        this.renderCountdown();
      }
    },
    renderCountUp() {
      this.timeElapsed = this.toHHMMSS(this.AP.currentTime);
    },
    renderCountdown() {
      let timeLeft = this.totalDuration - this.AP.currentTime;
      this.timeRemaining = this.toHHMMSS(timeLeft);
    },

    cerrarModal() {
      this.mostrarModal = false;
    },

    positionBookmarks() {
      this.bookmarks.forEach((bm, b) => {
        const ref = this.$refs[`${"bm_" + bm._id}`][0];
        ref.style.left = this.getBookmarkPercentage(bm.time);
      });
    },

    refreshBookmarks() {
      this.refreshingBookmarks = true;
      this.$nextTick(() => {
        this.refreshingBookmarks = false;
        this.$nextTick(() => {
          this.positionBookmarks();
        });
      });
    },

    getBookmarkPercentage(timestamp) {
      const percentage = Math.round((timestamp * 100) / this.AP.duration);
      return percentage + "%";
    },

    irAMarcador(bookmark) {
      this.AP.currentTime = bookmark.time;
      this.renderProgress();
    },

    toHHMMSS: Helpers.toHHMMSS,
  },
};
</script>

<style scoped lang="scss">
.audio-player {
  display: block;
}

.native-player-container {
  text-align: center;
  margin-bottom: 1em;
}

.toggle-native-player {
  text-align: center;
  span {
    display: inline-block;
    padding: 1em;
  }
}

.resume-modal {
  text-align: center;
  p {
    margin-bottom: 1em;
  }
  .btn {
    max-width: 400px;
    margin: 0 auto;
  }
  .btn-cancel {
    margin-top: 0.5em;
    padding: 0.5em 1em;
    border: 1px solid var(--color-2);
    font-size: 0.8rem;
  }
}

.buttons-row {
  padding: 0 0.5em;
  background: var(--color-controls);
  border-radius: 50px;
  color: black;
}

.buttons-row.focusable:focus {
  outline: 3px ridge white;
}

@media (min-width: 500px) {
  .buttons-row {
    justify-content: center;
    gap: 1em;
  }
}

// Progress bar

$progressHeight: 5px;

.progress {
  width: 95%;
  margin: 1em auto;
  background: white;
  position: relative;
  height: $progressHeight;
}

.progress-bar-buffered {
  position: absolute;
  background: rgb(170, 170, 170);
  height: 100%;
}

.progress-bar-fill {
  position: absolute;
  background: var(--color-progress-bar);
  height: 100%;
}

// Progress bar User Interface

$progressBarClickableHeight: 30px;
.progress-bar-clickable {
  top: 0;
  position: absolute;
  background: transparent;
  width: 100%;
  height: 100%;
  height: $progressBarClickableHeight;
  transform: translateY(-$progressBarClickableHeight / 2);
  box-shadow: 0 0 24px 3px #00000021;
  cursor: pointer;
}

.progress-bar-vertical-mark {
  position: relative;
  height: 15px;
  width: 5px;
  background: var(--color-2);
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
}

.progress-bar-vertical-mark.hidden {
  display: none;
}

.progress-bar-vertical-mark-info {
  position: absolute;
  padding: 1em 2em;
  top: -10px;
  left: 50%;
  transform: translate(-50%, -100%);
  background: rgba(0, 0, 0, 0.9);
}

$dotSize: 20px;

.progress-bar-dot {
  $size: $dotSize;
  height: $size;
  width: $size;
  position: relative;
  top: 50%;
  left: 100%;
  transform: translate(-50%, -50%);
  background: var(--color-1);
  position: absolute;
  border-radius: 50%;
}

// Progress Bar Bookmarks

.bookmarks {
  position: absolute;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  top: 0;
}

.bookmark {
  width: 6px;
  height: 5px;
  background: var(--color-1);
  transform: translate(-1px, 0);
  top: 0;
  z-index: 0;
  position: absolute;
  transition: height 100ms ease-out;
}

.bookmark.highlight {
  width: 8px;
  height: 17px;
  transform: translate(-1px, -33%);
}

// Time

.time-display {
  width: 95%;
  margin: 0 auto 1em;
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
}

@media (min-width: 350px) {
  .time-display {
    font-size: 1rem;
  }
  .time-display:hover {
    color: var(--color-1);
  }
}

.buttons {
  display: flex;
  align-items: center;
  gap: 0.5em;
  color: #f3f3f3;
  .control-icon {
    &:hover {
      color: var(--color-3);
    }
  }
  &.disabled .control-icon {
    cursor: default;
    color: #151515;
  }
}

.icon {
  cursor: pointer;
  padding: 0.8em;
}

.img-svg-icon {
  img {
    width: 25px;
  }
}

.play-pause {
  cursor: pointer;
  width: 34px;
}

.relative {
  position: relative;
}

.skip-text {
  position: absolute;
  top: 55%;
  left: 50%;
  font-size: 0.5rem;
  font-weight: bold;
  transform: translate(-50%, -50%);
}
</style>
