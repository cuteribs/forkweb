<template>
  <div class="h-full flex">
    <!-- Left: File List -->
    <div class="w-80 border-r border-gray-700 flex flex-col overflow-hidden">
      <div class="px-3 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <span class="text-sm font-semibold text-muted">CHANGES</span>
        <button class="btn-ghost px-2 py-1 text-sm" @click="loadStatus" title="Refresh">⟳</button>
      </div>

      <div class="flex-1 overflow-y-auto text-sm">
        <div v-if="loading" class="p-4 text-center text-muted text-sm">Loading...</div>

        <div v-else-if="!status" class="p-4 text-center text-muted text-sm">
          No status available
        </div>

        <div v-else>
          <!-- Staged Changes -->
          <div v-if="status.staged.length > 0">
            <div class="px-3 py-1.5 bg-gray-800 text-sm font-semibold text-green-400 flex items-center justify-between">
              <span>Staged ({{ status.staged.length }})</span>
              <button class="btn-ghost px-1 text-sm" @click="unstageAll" title="Unstage All">−</button>
            </div>
            <div
              v-for="file in status.staged"
              :key="'staged-' + file.path"
              class="px-3 py-1.5 hover:bg-gray-800 cursor-pointer flex items-center gap-2"
              :class="{ 'bg-gray-800': selectedFile === file.path }"
              @click="selectFile(file.path, true)"
            >
              <span
                class="text-sm font-bold w-4 flex-shrink-0"
                :class="statusColor(file.status)"
              >
                {{ statusChar(file.status) }}
              </span>
              <span class="truncate flex-1 text-sm">{{ file.path }}</span>
            </div>
          </div>

          <!-- Unstaged Changes -->
          <div v-if="status.unstaged.length > 0">
            <div class="px-3 py-1.5 bg-gray-800 text-sm font-semibold text-yellow-400 flex items-center justify-between">
              <span>Unstaged ({{ status.unstaged.length }})</span>
              <button class="btn-ghost px-1 text-sm" @click="stageAll" title="Stage All">+</button>
            </div>
            <div
              v-for="file in status.unstaged"
              :key="'unstaged-' + file.path"
              class="px-3 py-1.5 hover:bg-gray-800 cursor-pointer flex items-center gap-2"
              :class="{ 'bg-gray-800': selectedFile === file.path }"
              @click="selectFile(file.path, false)"
            >
              <span
                class="text-sm font-bold w-4 flex-shrink-0"
                :class="statusColor(file.status)"
              >
                {{ statusChar(file.status) }}
              </span>
              <span class="truncate flex-1 text-sm">{{ file.path }}</span>
            </div>
          </div>

          <!-- Untracked Files -->
          <div v-if="status.untracked.length > 0">
            <div class="px-3 py-1.5 bg-gray-800 text-sm font-semibold text-gray-400">
              Untracked ({{ status.untracked.length }})
            </div>
            <div
              v-for="file in status.untracked"
              :key="'untracked-' + file"
              class="px-3 py-1.5 hover:bg-gray-800 cursor-pointer flex items-center gap-2"
              :class="{ 'bg-gray-800': selectedFile === file }"
              @click="selectFile(file, false)"
            >
              <span class="text-sm font-bold w-4 text-gray-400 flex-shrink-0">?</span>
              <span class="truncate flex-1 text-sm">{{ file }}</span>
            </div>
          </div>

          <div v-if="status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0">
            <div class="p-4 text-center text-muted text-sm">No changes</div>
          </div>
        </div>
      </div>

      <!-- Commit Section -->
      <div v-if="status && status.staged.length > 0" class="border-t border-gray-700 p-3 space-y-2">
        <textarea
          v-model="commitMessage"
          class="input w-full text-sm"
          rows="3"
          placeholder="Commit message..."
        />
        <button
          class="btn btn-primary w-full btn-sm"
          @click="commit"
          :disabled="!commitMessage.trim()"
        >
          Commit
        </button>
      </div>
    </div>

    <!-- Right: Diff View -->
    <div class="flex-1 flex flex-col overflow-hidden bg-gray-900">
      <div class="px-3 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <span class="text-sm font-semibold">{{ selectedFile || 'Select a file to view changes' }}</span>
        <div v-if="selectedFile" class="flex gap-1">
          <button
            v-if="!isStaged"
            class="btn-ghost px-2 py-1 text-sm"
            @click="stageFile"
            title="Stage"
          >
            +
          </button>
          <button
            v-if="isStaged"
            class="btn-ghost px-2 py-1 text-sm"
            @click="unstageFile"
            title="Unstage"
          >
            −
          </button>
          <button
            v-if="!isStaged"
            class="btn-ghost px-2 py-1 text-sm text-red-400"
            @click="discardFile"
            title="Discard"
          >
            ✕
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto p-4 font-mono text-sm">
        <div v-if="diffLoading" class="text-center text-muted">Loading diff...</div>
        <pre v-else-if="diff" class="text-sm">{{ diff }}</pre>
        <div v-else class="text-center text-muted">Select a file to view changes</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import type { GitStatus } from '@forkweb/shared';
