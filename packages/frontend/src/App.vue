<template>
  <div id="app" class="h-screen flex flex-col overflow-hidden">
    <!-- Top Toolbar -->
    <TopToolbar
      :current-repo="currentRepo"
      @clone="handleClone"
      @fetch="handleFetch"
      @pull="handlePull"
      @push="handlePush"
      @stash="handleStash"
    />

    <!-- Repository Tabs -->
    <RepoTabs
      :pinned-repos="repositories"
      :active-repo-id="currentRepositoryId || undefined"
      @select="selectRepository"
      @unpin="removeRepository"
      @add="showAddDialog = true"
    />

    <!-- Main Content Area -->
    <div class="flex-1 flex overflow-hidden">
      <div v-if="currentRepositoryId" class="flex-1 flex overflow-hidden">
        <!-- Left Panel + Right Panel with Resizer -->
        <ResizablePanel direction="horizontal" :default-size="256" :min-size="200" :max-size="400">
          <template #first>
            <LeftPanel
              :selected-item="selectedItem"
              :selected-branch="selectedBranch"
              :changes-count="changesCount"
              :local-branches="localBranches"
              :remote-branches="remoteBranches"
              :remotes="remotes"
              :tags="tags"
              :stashes="stashes"
              :submodules="submodules"
              @select="handleSelectItem"
              @view-branch="handleViewBranch"
              @checkout-branch="handleCheckoutBranch"
            />
          </template>

          <template #second>
            <!-- Commit View -->
            <CommitView
              v-if="selectedItem === 'all-commits'"
              :commits="commits"
              :has-more="hasMoreCommits"
              :current-branch="currentRepo?.currentBranch"
              :selected-commit-sha="selectedCommitSha"
              @load-more="loadMoreCommits"
              @commit-selected="handleCommitSelected"
            />

            <!-- Change View -->
            <ChangeView
              v-else-if="selectedItem === 'local-changes'"
              :staged-files="stagedFiles"
              :unstaged-files="unstagedFiles"
              @stage="handleStage"
              @unstage="handleUnstage"
              @stage-all="handleStageAll"
              @unstage-all="handleUnstageAll"
              @commit="handleCommit"
            />
          </template>
        </ResizablePanel>
      </div>

      <!-- Empty State -->
      <div v-else class="flex-1 flex items-center justify-center text-muted">
        <div class="text-center">
          <p class="text-lg mb-4">No repository selected</p>
          <button class="btn btn-primary" @click="showAddDialog = true">
            Add Repository
          </button>
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
          placeholder="Repository path..."
          @keyup.enter="addRepository"
        />
        <div class="flex justify-end gap-2">
          <button class="btn btn-secondary" @click="showAddDialog = false">Cancel</button>
          <button class="btn btn-primary" @click="addRepository">Add</button>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="fixed bottom-4 right-4 z-50 space-y-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="card p-4 min-w-[300px] max-w-[500px] shadow-lg animate-slide-in"
        :class="{
          'border-l-4 border-red-500': toast.type === 'error',
          'border-l-4 border-green-500': toast.type === 'success',
          'border-l-4 border-blue-500': toast.type === 'info',
        }"
      >
        <div class="flex items-start gap-3">
          <Icon
            :icon="toast.type === 'error' ? 'codicon:error' : toast.type === 'success' ? 'codicon:check' : 'codicon:info'"
            class="text-lg flex-shrink-0 mt-0.5"
            :class="{
              'text-red-500': toast.type === 'error',
              'text-green-500': toast.type === 'success',
              'text-blue-500': toast.type === 'info',
            }"
          />
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm">{{ toast.title }}</div>
            <div v-if="toast.message" class="text-sm text-muted mt-1">{{ toast.message }}</div>
          </div>
          <button @click="removeToast(toast.id)" class="text-muted hover:text-gray-300">
            <Icon icon="codicon:close" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRepositoryStore } from '@/stores/repository';
import { useWebSocketStore } from '@/stores/websocket';
import { gitApi } from '@/api/git';
import type { Commit, FileChange, Branch } from '@forkweb/shared';
import { Icon } from '@iconify/vue';
import TopToolbar from '@/components/TopToolbar.vue';
import RepoTabs from '@/components/RepoTabs.vue';
import LeftPanel from '@/components/LeftPanel.vue';
import CommitView from '@/components/CommitView.vue';
import ChangeView from '@/components/ChangeView.vue';
import ResizablePanel from '@/components/ResizablePanel.vue';

const repoStore = useRepositoryStore();
const wsStore = useWebSocketStore();

const showAddDialog = ref(false);
const newRepoPath = ref('');
const selectedItem = ref('all-commits');

// Toast notifications
interface Toast {
  id: number;
  type: 'error' | 'success' | 'info';
  title: string;
  message?: string;
}
const toasts = ref<Toast[]>([]);
let toastIdCounter = 0;

