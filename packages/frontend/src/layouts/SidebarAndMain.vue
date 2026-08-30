<template>
  <div class="sidebar-and-main">
    <div class="sidebar-and-main-inner">
      <!-- Sidebar -->
      <div class="sidebar-container" :class="{ visible: sidebarVisible }">
        <div class="sidebar-toggler toggle pointer" @click="toggleSidebar">
          <span v-if="!sidebarVisible"><FolderTreeIcon width="32" /></span>
        </div>
        <aside class="sidebar-content">
          <slot name="sidebar" />
        </aside>
      </div>
      <!-- Main -->
      <div
        class="main-container"
        :class="{ 'avoid-overflow-mobile': sidebarVisible }"
      >
        <div
          class="main-backdrop"
          :class="{ visible: sidebarVisible }"
          @click="toggleSidebar"
        ></div>
        <main class="main-content">
          <slot name="main" />
        </main>
      </div>
    </div>
  </div>
</template>

<script>
import FolderTreeIcon from "@/components/shared/svg/FolderTreeIcon";
export default {
  name: "SidebarAndMain",
  components: { FolderTreeIcon },
  data() {
    return {
      sidebarVisible: false,
    };
  },

  methods: {
    toggleSidebar() {
      this.sidebarVisible = !this.sidebarVisible;
    },
  },
};
</script>

<style lang="scss" scoped>
.sidebar-and-main-inner {
  display: flex;
  justify-content: space-between;
}

.sidebar-container {
  position: absolute;
  z-index: 15;
  width: 95%;
  transition: width 250ms ease-out;
  &:not(.visible) {
    width: 0;
    .sidebar-toggler {
      position: absolute;
      top: 0;
      right: 0;
      transform: translateX(100%);
      padding: 0.5rem;
      background: var(--color-3);
    }
  }
}

.sidebar-content {
  overflow-x: hidden;
  white-space: nowrap;
  height: calc(100vh - var(--header-height));
  overflow-y: hidden;
  background: #020202;
}

.main-container {
  width: 100%;
  position: relative;
}

.main-content {
  padding: 0 0.5rem;
}

.main-backdrop {
  display: none;
  background: rgba(0, 0, 0, 0.8);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
}

.main-backdrop.visible {
  display: block;
}

.avoid-overflow-mobile {
  overflow-y: hidden;
  max-height: calc(100vh - var(--header-height));
}

@media (min-width: 700px) {
  .sidebar-container {
    position: relative;
    width: auto;
    max-width: 50%;
    &:not(.visible) {
      width: auto;
    }
  }

  .sidebar-container .sidebar-toggler {
    display: none;
  }

  .main-backdrop {
    display: block;
    z-index: -10;
    opacity: 0;
    transition: opacity 0.2s ease-out;
  }

  .main-backdrop.visible {
    opacity: 1;
    z-index: 10;
  }

  .avoid-overflow-mobile {
    overflow-y: auto;
    max-height: unset;
  }
}
</style>