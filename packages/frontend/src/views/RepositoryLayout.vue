<template>
  <div class="h-screen flex overflow-hidden">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRepositoryStore } from '@/stores/repository';

const repoStore = useRepositoryStore();

// Load repositories on mount
onMounted(async () => {
  if (repoStore.repositories.length === 0) {
    await repoStore.loadRepositories();
  }
});
</script>
