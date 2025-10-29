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
        <!-- Left Panel -->
        <LeftPanel
          :selected-item="selectedItem"
          :changes-count="changesCount"
          :local-branches="localBranches"
          :remotes="remotes"
          :tags="tags"
          :stashes="stashes"
          :submodules="submodules"
          @select="handleSelectItem"
          @checkout-branch="handleCheckoutBranch"
        />

        <!-- Right Panel -->
        <div class="flex-1 overflow-hidden">
          <!-- Commit View -->
          <CommitView
            v-if="selectedItem === 'all-commits'"
            :commits="commits"
            :has-more="hasMoreCommits"
            :current-branch="currentRepo?.currentBranch"
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
        </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRepositoryStore } from '@/stores/repository';
import { useWebSocketStore } from '@/stores/websocket';
import { gitApi } from '@/api/git';
import type { Commit, FileChange, Branch } from '@forkweb/shared';
import TopToolbar from '@/components/TopToolbar.vue';
import RepoTabs from '@/components/RepoTabs.vue';
import LeftPanel from '@/components/LeftPanel.vue';
import CommitView from '@/components/CommitView.vue';
import ChangeView from '@/components/ChangeView.vue';

const repoStore = useRepositoryStore();
const wsStore = useWebSocketStore();

const showAddDialog = ref(false);
const newRepoPath = ref('');
const selectedItem = ref('local-changes');

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

// Changes data
const stagedFiles = ref<FileChange[]>([]);
const unstagedFiles = ref<FileChange[]>([]);
const changesCount = computed(() => stagedFiles.value.length + unstagedFiles.value.length);

// Branch/Remote data
const localBranches = ref<Branch[]>([]);
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
  await loadRepositoryData();
}

async function loadRepositoryData() {
  if (!currentRepositoryId.value) return;

  // Load branches
  try {
    const branches = await gitApi.listBranches(currentRepositoryId.value);
    localBranches.value = branches.filter((b) => b.type === 'local');
    remotes.value = [...new Set(branches.filter((b) => b.type === 'remote').map((b) => b.name.split('/')[0]))];
  } catch (error) {
    console.error('Failed to load branches:', error);
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
  await loadRepositoryData();
}

async function loadCommits(reset = true) {
  if (!currentRepositoryId.value) return;

  if (reset) {
    currentPage.value = 0;
    commits.value = [];
  }

  try {
    const result = await gitApi.listCommits(currentRepositoryId.value, {
      limit: 50,
      skip: currentPage.value * 50,
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

async function handleCheckoutBranch(branchName: string) {
  if (!currentRepositoryId.value) return;

  try {
    await gitApi.checkout(currentRepositoryId.value, branchName);
    await repoStore.refreshRepository(currentRepositoryId.value);
    await loadRepositoryData();
  } catch (error) {
    alert('Failed to checkout branch: ' + (error as Error).message);
  }
}

async function handleStage(path: string) {
  if (!currentRepositoryId.value) return;

  try {
    await gitApi.stage(currentRepositoryId.value, [path]);
    await loadChanges();
  } catch (error) {
    alert('Failed to stage file: ' + (error as Error).message);
  }
}

async function handleUnstage(path: string) {
  if (!currentRepositoryId.value) return;

  try {
    await gitApi.unstage(currentRepositoryId.value, [path]);
    await loadChanges();
  } catch (error) {
    alert('Failed to unstage file: ' + (error as Error).message);
  }
}

async function handleStageAll() {
  if (!currentRepositoryId.value) return;

  try {
    const files = unstagedFiles.value.map((f) => f.path);
    await gitApi.stage(currentRepositoryId.value, files);
    await loadChanges();
  } catch (error) {
    alert('Failed to stage files: ' + (error as Error).message);
  }
}

async function handleUnstageAll() {
  if (!currentRepositoryId.value) return;

  try {
    const files = stagedFiles.value.map((f) => f.path);
    await gitApi.unstage(currentRepositoryId.value, files);
    await loadChanges();
  } catch (error) {
    alert('Failed to unstage files: ' + (error as Error).message);
  }
}

async function handleCommit(message: string) {
  if (!currentRepositoryId.value) return;

  try {
    await gitApi.commit(currentRepositoryId.value, message);
    await loadChanges();
    await loadCommits();
  } catch (error) {
    alert('Failed to commit: ' + (error as Error).message);
  }
}

async function handleCommitSelected(commit: Commit) {
  console.log('Selected commit:', commit);
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
    alert('Fetch completed');
  } catch (error) {
    alert('Failed to fetch: ' + (error as Error).message);
  }
}

async function handlePull() {
  if (!currentRepositoryId.value) return;
  
  try {
    await gitApi.pull(currentRepositoryId.value);
    await loadRepositoryData();
    alert('Pull completed');
  } catch (error) {
    alert('Failed to pull: ' + (error as Error).message);
  }
}

async function handlePush() {
  if (!currentRepositoryId.value) return;
  
  try {
    await gitApi.push(currentRepositoryId.value);
    alert('Push completed');
  } catch (error) {
    alert('Failed to push: ' + (error as Error).message);
  }
}

async function handleStash() {
  if (!currentRepositoryId.value) return;
  
  // TODO: Implement stash functionality
  alert('Stash functionality not yet implemented');
}
</script>
