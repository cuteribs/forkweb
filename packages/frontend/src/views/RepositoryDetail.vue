<template>
  <div class="flex-1 flex flex-col h-screen overflow-hidden">
    <!-- Top Bar -->
    <div class="bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center gap-3 flex-shrink-0">
      <button class="btn-ghost px-2 py-1" @click="$router.push({ name: 'repositories' })" title="Back">
        ←
      </button>
      <div class="flex-1 min-w-0">
        <h1 class="text-sm font-semibold truncate">{{ repo?.name }}</h1>
        <p class="text-sm text-muted truncate">{{ repo?.path }}</p>
      </div>
      <span class="badge badge-primary text-sm">{{ repo?.currentBranch }}</span>
      <button class="btn btn-ghost btn-sm" @click="refresh" title="Refresh">⟳</button>
    </div>

    <!-- Navigation Tabs -->
    <div class="bg-gray-800 border-b border-gray-700 px-3 flex gap-1 flex-shrink-0">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.label"
        :to="{ name: tab.route }"
        class="px-3 py-2 text-sm hover:bg-gray-700 border-b-2 transition-colors"
        :class="$route.name === tab.route ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-400'"
      >
        {{ tab.label }}
      </RouterLink>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-hidden">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useRepositoryStore } from '@/stores/repository';

const route = useRoute();
const repoStore = useRepositoryStore();

const tabs = [
  { label: 'Changes', route: 'repository-changes' },
  { label: 'Commits', route: 'repository-commits' },
  { label: 'Branches', route: 'repository-branches' },
  { label: 'Files', route: 'repository-files' },
];

const repo = computed(() => repoStore.currentRepository);

onMounted(async () => {
  const id = route.params.id as string;
  if (id) {
    // Ensure repositories are loaded
    if (repoStore.repositories.length === 0) {
      await repoStore.loadRepositories();
    }
    repoStore.setCurrentRepository(id);
  }
});

watch(
  () => route.params.id,
  async (id) => {
    if (id) {
      // Ensure repositories are loaded
      if (repoStore.repositories.length === 0) {
        await repoStore.loadRepositories();
      }
      repoStore.setCurrentRepository(id as string);
    }
  }
);

async function refresh() {
  if (repo.value) {
    await repoStore.refreshRepository(repo.value.id);
  }
}
</script>
