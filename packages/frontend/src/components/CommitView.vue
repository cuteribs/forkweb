<template>
  <div class="h-full flex flex-col">
    <!-- Top Section: Commit List with Graph + Bottom Section: Commit Details with Resizer -->
    <ResizablePanel direction="vertical" :default-size="250" :min-size="50" resize-target="second">
      <template #first>
        <!-- Top Section: Commit List with Graph -->
        <div class="h-full flex overflow-hidden">
          <!-- Commit Graph -->
          <div ref="graphContainer" class="overflow-y-auto bg-gray-900 scrollbar-hidden" @scroll="syncScroll('graph')">
            <CommitGraph :commits="commits" :row-height="28" />
          </div>

          <!-- Commit List -->
          <div ref="listContainer" class="flex-1 overflow-y-auto overflow-x-hidden border-l border-gray-700" @scroll="syncScroll('list')">
            <div>
              <div
                v-for="commit in commits"
                :key="commit.sha"
                @click="selectCommit(commit)"
                class="flex items-center gap-1.5 px-2.5 border-b border-gray-800 cursor-pointer hover:bg-gray-850 transition-colors"
                :class="{ 
                  'bg-gray-850': selectedCommit?.sha === commit.sha,
                  'opacity-70': isRemoteOnly(commit),
                  'font-bold': commit.sha === headSha
                }"
                style="height: 28px;"
              >
                <!-- Branch/Tag Labels + Commit Subject (flexible container) -->
                <div class="flex-1 flex items-center gap-1 min-w-0 overflow-hidden">
                  <!-- Branch/Tag Labels -->
                  <div class="flex gap-0.5 flex-shrink-0">
                    <span
                      v-for="branch in processBranches(commit.branches)"
                      :key="branch.name"
                      class="text-2xs px-1 py-0.5 rounded whitespace-nowrap leading-none inline-flex items-center gap-0.5"
                      :style="{ 
                        backgroundColor: getBranchColor(branch.name, commit),
                        color: '#FFFFFF',
                        border: `1px solid ${getBranchColor(branch.name, commit)}`
                      }"
                    >
                      <span v-if="branch.hasLocal && branch.hasRemote" class="opacity-80">⇅</span>
                      <span v-else-if="branch.hasRemote" class="opacity-80">↓</span>
                      {{ branch.displayName }}
                    </span>
                  </div>
                  
                  <!-- Commit Subject -->
                  <div class="flex-1 min-w-0 text-2xs truncate">{{ commit.message.split('\n')[0] }}</div>
                </div>

                <!-- SHA (fixed) -->
                <div style="width: 55px;" class="font-mono text-2xs text-muted flex-shrink-0">{{ commit.sha.substring(0, 7) }}</div>

                <!-- Author (fixed) -->
                <div style="width: 110px;" class="text-2xs text-muted flex-shrink-0 truncate">{{ commit.author.name }}</div>

                <!-- Timestamp (fixed) -->
                <div style="width: 110px;" class="text-2xs text-muted flex-shrink-0 text-right">{{ formatDate(commit.date) }}</div>
              </div>

              <div v-if="hasMore" class="p-2 text-center">
                <button class="btn btn-ghost btn-sm" @click="$emit('load-more')">Load More</button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #second>
        <!-- Bottom Section: Commit Details Tabs -->
        <div class="h-full flex flex-col">
          <!-- Tabs -->
          <div class="flex gap-1 px-3 py-2 bg-gray-850 border-b border-gray-700">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="px-3 py-1.5 rounded text-sm transition-colors"
              :class="activeTab === tab.id 
                ? 'bg-gray-900 text-gray-100' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Tab Content -->
          <div class="flex-1 overflow-hidden">
            <!-- Commit Info Tab -->
            <div v-if="activeTab === 'info'" class="h-full overflow-y-auto p-4 space-y-3">
              <div v-if="selectedCommit">
                <div class="space-y-2 text-sm">
                  <div class="flex gap-2">
                    <span class="text-muted w-24">Author:</span>
                    <span>{{ selectedCommit.author.name }} &lt;{{ selectedCommit.author.email }}&gt;</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-muted w-24">SHA:</span>
                    <span class="font-mono">{{ selectedCommit.sha }}</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-muted w-24">Date:</span>
                    <span>{{ new Date(selectedCommit.date).toLocaleString() }}</span>
                  </div>
                  <div v-if="selectedCommit.branches && selectedCommit.branches.length" class="flex gap-2">
                    <span class="text-muted w-24">Refs:</span>
                    <div class="flex gap-1 flex-wrap">
                      <span v-for="branch in selectedCommit.branches" :key="branch" class="badge badge-primary text-xs">
                        {{ branch }}
                      </span>
                    </div>
                  </div>
                  <div class="pt-3 border-t border-gray-700">
                    <pre class="whitespace-pre-wrap">{{ selectedCommit.message }}</pre>
                  </div>
                  <div v-if="commitStats" class="pt-3 border-t border-gray-700">
                    <div class="text-muted">Diff Stats:</div>
                    <div class="text-sm">
                      <span class="text-green-400">+{{ commitStats.additions }}</span>
                      <span class="text-muted mx-2">/</span>
                      <span class="text-red-400">-{{ commitStats.deletions }}</span>
                      <span class="text-muted ml-2">({{ commitStats.filesChanged }} files)</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-muted">
                Select a commit to view details
              </div>
            </div>

            <!-- Commit Changes Tab -->
            <div v-if="activeTab === 'changes'" class="h-full flex">
              <!-- File List + Diff Content with Resizer -->
              <ResizablePanel direction="horizontal" :default-size="320" :min-size="200" :max-size="600">
                <template #first>
                  <!-- File List -->
                  <div class="h-full border-r border-gray-700 overflow-y-auto">
                    <div
                      v-for="file in commitFiles"
                      :key="file.path"
                      @click="selectedFile = file.path"
                      class="px-3 py-2 border-b border-gray-800 cursor-pointer hover:bg-gray-850 transition-colors"
                      :class="{ 'bg-gray-850': selectedFile === file.path }"
                    >
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold" :class="fileStatusColor(file.status)">
                          {{ fileStatusChar(file.status) }}
                        </span>
                        <span class="text-sm truncate">{{ file.path }}</span>
                      </div>
                      <div class="text-xs text-muted mt-1">
                        <span class="text-green-400">+{{ file.additions || 0 }}</span>
                        <span class="mx-1">/</span>
                        <span class="text-red-400">-{{ file.deletions || 0 }}</span>
                      </div>
                    </div>
                  </div>
                </template>

                <template #second>
                  <!-- Diff Content -->
                  <div class="h-full overflow-auto p-4 font-mono text-sm bg-gray-900">
                    <pre v-if="selectedFileDiff" class="whitespace-pre-wrap">{{ selectedFileDiff }}</pre>
                    <div v-else class="text-center text-muted">Select a file to view diff</div>
                  </div>
                </template>
              </ResizablePanel>
            </div>

            <!-- Commit File Tree Tab -->
            <div v-if="activeTab === 'tree'" class="h-full flex">
              <!-- File Tree + File Content with Resizer -->
              <ResizablePanel direction="horizontal" :default-size="320" :min-size="200" :max-size="600">
                <template #first>
                  <!-- File Tree -->
                  <div class="h-full border-r border-gray-700 overflow-y-auto">
                    <FileTreeNode
                      v-for="node in fileTree"
                      :key="node.path"
                      :node="node"
                      :selected-path="selectedTreeFile"
                      @select="(e) => selectTreeFile(e.path)"
                    />
                  </div>
                </template>

                <template #second>
                  <!-- File Content -->
                  <div class="h-full overflow-auto p-4 font-mono text-sm bg-gray-900">
                    <pre v-if="treeFileContent" class="whitespace-pre-wrap">{{ treeFileContent }}</pre>
                    <div v-else class="text-center text-muted">Select a file to view content</div>
                  </div>
                </template>
              </ResizablePanel>
            </div>
          </div>
        </div>
      </template>
    </ResizablePanel>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Commit, CommitFile, FileNode } from '@forkweb/shared';