function extractErrorMessage(error: any): string {
  // Check if it's an axios error with response data
  if (error.response?.data?.error) {
    const apiError = error.response.data.error;
    return apiError.message || apiError.code || 'Unknown error';
  }
  // Check if it's a regular Error object
  if (error.message) {
    return error.message;
  }
  // Fallback to string representation
  return String(error);
}

function showToast(type: Toast['type'], title: string, errorOrMessage?: string | any) {
  const id = ++toastIdCounter;
  const message = errorOrMessage ? extractErrorMessage(errorOrMessage) : undefined;
  toasts.value.push({ id, type, title, message });
  setTimeout(() => removeToast(id), 5000);
}

function removeToast(id: number) {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index >= 0) toasts.value.splice(index, 1);
}

// Repository data
const repositories = computed(() => repoStore.repositories);
const currentRepositoryId = computed(() => repoStore.currentRepositoryId);
const currentRepo = computed(() =>
  repositories.value.find((r) => r.id === currentRepositoryId.value)
);

// Commits data
const commits = ref<Commit[]>([]);
const hasMoreCommits = ref(false);
const currentPage = ref(0);
const selectedBranch = ref<string | undefined>(undefined);
const selectedCommitSha = ref<string | undefined>(undefined);

// Changes data
const stagedFiles = ref<FileChange[]>([]);
const unstagedFiles = ref<FileChange[]>([]);
const changesCount = computed(() => stagedFiles.value.length + unstagedFiles.value.length);

// Branch/Remote data
const localBranches = ref<Branch[]>([]);
const remoteBranches = ref<Branch[]>([]);
const remotes = ref<string[]>([]);
const tags = ref<string[]>([]);
const stashes = ref<string[]>([]);
const submodules = ref<string[]>([]);

onMounted(async () => {
  wsStore.connect();
  await repoStore.loadRepositories();
});

async function selectRepository(repoId: string) {
  repoStore.setCurrentRepository(repoId);
  // Load commits by default when selecting a repository
  selectedItem.value = 'all-commits';
  await loadRepositoryData();
  
  // After loading branches, select the current branch by default
  const currentBranch = localBranches.value.find(b => b.current);
  if (currentBranch) {
    selectedBranch.value = currentBranch.name;
    if (currentBranch.commit) {
      selectedCommitSha.value = currentBranch.commit;
    }
  }
}

async function loadRepositoryData() {
  if (!currentRepositoryId.value) return;

  // Load branches
  try {
    const branches = await gitApi.listBranches(currentRepositoryId.value);
    localBranches.value = branches.filter((b) => b.type === 'local');
    remoteBranches.value = branches.filter((b) => b.type === 'remote');
    remotes.value = [...new Set(branches.filter((b) => b.type === 'remote').map((b) => b.name.split('/')[0]))];
  } catch (error) {
    console.error('Failed to load branches:', error);
    showToast('error', 'Failed to load branches', error);
  }

  // Load tags
  try {
    const tagList = await gitApi.getTags(currentRepositoryId.value);
    tags.value = tagList.map(tag => tag.name);
  } catch (error) {
    console.error('Failed to load tags:', error);
    showToast('error', 'Failed to load tags', error);
  }

  // Load stashes
  try {
    const stashList = await gitApi.getStashes(currentRepositoryId.value);
    stashes.value = stashList.map(stash => stash.message);
  } catch (error) {
    console.error('Failed to load stashes:', error);
    showToast('error', 'Failed to load stashes', error);
  }

  // Load other data based on selected item
  if (selectedItem.value === 'all-commits') {
    await loadCommits();
  } else if (selectedItem.value === 'local-changes') {
    await loadChanges();
  }
}

async function handleSelectItem(item: string) {
  selectedItem.value = item;
  // When selecting "all-commits", keep the current branch selected (don't clear it)
  // This maintains the branch selection in the left panel
  await loadRepositoryData();
}

async function loadCommits(reset = true) {
  if (!currentRepositoryId.value) return;

  if (reset) {
    currentPage.value = 0;
    commits.value = [];
  }

  try {
    // Always load commits from all branches, never filter by branch
    const result = await gitApi.listCommits(currentRepositoryId.value, {
      limit: 1000,
      skip: currentPage.value * 1000,
    });
    
    if (reset) {
      commits.value = result.items;
    } else {
      commits.value.push(...result.items);
    }
    
    hasMoreCommits.value = result.hasMore;
  } catch (error) {
    console.error('Failed to load commits:', error);
  }
}

async function loadMoreCommits() {
  currentPage.value++;
  await loadCommits(false);
}

async function loadChanges() {
  if (!currentRepositoryId.value) return;

  try {
    const status = await gitApi.status(currentRepositoryId.value);
    stagedFiles.value = status.staged.map((f) => ({
      path: typeof f === 'string' ? f : f.path,
      status: (typeof f === 'string' ? 'modified' : f.status) as any,
      staged: true,
      workingDir: false,
    }));
    unstagedFiles.value = [
      ...status.unstaged.map((f) => ({
        path: typeof f === 'string' ? f : f.path,
        status: (typeof f === 'string' ? 'modified' : f.status) as any,
        staged: false,
        workingDir: true,
      })),
      ...status.untracked.map((f) => ({
        path: f,
        status: 'untracked' as any,
        staged: false,
        workingDir: true,
      })),
    ];
  } catch (error) {
    console.error('Failed to load changes:', error);
  }
}

