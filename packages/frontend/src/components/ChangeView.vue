<template>
  <div class="h-full flex">
    <!-- Left: File Lists -->
    <div class="w-80 flex flex-col border-r border-gray-700">
      <!-- Top: Unstaged Section -->
      <div class="flex-1 flex flex-col border-b border-gray-700 overflow-hidden">
        <div class="px-3 py-2 bg-gray-850 border-b border-gray-700 flex items-center justify-between">
          <span class="text-sm font-semibold text-yellow-400">Unstaged Changes ({{ unstagedFiles.length }})</span>
          <button
            v-if="unstagedFiles.length > 0"
            class="btn-ghost px-2 py-1 text-xs"
            @click="$emit('stage-all')"
            title="Stage All"
          >
            +
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <FileTreeItem
            v-for="file in unstagedFiles"
            :key="file.path"
            :file="file"
            :selected="selectedFile === file.path"
            @click="selectFile(file.path, false)"
            @stage="$emit('stage', file.path)"
          />
          <div v-if="unstagedFiles.length === 0" class="p-4 text-center text-sm text-muted">
            No unstaged changes
          </div>
        </div>
      </div>

      <!-- Bottom: Staged Section -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="px-3 py-2 bg-gray-850 border-b border-gray-700 flex items-center justify-between">
          <span class="text-sm font-semibold text-green-400">Staged Changes ({{ stagedFiles.length }})</span>
          <button
            v-if="stagedFiles.length > 0"
            class="btn-ghost px-2 py-1 text-xs"
            @click="$emit('unstage-all')"
            title="Unstage All"
          >
            −
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <FileTreeItem
            v-for="file in stagedFiles"
            :key="file.path"
            :file="file"
            :selected="selectedFile === file.path"
            :staged="true"
            @click="selectFile(file.path, true)"
            @unstage="$emit('unstage', file.path)"
          />
          <div v-if="stagedFiles.length === 0" class="p-4 text-center text-sm text-muted">
            No staged changes
          </div>
        </div>

        <!-- Commit Button and Message -->
        <div v-if="stagedFiles.length > 0" class="border-t border-gray-700 p-3 space-y-2">
          <textarea
            v-model="commitMessage"
            class="input w-full resize-none"
            rows="3"
            placeholder="Commit message..."
          ></textarea>
          <button
            class="btn btn-primary w-full"
            @click="handleCommit"
            :disabled="!commitMessage.trim()"
          >
            Commit {{ stagedFiles.length }} file(s)
          </button>
        </div>
      </div>
    </div>

    <!-- Right: Diff Content -->
    <div class="flex-1 flex flex-col overflow-hidden bg-gray-900">
      <div class="px-4 py-2 bg-gray-850 border-b border-gray-700">
        <span class="text-sm font-semibold">{{ selectedFile || 'Select a file to view diff' }}</span>
      </div>
      <div class="flex-1 overflow-auto p-4 font-mono text-sm">
        <pre v-if="diffContent" class="whitespace-pre-wrap">{{ diffContent }}</pre>
        <div v-else class="text-center text-muted">Select a file to view changes</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { FileChange } from '@forkweb/shared';
import FileTreeItem from './FileTreeItem.vue';

interface Props {
  stagedFiles: FileChange[];
  unstagedFiles: FileChange[];
}

defineProps<Props>();

const emit = defineEmits<{
  'stage': [path: string];
  'unstage': [path: string];
  'stage-all': [];
  'unstage-all': [];
  'commit': [message: string];
}>();

const selectedFile = ref<string | null>(null);
const isStaged = ref(false);
const diffContent = ref('');
const commitMessage = ref('');

function selectFile(path: string, staged: boolean) {
  selectedFile.value = path;
  isStaged.value = staged;
  // Load diff for this file
  loadDiff(path, staged);
}

async function loadDiff(path: string, staged: boolean) {
  // TODO: Call API to get diff
  diffContent.value = `Diff for ${path} (${staged ? 'staged' : 'unstaged'})`;
}

function handleCommit() {
  if (commitMessage.value.trim()) {
    emit('commit', commitMessage.value);
    commitMessage.value = '';
  }
}
</script>