import CommitGraph from '@/components/CommitGraph.vue';
import FileTreeNode from '@/components/FileTreeNode.vue';
import ResizablePanel from '@/components/ResizablePanel.vue';
import { buildCommitGraph } from '@/utils/graph';
import { viewStateManager } from '@/utils/viewState';

interface Props {
  commits: Commit[];
  hasMore?: boolean;
  currentBranch?: string;
  headSha?: string;
}

const props = withDefaults(defineProps<Props>(), {
  hasMore: false,
  currentBranch: '',
  headSha: '',
});

const emit = defineEmits<{
  'load-more': [];
  'commit-selected': [commit: Commit];
}>();

const route = useRoute();
const router = useRouter();
const repoId = computed(() => route.params.id as string);

const graphContainer = ref<HTMLElement | null>(null);
const listContainer = ref<HTMLElement | null>(null);
let isScrolling = false;

// Build graph data to get commit colors
const graphData = computed(() => buildCommitGraph(props.commits, 28));
const commitColorMap = computed(() => {
  const map: Record<string, string> = {};
  graphData.value.vertices.forEach(vertex => {
    map[vertex.sha] = vertex.color;
  });
  return map;
});

const selectedCommit = ref<Commit | null>(null);
const activeTab = ref('info');
const commitStats = ref<any>(null);
const commitFiles = ref<CommitFile[]>([]);
const selectedFile = ref<string | null>(null);
const selectedFileDiff = ref<string>('');
const fileTree = ref<FileNode[]>([]);
const selectedTreeFile = ref<string | null>(null);
const treeFileContent = ref<string>('');

