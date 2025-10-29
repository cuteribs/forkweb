<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="px-3 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
      <span class="text-sm font-semibold text-muted">BRANCHES</span>
      <button class="btn btn-primary btn-sm" @click="showNewBranchDialog = true">
        + New Branch
      </button>
    </div>

    <!-- Branch List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="p-4 text-center text-muted text-sm">Loading...</div>

      <div v-else-if="branches.length === 0" class="p-4 text-center text-muted text-sm">
        No branches found
      </div>

      <div v-else class="divide-y divide-gray-700">
        <div
          v-for="branch in sortedBranches"
          :key="branch.name"
          class="px-3 py-2 hover:bg-gray-800 transition-colors flex items-center justify-between"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span
                class="text-sm font-medium truncate"
                :class="branch.current ? 'text-primary-400' : ''"
              >
                {{ branch.name }}
              </span>
              <span v-if="branch.current" class="badge badge-primary text-sm">current</span>
              <span v-if="branch.type === 'remote'" class="badge text-sm bg-gray-700 text-gray-300">remote</span>
            </div>
            <p class="text-sm text-muted font-mono mt-0.5">{{ branch.commit?.substring(0, 7) }}</p>
          </div>
          <div class="flex gap-1">
            <button
              v-if="!branch.current"
              class="btn-ghost px-2 py-1 text-sm"
              @click="checkoutBranch(branch.name)"
              title="Checkout"
            >
              ↓
            </button>
            <button
              v-if="!branch.current && branch.type === 'local'"
              class="btn-ghost px-2 py-1 text-sm text-red-400"
              @click="deleteBranch(branch.name)"
              title="Delete"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- New Branch Dialog -->
    <div
      v-if="showNewBranchDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showNewBranchDialog = false"
    >
      <div class="card p-6 w-full max-w-md mx-4" @click.stop>
        <h2 class="text-lg font-semibold mb-4">Create New Branch</h2>
        
        <div class="space-y-3 mb-4">
          <div>
            <label class="block text-sm text-muted mb-1">Branch Name</label>
            <input
              v-model="newBranchName"
              type="text"
              class="input w-full"
              placeholder="feature/new-feature"
              @keyup.enter="createBranch"
            />
          </div>

          <div>
            <label class="block text-sm text-muted mb-1">Start Point</label>
            <select v-model="newBranchStartPoint" class="input w-full">
              <option value="">Current HEAD</option>
              <option v-for="branch in localBranches" :key="branch.name" :value="branch.name">
                {{ branch.name }}
              </option>
            </select>
          </div>

          <label class="flex items-center gap-2 text-sm">
            <input v-model="newBranchCheckout" type="checkbox" class="rounded" />
            <span>Checkout after creation</span>
          </label>
        </div>

        <div class="flex justify-end gap-2">
          <button class="btn btn-secondary" @click="showNewBranchDialog = false">Cancel</button>
          <button
            class="btn btn-primary"
            @click="createBranch"
            :disabled="!newBranchName.trim()"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import type { Branch } from '@forkweb/shared';
import { gitApi } from '@/api/git';
import { useRepositoryStore } from '@/stores/repository';

const route = useRoute();
const repoStore = useRepositoryStore();

const loading = ref(false);
const branches = ref<Branch[]>([]);
const showNewBranchDialog = ref(false);
const newBranchName = ref('');
const newBranchStartPoint = ref('');
const newBranchCheckout = ref(true);

const repoId = computed(() => route.params.id as string);

const localBranches = computed(() => branches.value.filter((b) => b.type === 'local'));

const sortedBranches = computed(() => {
  return [...branches.value].sort((a, b) => {
    if (a.current) return -1;
    if (b.current) return 1;
    if (a.type === 'remote' && b.type !== 'remote') return 1;
    if (a.type !== 'remote' && b.type === 'remote') return -1;
    return a.name.localeCompare(b.name);
  });
});

onMounted(() => {
  loadBranches();
});

async function loadBranches() {
  loading.value = true;
  try {
    branches.value = await gitApi.listBranches(repoId.value);
  } catch (error) {
    console.error('Failed to load branches:', error);
  } finally {
    loading.value = false;
  }
}

async function createBranch() {
  if (!newBranchName.value.trim()) return;

  try {
    await gitApi.createBranch(
      repoId.value,
      newBranchName.value,
      newBranchStartPoint.value || undefined,
      newBranchCheckout.value
    );

    newBranchName.value = '';
    newBranchStartPoint.value = '';
    newBranchCheckout.value = true;
    showNewBranchDialog.value = false;

    await loadBranches();
    if (newBranchCheckout.value) {
      await repoStore.refreshRepository(repoId.value);
    }
  } catch (error) {
    alert('Failed to create branch: ' + (error as Error).message);
  }
}

async function checkoutBranch(name: string) {
  try {
    await gitApi.checkout(repoId.value, name);
    await loadBranches();
    await repoStore.refreshRepository(repoId.value);
  } catch (error) {
    alert('Failed to checkout branch: ' + (error as Error).message);
  }
}

async function deleteBranch(name: string) {
  if (confirm(`Delete branch "${name}"?`)) {
    try {
      await gitApi.deleteBranch(repoId.value, name);
      await loadBranches();
    } catch (error) {
      alert('Failed to delete branch: ' + (error as Error).message);
    }
  }
}
</script>