import { gitApi } from '@/api/git';

const route = useRoute();

const loading = ref(false);
const status = ref<GitStatus | null>(null);
const selectedFile = ref<string | null>(null);
const isStaged = ref(false);
const diff = ref<string>('');
const diffLoading = ref(false);
const commitMessage = ref('');

const repoId = computed(() => route.params.id as string);

onMounted(() => {
  loadStatus();
});

async function loadStatus() {
  if (!repoId.value) return;
  loading.value = true;
  try {
    status.value = await gitApi.status(repoId.value);
  } catch (error) {
    console.error('Failed to load status:', error);
  } finally {
    loading.value = false;
  }
}

async function selectFile(path: string, staged: boolean) {
  selectedFile.value = path;
  isStaged.value = staged;
  diffLoading.value = true;
  try {
    diff.value = await gitApi.diff(repoId.value, { path, staged });
  } catch (error) {
    console.error('Failed to load diff:', error);
    diff.value = '';
  } finally {
    diffLoading.value = false;
  }
}

async function stageFile() {
  if (!selectedFile.value) return;
  try {
    await gitApi.stage(repoId.value, [selectedFile.value]);
    await loadStatus();
    selectFile(selectedFile.value, true);
  } catch (error) {
    alert('Failed to stage file');
  }
}

async function unstageFile() {
  if (!selectedFile.value) return;
  try {
    await gitApi.unstage(repoId.value, [selectedFile.value]);
    await loadStatus();
    selectFile(selectedFile.value, false);
  } catch (error) {
    alert('Failed to unstage file');
  }
}

async function discardFile() {
  if (!selectedFile.value) return;
  if (confirm(`Discard changes in ${selectedFile.value}?`)) {
    try {
      await gitApi.discard(repoId.value, [selectedFile.value]);
      await loadStatus();
      selectedFile.value = null;
      diff.value = '';
    } catch (error) {
      alert('Failed to discard changes');
    }
  }
}

async function stageAll() {
  if (!status.value) return;
  const files = [
    ...status.value.unstaged.map(f => typeof f === 'string' ? f : f.path),
    ...status.value.untracked
  ];
  try {
    await gitApi.stage(repoId.value, files);
    await loadStatus();
  } catch (error) {
    alert('Failed to stage files');
  }
}

async function unstageAll() {
  if (!status.value) return;
  const files = status.value.staged.map((f) => f.path);
  try {
    await gitApi.unstage(repoId.value, files);
    await loadStatus();
  } catch (error) {
    alert('Failed to unstage files');
  }
}

async function commit() {
  if (!commitMessage.value.trim()) return;
  try {
    await gitApi.commit(repoId.value, commitMessage.value);
    commitMessage.value = '';
    await loadStatus();
    selectedFile.value = null;
    diff.value = '';
  } catch (error) {
    alert('Failed to commit');
  }
}

function statusChar(status: string): string {
  const map: Record<string, string> = {
    modified: 'M',
    added: 'A',
    deleted: 'D',
    renamed: 'R',
    copied: 'C',
    untracked: '?',
  };
  return map[status] || '?';
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    modified: 'text-yellow-400',
    added: 'text-green-400',
    deleted: 'text-red-400',
    renamed: 'text-blue-400',
    copied: 'text-cyan-400',
    untracked: 'text-gray-400',
  };
  return map[status] || 'text-gray-400';
}
</script>
