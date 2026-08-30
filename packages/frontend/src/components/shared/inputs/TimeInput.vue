<template>
  <div>
    <div v-if="loaded" class="time-input flex">
      <input v-model="hh" type="number" class="text-right" />:
      <input v-model="mm" type="number" class="text-center" />:
      <input v-model="ss" type="number" class="text-left" />
    </div>
  </div>
</template>

<script>
import { mapMutations } from "vuex";
import Helpers from "@/helpers/helper-functions";

export default {
  name: "TimeInput",

  props: {
    initialValue: { type: Number, default: 0 },
    maxValue: { type: Number, default: 0 },
  },
  data() {
    return {
      loaded: false,
      hh: 0,
      mm: 0,
      ss: 0,
    };
  },

  mounted() {
    console.log(this.initialValue);
    console.log(this.maxValue);
    const { hh, mm, ss } = this.computeHHMMSS(this.initialValue);
    this.hh = hh;
    this.mm = mm;
    this.ss = ss;

    console.log(this.hh, this.mm, this.ss);
    this.$nextTick(() => {
      this.loaded = true;
    });
  },
  methods: {
    computeHHMMSS: Helpers.toHHMMSSNoTrim,
  },
};
</script>

<style scoped lang="scss">
.time-input {
  background: white;
}
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}

input {
  background: transparent;
  max-width: 40px;
  padding: 0;
}

.text-right {
  text-align: right;
}
</style>