const tabs = [
  { id: 'info', label: 'Commit Info' },
  { id: 'changes', label: 'Changes' },
  { id: 'tree', label: 'File Tree' },
];

// Restore view state on mount
onMounted(() => {
  // Restore selected commit from URL query
  const queryCommitSha = route.query.commit as string;
  if (queryCommitSha) {
    const commit = props.commits.find(c => c.sha.startsWith(queryCommitSha));
    if (commit) {
      selectedCommit.value = commit;
    }
  }
  
  // Restore active tab from URL query
  const queryTab = route.query.tab as string;
  if (queryTab && tabs.some(t => t.id === queryTab)) {
    activeTab.value = queryTab;
  }
  
  // Restore scroll position from sessionStorage
  const savedScrollPosition = viewStateManager.getCommitScrollPosition(repoId.value);
  if (savedScrollPosition !== undefined && listContainer.value) {
    setTimeout(() => {
      if (listContainer.value) {
        listContainer.value.scrollTop = savedScrollPosition;
        if (graphContainer.value) {
          graphContainer.value.scrollTop = savedScrollPosition;
        }
      }
    }, 100);
  }
});

// Save scroll position periodically
let scrollSaveTimer: number | null = null;
function saveScrollPosition() {
  if (scrollSaveTimer) {
    clearTimeout(scrollSaveTimer);
  }
  scrollSaveTimer = window.setTimeout(() => {
    if (listContainer.value) {
      viewStateManager.setCommitScrollPosition(repoId.value, listContainer.value.scrollTop);
    }
  }, 500);
}

onBeforeUnmount(() => {
  if (scrollSaveTimer) {
    clearTimeout(scrollSaveTimer);
  }
});

// Process branches to merge local and remote
interface BranchDisplay {
  name: string;
  hasLocal: boolean;
  hasRemote: boolean;
  displayName: string;
}

function processBranches(branches: string[]): BranchDisplay[] {
  if (!branches || branches.length === 0) return [];
  
  const branchMap: Map<string, BranchDisplay> = new Map();
  
  branches.forEach(branch => {
    if (branch.startsWith('origin/')) {
      const localName = branch.substring(7); // Remove 'origin/'
      const existing = branchMap.get(localName);
      if (existing) {
        existing.hasRemote = true;
      } else {
        branchMap.set(localName, {
          name: localName,
          hasLocal: false,
          hasRemote: true,
          displayName: localName
        });
      }
    } else {
      const existing = branchMap.get(branch);
      if (existing) {
        existing.hasLocal = true;
      } else {
        branchMap.set(branch, {
          name: branch,
          hasLocal: true,
          hasRemote: false,
          displayName: branch
        });
      }
    }
  });
  
  return Array.from(branchMap.values());
}

