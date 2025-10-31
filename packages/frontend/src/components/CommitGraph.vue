<template>
  <svg :width="width" :height="height" class="commit-graph">
    <!-- Draw branch lines -->
    <g v-for="(branch, branchIndex) in branches" :key="`branch-${branchIndex}`">
      <path
        :d="branch.path"
        :stroke="branch.color"
        stroke-width="1"
        fill="none"
        stroke-linecap="round"
      />
    </g>
    
    <!-- Draw commit vertices on top -->
    <g v-for="vertex in vertices" :key="vertex.sha">
      <circle
        :cx="vertex.x"
        :cy="vertex.y"
        r="2"
        :fill="vertex.color"
        :stroke="vertex.color"
        stroke-width="1"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Commit } from '@forkweb/shared';
import { buildCommitGraph } from '@/utils/graph';

interface Props {
  commits: Commit[];
  rowHeight?: number;
}

const props = withDefaults(defineProps<Props>(), {
  rowHeight: 28,
});

const graphData = computed(() => {
  return buildCommitGraph(props.commits, props.rowHeight);
});

const vertices = computed(() => graphData.value.vertices);
const branches = computed(() => graphData.value.branches);
const width = computed(() => graphData.value.width);
const height = computed(() => graphData.value.height);
</script>

<style scoped>
.commit-graph {
  flex-shrink: 0;
}
</style>
