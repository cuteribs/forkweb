<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- Filters -->
    <div class="px-3 py-2 bg-gray-800 border-b border-gray-700 flex items-center gap-2">
      <select v-model="selectedBranch" class="input text-sm flex-1" @change="() => loadCommits()">
        <option value="">All Branches</option>
        <option v-for="branch in branches" :key="branch.name" :value="branch.name">
          {{ branch.name }}
        </option>
      </select>
      <button class="btn-ghost px-2 py-1 text-sm" @click="() => loadCommits()" title="Refresh">⟳</button>
    </div>

    <!-- Commit List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="p-4 text-center text-muted text-sm">Loading...</div>

      <div v-else-if="commits.length === 0" class="p-4 text-center text-muted text-sm">
        No commits found
      </div>

      <div v-else class="divide-y divide-gray-700">
        <div
          v-for="commit in commits"
          :key="commit.sha"
          class="px-3 py-2 hover:bg-gray-800 cursor-pointer transition-colors"
          @click="selectCommit(commit)"
        >
          <div class="flex items-start gap-2">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ commit.message.split('\n')[0] }}</p>
              <div class="flex items-center gap-2 mt-1 text-sm text-muted">
                <span class="truncate">{{ commit.author.name }}</span>
                <span>·</span>
                <span>{{ formatDate(new Date(commit.date).getTime()) }}</span>
                <span class="font-mono">{{ commit.sha.substring(0, 7) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMore && !loading" class="p-2 text-center">
        <button class="btn btn-ghost btn-sm" @click="loadMore">Load More</button>
      </div>
    </div>

    <!-- Commit Detail Modal -->
    <div
      v-if="selectedCommitDetail"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click="selectedCommitDetail = null"
    >
      <div class="card w-full max-w-4xl max-h-[90vh] flex flex-col" @click.stop>
        <div class="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <h3 class="font-semibold truncate">{{ selectedCommitDetail.message.split('\n')[0] }}</h3>
          <button class="btn-ghost px-2 py-1" @click="selectedCommitDetail = null">✕</button>
        </div>
        <div class="flex-1 overflow-auto p-4 text-sm">
          <div class="space-y-2 mb-4">
            <div><strong>SHA:</strong> <span class="font-mono">{{ selectedCommitDetail.sha }}</span></div>
            <div><strong>Author:</strong> {{ selectedCommitDetail.author.name }} &lt;{{ selectedCommitDetail.author.email }}&gt;</div>
            <div><strong>Date:</strong> {{ new Date(selectedCommitDetail.date).toLocaleString() }}</div>
          </div>
          <div class="border-t border-gray-700 pt-4">
            <pre class="text-sm whitespace-pre-wrap">{{ selectedCommitDetail.message }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import type { Commit, Branch } from '@forkweb/shared';
import { gitApi } from '@/api/git';

const route = useRoute();

const loading = ref(false);
const commits = ref<Commit[]>([]);
const branches = ref<Branch[]>([]);
const selectedBranch = ref('');
const selectedCommitDetail = ref<Commit | null>(null);
const currentPage = ref(0);
const pageSize = 50;
const hasMore = ref(true);

const repoId = computed(() => route.params.id as string);

onMounted(async () => {
  await loadBranches();
  await loadCommits();
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
  } catch (error) {
    console.error('Failed to load commits:', error);
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  currentPage.value++;
  await loadCommits(false);
}

async function selectCommit(commit: Commit) {
  try {
    selectedCommitDetail.value = await gitApi.getCommit(repoId.value, commit.sha);
  } catch (error) {
    console.error('Failed to load commit details:', error);
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString();
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'just now';
  }
}
</script>