// Get branch color from commit's graph vertex color
function getBranchColor(branchName: string, commit: Commit): string {
  // Use the commit's graph vertex color
  return commitColorMap.value[commit.sha] || '#888888';
}

// Check if commit only has remote branches (no local branches)
function isRemoteOnly(commit: Commit): boolean {
  if (!commit.branches || commit.branches.length === 0) {
    return false;
  }
  const processed = processBranches(commit.branches);
  return processed.every(b => !b.hasLocal && b.hasRemote);
}

// Sync scroll between graph and list
function syncScroll(source: 'graph' | 'list') {
  if (isScrolling) return;
  
  isScrolling = true;
  requestAnimationFrame(() => {
    if (source === 'list' && graphContainer.value && listContainer.value) {
      graphContainer.value.scrollTop = listContainer.value.scrollTop;
    } else if (source === 'graph' && graphContainer.value && listContainer.value) {
      listContainer.value.scrollTop = graphContainer.value.scrollTop;
    }
    isScrolling = false;
    
    // Save scroll position
    saveScrollPosition();
  });
}

// Watch for HEAD changes and auto-select
watch(() => props.headSha, (sha) => {
  if (sha && !selectedCommit.value) {
    const commit = props.commits.find(c => c.sha === sha);
    if (commit) {
      selectCommit(commit);
      scrollToCommit(sha);
    }
  }
}, { immediate: true });

// Watch for commits changes (initial load or refresh)
watch(() => props.commits, (newCommits) => {
  if (newCommits.length > 0 && !selectedCommit.value && props.headSha) {
    const commit = newCommits.find(c => c.sha === props.headSha);
    if (commit) {
      selectCommit(commit);
      scrollToCommit(props.headSha);
    }
  }
}, { immediate: true });

function scrollToCommit(sha: string) {
  const index = props.commits.findIndex(c => c.sha === sha);
  if (index >= 0 && listContainer.value) {
    const scrollTop = index * 28; // Row height
    listContainer.value.scrollTop = scrollTop;
    if (graphContainer.value) {
      graphContainer.value.scrollTop = scrollTop;
    }
  }
}

function selectCommit(commit: Commit) {
  selectedCommit.value = commit;
  activeTab.value = 'info';
  emit('commit-selected', commit);
  
  // Update URL with selected commit (use short SHA)
  const query = { ...route.query, commit: commit.sha.substring(0, 7) };
  router.replace({ query });
  
  // Load commit details (would call API here)
  loadCommitDetails(commit.sha);
}

async function loadCommitDetails(sha: string) {
  // TODO: Call API to load commit stats, files, etc.
  // Placeholder for now
  commitStats.value = {
    additions: 0,
    deletions: 0,
    filesChanged: 0,
  };
  commitFiles.value = [];
  fileTree.value = [];
}

// Watch and save active tab changes to URL
watch(activeTab, (newTab) => {
  if (newTab !== 'info') {
    const query = { ...route.query, tab: newTab };
    router.replace({ query });
  } else {
    // Remove tab from URL if it's the default
    const query = { ...route.query };
    delete query.tab;
    router.replace({ query });
  }
});

watch(selectedFile, async (filePath) => {
  if (filePath && selectedCommit.value) {
    // TODO: Load file diff
    selectedFileDiff.value = '';
  }
});

function selectTreeFile(path: string) {
  selectedTreeFile.value = path;
  if (selectedCommit.value) {
    // TODO: Load file content at commit
    treeFileContent.value = '';
  }
}

function formatDate(timestamp: Date): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function fileStatusChar(status: string): string {
  const map: Record<string, string> = {
    A: 'A', M: 'M', D: 'D', R: 'R', C: 'C',
  };
  return map[status] || '?';
}

function fileStatusColor(status: string): string {
  const map: Record<string, string> = {
    A: 'text-green-400',
    M: 'text-yellow-400',
    D: 'text-red-400',
    R: 'text-blue-400',
    C: 'text-blue-400',
  };
  return map[status] || 'text-gray-400';
}
</script>

<style scoped>
.scrollbar-hidden {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.scrollbar-hidden::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.text-2xs {
  font-size: 12px;
  line-height: 1.25;
}
</style>