async function addRepository() {
  if (!newRepoPath.value.trim()) return;

  try {
    await repoStore.addRepository(newRepoPath.value);
    newRepoPath.value = '';
    showAddDialog.value = false;
  } catch (error) {
    alert('Failed to add repository: ' + (error as Error).message);
  }
}

async function removeRepository(repoId: string) {
  if (confirm('Remove this repository?')) {
    await repoStore.removeRepository(repoId);
  }
}

async function handleViewBranch(branchName: string, type: 'local' | 'remote') {
  if (!currentRepositoryId.value) return;

  try {
    // Set the selected branch for UI highlighting
    selectedBranch.value = branchName;
    selectedItem.value = 'all-commits';
    
    // Load commits first (always from all branches)
    await loadCommits();
    
    // Then find and select the head commit of this branch to navigate to it
    const branch = type === 'local' 
      ? localBranches.value.find(b => b.name === branchName)
      : remoteBranches.value.find(b => b.name === branchName);
    
    if (branch?.commit) {
      selectedCommitSha.value = branch.commit;
    }
  } catch (error) {
    showToast('error', 'Failed to view branch', error);
  }
}

async function handleCheckoutBranch(branchName: string) {
  if (!currentRepositoryId.value) return;

  try {
    await gitApi.checkout(currentRepositoryId.value, branchName);
    await repoStore.refreshRepository(currentRepositoryId.value);
    await loadRepositoryData();
    showToast('success', 'Branch checked out', `Successfully checked out to ${branchName}`);
  } catch (error) {
    showToast('error', 'Failed to checkout branch', error);
  }
}

async function handleStage(path: string) {
  if (!currentRepositoryId.value) return;

  try {
    await gitApi.stage(currentRepositoryId.value, [path]);
    await loadChanges();
  } catch (error) {
    showToast('error', 'Failed to stage file', error);
  }
}

async function handleUnstage(path: string) {
  if (!currentRepositoryId.value) return;

  try {
    await gitApi.unstage(currentRepositoryId.value, [path]);
    await loadChanges();
  } catch (error) {
    showToast('error', 'Failed to unstage file', error);
  }
}

async function handleStageAll() {
  if (!currentRepositoryId.value) return;

  try {
    const files = unstagedFiles.value.map((f) => f.path);
    await gitApi.stage(currentRepositoryId.value, files);
    await loadChanges();
  } catch (error) {
    showToast('error', 'Failed to stage files', error);
  }
}

async function handleUnstageAll() {
  if (!currentRepositoryId.value) return;

  try {
    const files = stagedFiles.value.map((f) => f.path);
    await gitApi.unstage(currentRepositoryId.value, files);
    await loadChanges();
  } catch (error) {
    showToast('error', 'Failed to unstage files', error);
  }
}

async function handleCommit(message: string) {
  if (!currentRepositoryId.value) return;

  try {
    await gitApi.commit(currentRepositoryId.value, message);
    await loadChanges();
    await loadCommits();
    showToast('success', 'Commit created', 'Changes have been committed successfully');
  } catch (error) {
    showToast('error', 'Failed to commit', error);
  }
}

async function handleCommitSelected(commit: Commit) {
  selectedCommitSha.value = commit.sha;
}

// Toolbar actions
async function handleClone() {
  const url = prompt('Enter repository URL to clone:');
  if (url) {
    // TODO: Implement clone functionality
    alert('Clone functionality not yet implemented');
  }
}

async function handleFetch() {
  if (!currentRepositoryId.value) return;
  
  try {
    await gitApi.fetch(currentRepositoryId.value);
    showToast('success', 'Fetch completed', 'Remote changes have been fetched');
  } catch (error) {
    showToast('error', 'Failed to fetch', error);
  }
}

async function handlePull() {
  if (!currentRepositoryId.value) return;
  
  try {
    await gitApi.pull(currentRepositoryId.value);
    await loadRepositoryData();
    showToast('success', 'Pull completed', 'Changes have been pulled successfully');
  } catch (error) {
    showToast('error', 'Failed to pull', error);
  }
}

async function handlePush() {
  if (!currentRepositoryId.value) return;
  
  try {
    await gitApi.push(currentRepositoryId.value);
    showToast('success', 'Push completed', 'Changes have been pushed successfully');
  } catch (error) {
    showToast('error', 'Failed to push', error);
  }
}

async function handleStash() {
  if (!currentRepositoryId.value) return;
  
  // TODO: Implement stash functionality
  showToast('info', 'Not implemented', 'Stash functionality coming soon');
}
</script>

<style scoped>
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
</style>
