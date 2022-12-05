<template>
  <div id="app">
    <Header :user="user" />
    <router-view />
    <Toast />
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import Header from "@/components/Header";
import Toast from "@/components/Toast.vue";

export default {
  name: "App",
  components: { Header, Toast },

  computed: {
    ...mapGetters({
      user: "auth/user",
    }),
  },

  created() {
    window.addEventListener("click", this.setFirstInteraction);
  },

  methods: {
    ...mapMutations({
      setPageFirstInteraction: "setPageFirstInteraction",
    }),

    setFirstInteraction() {
      this.setPageFirstInteraction(false);
      window.removeEventListener("click", this.setFirstInteraction);
    },
  },
};
</script>


<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
