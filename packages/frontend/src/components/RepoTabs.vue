<template>
  <div class="h-10 bg-gray-850 border-b border-gray-700 flex items-center px-2 gap-1 overflow-x-auto">
    <button
      v-for="repo in pinnedRepos"
      :key="repo.id"
      @click="$emit('select', repo.id)"
      class="flex items-center gap-2 px-3 py-1.5 rounded-t text-sm transition-colors whitespace-nowrap"
      :class="repo.id === activeRepoId 
        ? 'bg-gray-900 text-gray-100 border-t-2 border-primary-500' 
        : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-750'"
    >
      <span class="truncate max-w-[150px]">{{ repo.name }}</span>
      <span
        @click.stop="$emit('unpin', repo.id)"
        class="hover:text-red-400 transition-colors cursor-pointer"
        title="Unpin"
      >
        ✕
      </span>
    </button>
    
    <button
      @click="$emit('add')"
      class="px-2 py-1.5 text-gray-400 hover:text-gray-200 transition-colors"
      title="Add Repository"
    >
      +
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Repository } from '@forkweb/shared';

interface Props {
  pinnedRepos: Repository[];
  activeRepoId?: string;
}

defineProps<Props>();
defineEmits<{
  select: [repoId: string];
  unpin: [repoId: string];
  add: [];
}>();
</script>
