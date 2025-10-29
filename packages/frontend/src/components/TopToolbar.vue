<template>
  <div class="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-3">
    <!-- Action Buttons -->
    <div class="flex items-center gap-1">
      <button class="btn-ghost px-2 py-1" @click="$emit('clone')" title="Clone Repository">
        <span class="text-lg">⎘</span>
      </button>
      <button class="btn-ghost px-2 py-1" @click="$emit('fetch')" title="Fetch" :disabled="!hasRepo">
        <span class="text-lg">↓</span>
      </button>
      <button class="btn-ghost px-2 py-1" @click="$emit('pull')" title="Pull" :disabled="!hasRepo">
        <span class="text-lg">⇓</span>
      </button>
      <button class="btn-ghost px-2 py-1" @click="$emit('push')" title="Push" :disabled="!hasRepo">
        <span class="text-lg">⇑</span>
      </button>
      <button class="btn-ghost px-2 py-1" @click="$emit('stash')" title="Stash Changes" :disabled="!hasRepo">
        <span class="text-lg">📦</span>
      </button>
    </div>

    <!-- Divider -->
    <div class="h-6 w-px bg-gray-700"></div>

    <!-- Current Repo/Branch Info -->
    <div v-if="currentRepo" class="flex items-center gap-2 flex-1 min-w-0">
      <span class="text-sm font-semibold truncate">{{ currentRepo.name }}</span>
      <span class="text-muted">/</span>
      <span class="badge badge-primary">{{ currentRepo.currentBranch }}</span>
    </div>
    <div v-else class="flex-1 text-sm text-muted">
      No repository selected
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Repository } from '@forkweb/shared';

interface Props {
  currentRepo?: Repository | null;
}

const props = defineProps<Props>();

const hasRepo = computed(() => !!props.currentRepo);
</script>
