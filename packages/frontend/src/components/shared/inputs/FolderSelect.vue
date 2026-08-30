<template>
  <div class="folder-select">
    <label class="base-label"> {{ label }}</label>

    <div v-if="value" class="input" @click="toggleDropdown">
      <span> {{ value.name }} </span>
      <ChevronDownIcon width="20" />
    </div>
    <div v-if="showDropdown" class="dropdown">
      <div
        v-for="folder in folders"
        :key="folder.id"
        class="item"
        @click="selectFolder(folder)"
      >
        {{ folder.name }}
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import ChevronDownIcon from "@/components/shared/svg/ChevronDownIcon";

export default {
  name: "FolderSelect",
  components: { ChevronDownIcon },
  props: {
    value: { type: Object, default: null },
    label: { type: String, default: "Select a folder" },
  },

  computed: {
    ...mapGetters({
      folders: "tree/folders",
    }),
  },

  data() {
    return {
      showDropdown: false,
    };
  },

  mounted() {
    if (!this.value) {
      this.selectFolder(this.folders[0]);
    }
  },

  methods: {
    selectFolder(folder) {
      this.selectedFolder = folder;
      this.$emit("input", folder);
      this.closeDropdown();
    },

    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },
    closeDropdown() {
      this.showDropdown = false;
    },
  },
};
</script>

<style scoped lang="scss">
.folder-select {
  position: relative;
  color: var(--color-text);
}

.input {
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  background: #333;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.dropdown {
  position: absolute;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: #333;
  z-index: 11;
  max-height: 300px;
  overflow-y: auto;
  transform: translateY(4px);
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  .item {
    padding: 0.5rem 1rem;
    cursor: pointer;
    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }
  }
}
</style>