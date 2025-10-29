<template>
  <div class="flex-1 flex flex-col">
    <!-- Header -->
    <div class="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
      <h1 class="text-lg font-semibold">Repositories</h1>
      <button class="btn btn-primary btn-sm" @click="showAddDialog = true">
        <span class="mr-1">+</span> Add Repository
      </button>
    </div>

    <!-- Repository List -->
    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="repoStore.loading" class="text-center py-8 text-muted">Loading...</div>

      <div v-else-if="repoStore.repositories.length === 0" class="text-center py-8">
        <p class="text-muted mb-4">No repositories added yet</p>
        <button class="btn btn-primary" @click="showAddDialog = true">Add Your First Repository</button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="repo in repoStore.repositories"
          :key="repo.id"
          class="card p-4 hover:bg-gray-750 cursor-pointer transition-colors"
          @click="openRepository(repo.id)"
        >
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-semibold truncate flex-1">{{ repo.name }}</h3>
            <button
              class="btn-ghost p-1 text-sm"
              @click.stop="removeRepo(repo.id)"
              title="Remove"
            >
              ✕
            </button>
          </div>
          <p class="text-sm text-muted truncate mb-2">{{ repo.path }}</p>
          <div class="flex items-center gap-2">
            <span class="badge badge-primary">{{ repo.currentBranch }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Repository Dialog -->
    <div
      v-if="showAddDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showAddDialog = false"
    >
      <div class="card p-6 w-full max-w-md mx-4" @click.stop>
        <h2 class="text-lg font-semibold mb-4">Add Repository</h2>
        <input
          v-model="newRepoPath"
          type="text"
          class="input w-full mb-4"
          placeholder="Enter repository path (e.g., C:/path/to/repo)"
          @keyup.enter="addRepo"
        />
        <div class="flex justify-end gap-2">
          <button class="btn btn-secondary" @click="showAddDialog = false">Cancel</button>
          <button class="btn btn-primary" @click="addRepo" :disabled="!newRepoPath.trim()">
            Add
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useRepositoryStore } from '@/stores/repository';

const router = useRouter();
const repoStore = useRepositoryStore();

const showAddDialog = ref(false);
const newRepoPath = ref('');

function openRepository(id: string) {
  repoStore.setCurrentRepository(id);
  router.push({ name: 'repository-detail', params: { id } });
}

async function addRepo() {
  if (!newRepoPath.value.trim()) return;
  
  try {
    const repo = await repoStore.addRepository(newRepoPath.value);
    newRepoPath.value = '';
    showAddDialog.value = false;
    openRepository(repo.id);
  } catch (error) {
    alert('Failed to add repository: ' + (error as Error).message);
  }
}

async function removeRepo(id: string) {
  if (confirm('Are you sure you want to remove this repository?')) {
    try {
      await repoStore.removeRepository(id);
    } catch (error) {
      alert('Failed to remove repository: ' + (error as Error).message);
    }
  }
}
</script>
