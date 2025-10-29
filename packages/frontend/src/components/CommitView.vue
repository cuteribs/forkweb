<template>
  <div class="h-full flex flex-col">
    <!-- Top Section: Commit List with Graph -->
    <div class="flex-1 flex overflow-hidden border-b border-gray-700">
      <!-- Commit Graph -->
      <div class="overflow-y-auto bg-gray-900">
        <CommitGraph :commits="commits" :row-height="40" />
      </div>

      <!-- Commit List -->
      <div class="flex-1 overflow-y-auto">
        <div
          v-for="(commit, index) in commits"
          :key="commit.sha"
          @click="selectCommit(commit)"
          class="flex items-center gap-3 px-4 py-2 border-b border-gray-800 cursor-pointer hover:bg-gray-850 transition-colors"
          :class="{ 'bg-gray-850': selectedCommit?.sha === commit.sha }"
          style="height: 40px"
        >
          <!-- Branch/Tag Labels -->
          <div class="flex gap-1 min-w-[100px]">
            <span
              v-for="branch in commit.branches"
              :key="branch"
              class="badge text-xs px-1 py-0"
              :class="branch === currentBranch ? 'badge-primary' : 'bg-gray-700'"
            >
              {{ branch }}
            </span>
          </div>

          <!-- Commit Subject -->
          <div class="flex-1 truncate text-sm">{{ commit.message.split('\n')[0] }}</div>

          <!-- Author -->
          <div class="w-32 truncate text-sm text-muted">{{ commit.author.name }}</div>

          <!-- SHA -->
          <div class="font-mono text-sm text-muted">{{ commit.sha.substring(0, 7) }}</div>

          <!-- Timestamp -->
          <div class="w-24 text-sm text-muted">{{ formatDate(commit.date) }}</div>
        </div>

        <div v-if="hasMore" class="p-2 text-center">
          <button class="btn btn-ghost btn-sm" @click="$emit('load-more')">Load More</button>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Commit Details Tabs -->
    <div class="h-80 flex flex-col">
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
          <!-- File List -->
          <div class="w-80 border-r border-gray-700 overflow-y-auto">
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

          <!-- Diff Content -->
          <div class="flex-1 overflow-auto p-4 font-mono text-sm bg-gray-900">
            <pre v-if="selectedFileDiff" class="whitespace-pre-wrap">{{ selectedFileDiff }}</pre>
            <div v-else class="text-center text-muted">Select a file to view diff</div>
          </div>
        </div>

        <!-- Commit File Tree Tab -->
        <div v-if="activeTab === 'tree'" class="h-full flex">
          <!-- File Tree -->
          <div class="w-80 border-r border-gray-700 overflow-y-auto">
            <FileTreeNode
              v-for="node in fileTree"
              :key="node.path"
              :node="node"
              :selected-path="selectedTreeFile"
              @select="(e) => selectTreeFile(e.path)"
            />
          </div>

          <!-- File Content -->
          <div class="flex-1 overflow-auto p-4 font-mono text-sm bg-gray-900">
            <pre v-if="treeFileContent" class="whitespace-pre-wrap">{{ treeFileContent }}</pre>
            <div v-else class="text-center text-muted">Select a file to view content</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Commit, CommitFile, FileNode } from '@forkweb/shared';
import CommitGraph from '@/components/CommitGraph.vue';
import FileTreeNode from '@/components/FileTreeNode.vue';

interface Props {
  commits: Commit[];
  hasMore?: boolean;
  currentBranch?: string;
}

const props = withDefaults(defineProps<Props>(), {
  hasMore: false,
  currentBranch: '',
});

defineEmits<{
  'load-more': [];
  'commit-selected': [commit: Commit];
}>();

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

function selectCommit(commit: Commit) {
  selectedCommit.value = commit;
  activeTab.value = 'info';
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
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 7) {
    return date.toLocaleDateString();
  } else if (days > 0) {
    return `${days}d ago`;
  } else {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h ago`;
    const minutes = Math.floor(diff / (1000 * 60));
    return minutes > 0 ? `${minutes}m ago` : 'just now';
  }
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
