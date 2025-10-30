<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- Filters -->
    <div class="px-3 py-2 bg-gray-800 border-b border-gray-700 flex items-center gap-2 flex-shrink-0">
      <select v-model="selectedBranch" class="input text-sm flex-1" @change="() => loadCommits()">
        <option value="">All Branches</option>
        <option v-for="branch in branches" :key="branch.name" :value="branch.name">
          {{ branch.name }}
        </option>
      </select>
      <button class="btn-ghost px-2 py-1 text-sm" @click="() => loadCommits()" title="Refresh">⟳</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center text-muted text-sm">Loading commits...</div>
    </div>

    <!-- Empty State -->
    <div v-else-if="commits.length === 0" class="flex-1 flex items-center justify-center">
      <div class="text-center text-muted text-sm">No commits found</div>
    </div>

    <!-- Commit View -->
    <CommitView
      v-else
      :commits="commits"
      :has-more="hasMore"
      :current-branch="currentBranch"
      :head-sha="headSha"
      @load-more="loadMore"
      @commit-selected="onCommitSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import type { Commit, Branch } from '@forkweb/shared';
import { gitApi } from '@/api/git';
import CommitView from '@/components/CommitView.vue';
import { useRepositoryStore } from '@/stores/repository';

const route = useRoute();
const repoStore = useRepositoryStore();

const loading = ref(false);
const commits = ref<Commit[]>([]);
const branches = ref<Branch[]>([]);
const selectedBranch = ref('');
const currentPage = ref(0);
const pageSize = 50;
const hasMore = ref(true);
const headSha = ref<string>('');

const repoId = computed(() => route.params.id as string);
const currentRepo = computed(() => repoStore.currentRepository);
const currentBranch = computed(() => currentRepo.value?.currentBranch || '');

onMounted(async () => {
  await loadBranches();
  await loadCommits();
  // Find HEAD commit SHA
  findHeadSha();
});

async function loadBranches() {
  try {
    branches.value = await gitApi.listBranches(repoId.value);
  } catch (error) {
    console.error('Failed to load branches:', error);
  }
}

async function loadCommits(reset = true) {
  if (reset) {
    currentPage.value = 0;
    commits.value = [];
  }

  loading.value = true;
  try {
    const result = await gitApi.listCommits(repoId.value, {
      branch: selectedBranch.value || undefined,
      limit: pageSize,
      skip: currentPage.value * pageSize,
    });
    
    if (reset) {
      commits.value = result.items;
    } else {
      commits.value.push(...result.items);
    }
    
    hasMore.value = result.hasMore;
    
    // Find HEAD after loading commits
    if (reset) {
      findHeadSha();
    }
  } catch (error) {
    console.error('Failed to load commits:', error);
  } finally {
    loading.value = false;
  }
}

function findHeadSha() {
  // Find the commit that has the current branch in its branches array
  const currentBranchName = currentBranch.value;
  if (!currentBranchName || commits.value.length === 0) return;
  
  const headCommit = commits.value.find(commit => 
    commit.branches?.includes(currentBranchName)
  );
  
  if (headCommit) {
    headSha.value = headCommit.sha;
  } else if (commits.value.length > 0) {
    // Fallback to first commit if HEAD not found
    headSha.value = commits.value[0].sha;
  }
}

async function loadMore() {
  currentPage.value++;
  await loadCommits(false);
}

function onCommitSelected(commit: Commit) {
  console.log('Selected commit:', commit.sha);
}
</script>
