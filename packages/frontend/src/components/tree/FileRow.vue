<template>
  <div class="file-row" :class="`status-${status}`">
    <!-- left -->
    <div
      class="left color-text-dark p-0.5 pl-0 of-scroll"
      :class="{ active, 'is-last-seen': isLastSeen }"
    >
      <div class="flex items-center">
        <span v-if="status !== 'deleting' && status !== 'moving'"
          ><input
            type="checkbox"
            :checked="selected"
            @change="toggleFileSelected($event.target.checked)"
        /></span>
        <span
          class="flex-1 file-name"
          :class="{ completed: file.completed }"
          @click="openFile()"
        >
          <span v-if="file.completed" class="completed-icon"
            ><CheckIcon width="12"
          /></span>
          <span>{{ file.name }}</span>
          <span v-if="file.tags && file.tags.length" class="tags ml-1">
            <span v-for="tag in file.tags" :key="tag" class="tag-chip">{{
              tag
            }}</span>
          </span>
        </span>
      </div>
    </div>

    <!-- right -->
    <span
      v-if="status !== 'deleting' && status !== 'moving' && status !== null"
      class="right flex ml-2"
    >
      <span class="icon pointer mr-1" @click="openFileTagsMenu()">
        <TagIcon width="18" />
      </span>
      <span class="icon pointer mr-1" @click="openFileMoveMenu()">
        <FolderIcon width="20" />
      </span>
      <span class="icon pointer mr-1" @click="openFileShareMenu()">
        <ShareIcon width="18" />
      </span>
      <span class="icon pointer" @click="deleteFile()">
        <TrashCanIcon width="20" />
      </span>
    </span>
    <span v-else>{{ status }}</span>
  </div>
</template>

<script>
import FolderIcon from "@/components/shared/svg/FolderIcon";
import TrashCanIcon from "@/components/shared/svg/TrashCanIcon";
import TagIcon from "@/components/shared/svg/TagIcon";
import CheckIcon from "@/components/shared/svg/CheckIcon";
import ShareIcon from "@/components/shared/svg/ShareIcon";

export default {
  name: "FileRow",
  components: { FolderIcon, TrashCanIcon, TagIcon, CheckIcon, ShareIcon },
  props: ["file", "status", "active", "isLastSeen", "selected"],

  methods: {
    openFile() {
      if (!this.active && this.status !== "deleting") {
        this.$emit("openFile");
      }
    },

    openFileMoveMenu() {
      this.$emit("openFileMoveMenu", this.file);
    },

    openFileTagsMenu() {
      this.$emit("openFileTagsMenu", this.file);
    },

    openFileShareMenu() {
      this.$emit("openFileShareMenu", this.file);
    },

    deleteFile() {
      this.$emit("deleteFile");
    },

    toggleFileSelected(selected) {
      this.$emit("toggleFileSelected", selected);
    },
  },
};
</script>

<style lang="scss" scoped>
.tags {
  display: inline-flex;
  gap: 0.25rem;
}

.file-name.completed {
  opacity: 0.55;
}

.completed-icon {
  display: inline-flex;
  color: var(--color-3);
  margin-right: 0.35rem;
  vertical-align: middle;
}

.tag-chip {
  background-color: #333;
  color: #dfdfdf;
  border-radius: 999px;
  padding: 0.05rem 0.5rem;
  font-size: 0.75rem;
}

.file-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding: 0 1rem;
  &.status-deleting {
    background-color: #3c0000;
  }
  &.status-moving {
    background-color: #534325;
  }
}

.left {
  color: #dfdfdf;
  white-space: nowrap;
}

.left.active {
  color: var(--color-2);
  text-decoration: underline;
}

.left.active:hover {
  text-decoration: none;
}

.is-last-seen {
  color: var(--color-1);
}

input[type="checkbox"] {
  margin-right: 0.5em;
  width: 16px;
  height: 16px;
}

@media (min-width: 700px) {
  .file-row:hover {
    background-color: #0e0e0e;
  }

  .left {
    cursor: default;
    max-width: 95%;
    width: 95%;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .left:not(.active) {
    cursor: pointer;
  }

  .left:hover {
    text-decoration: underline;
  }

  .icon:hover {
    color: var(--color-2);
  }
}
</style>