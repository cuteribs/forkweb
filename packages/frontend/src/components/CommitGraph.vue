<template>
  <svg :width="width" :height="height" class="commit-graph">
    <defs>
      <linearGradient id="GraphGradient">
        <stop offset="0" stop-color="white" />
        <stop offset="1" stop-color="black" />
      </linearGradient>
      <mask id="GraphMask">
        <rect :width="width" :height="height" fill="url(#GraphGradient)" />
      </mask>
    </defs>
    
    <g mask="url(#GraphMask)">
      <!-- Draw branch shadows and lines -->
      <g v-for="(branch, branchIndex) in branches" :key="`branch-${branchIndex}`">
        <path
          :d="branch.path"
          class="shadow"
          stroke="none"
          fill="none"
        />
        <path
          :d="branch.path"
          class="line"
          :stroke="branch.color"
          stroke-width="2"
          fill="none"
        />
      </g>
      
      <!-- Draw commit vertices on top -->
      <g v-for="vertex in vertices" :key="vertex.sha">
        <circle
          :cx="vertex.x"
          :cy="vertex.y"
          r="4"
          :fill="vertex.color"
          stroke="none"
        />
      </g>
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
  rowHeight: 36,
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

.commit-graph .shadow {
  stroke: rgba(0, 0, 0, 0.2);
  stroke-width: 3;
  stroke-linecap: round;
}

.commit-graph .line {
  stroke-linecap: round;
}
</style>
