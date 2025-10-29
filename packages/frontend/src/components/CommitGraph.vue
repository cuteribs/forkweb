<template>
  <svg :width="width" :height="height" class="commit-graph">
    <!-- Simple commit graph visualization -->
    <g v-for="(commit, index) in commits" :key="commit.sha">
      <!-- Vertical line -->
      <line
        v-if="index < commits.length - 1"
        :x1="20"
        :y1="index * rowHeight + rowHeight / 2"
        :x2="20"
        :y2="(index + 1) * rowHeight + rowHeight / 2"
        stroke="currentColor"
        stroke-width="2"
        class="text-primary-500"
      />
      <!-- Commit dot -->
      <circle
        :cx="20"
        :cy="index * rowHeight + rowHeight / 2"
        r="4"
        fill="currentColor"
        class="text-primary-400"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Commit } from '@forkweb/shared';

interface Props {
  commits: Commit[];
  rowHeight?: number;
}

const props = withDefaults(defineProps<Props>(), {
  rowHeight: 40,
});

const width = 40;
const height = computed(() => props.commits.length * props.rowHeight);
</script>

<style scoped>
.commit-graph {
  flex-shrink: 0;
}
</style>
