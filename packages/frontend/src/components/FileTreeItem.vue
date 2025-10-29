<template>
  <div
    class="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-850 transition-colors border-b border-gray-800"
    :class="{ 'bg-gray-850': selected }"
  >
    <span class="text-xs font-bold w-4" :class="statusColor">{{ statusChar }}</span>
    <span class="flex-1 text-sm truncate">{{ file.path }}</span>
    <button
      v-if="!staged"
      @click.stop="$emit('stage')"
      class="btn-ghost px-1.5 py-0.5 text-xs opacity-0 group-hover:opacity-100"
      title="Stage"
    >
      +
    </button>
    <button
      v-if="staged"
      @click.stop="$emit('unstage')"
      class="btn-ghost px-1.5 py-0.5 text-xs opacity-0 group-hover:opacity-100"
      title="Unstage"
    >
      −
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FileChange } from '@forkweb/shared';

interface Props {
  file: FileChange;
  selected?: boolean;
  staged?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  staged: false,
});

defineEmits<{
  stage: [];
  unstage: [];
}>();

const statusChar = computed(() => {
  const map: Record<string, string> = {
    modified: 'M',
    added: 'A',
    deleted: 'D',
    renamed: 'R',
    copied: 'C',
    untracked: '?',
  };
  return map[props.file.status] || '?';
});

const statusColor = computed(() => {
  const map: Record<string, string> = {
    modified: 'text-yellow-400',
    added: 'text-green-400',
    deleted: 'text-red-400',
    renamed: 'text-blue-400',
    copied: 'text-blue-400',
    untracked: 'text-gray-400',
  };
  return map[props.file.status] || 'text-gray-400';
});
</script>
