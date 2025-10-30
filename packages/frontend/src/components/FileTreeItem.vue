<template>
  <div
    class="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-850 transition-colors border-b border-gray-800"
    :class="{ 'bg-gray-850': selected }"
  >
    <Icon :icon="statusIcon" :class="statusColor" />
    <span class="flex-1 text-sm truncate">{{ file.path }}</span>
    <button
      v-if="!staged"
      @click.stop="$emit('stage')"
      class="btn-ghost px-1.5 py-0.5 text-xs opacity-0 group-hover:opacity-100"
      title="Stage"
    >
      <Icon icon="codicon:add" />
    </button>
    <button
      v-if="staged"
      @click.stop="$emit('unstage')"
      class="btn-ghost px-1.5 py-0.5 text-xs opacity-0 group-hover:opacity-100"
      title="Unstage"
    >
      <Icon icon="codicon:remove" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
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

const statusIcon = computed(() => {
  const map: Record<string, string> = {
    modified: 'codicon:diff-modified',
    added: 'codicon:diff-added',
    deleted: 'codicon:diff-removed',
    renamed: 'codicon:diff-renamed',
    copied: 'codicon:file',
    untracked: 'codicon:question',
  };
  return map[props.file.status] || 'codicon:file';
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
