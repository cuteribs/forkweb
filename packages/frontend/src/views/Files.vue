<template>
  <div class="h-full flex">
    <!-- Left: File Tree -->
    <div class="w-80 border-r border-gray-700 flex flex-col overflow-hidden">
      <div class="px-3 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <span class="text-sm font-semibold text-muted">FILES</span>
        <button class="btn-ghost px-2 py-1 text-sm" @click="loadTree" title="Refresh">⟳</button>
      </div>

      <div class="flex-1 overflow-y-auto text-sm">
        <div v-if="loading" class="p-4 text-center text-muted text-sm">Loading...</div>

        <div v-else-if="tree.length === 0" class="p-4 text-center text-muted text-sm">
          No files found
        </div>

        <div v-else>
          <FileTreeNode
            v-for="node in tree"
            :key="node.path"
            :node="node"
            :selected-path="selectedPath"
            @select="(event) => selectFile(event.path, event.isDirectory)"
          />
        </div>
      </div>
    </div>

    <!-- Right: File Content -->
    <div class="flex-1 flex flex-col overflow-hidden bg-gray-900">
      <div class="px-3 py-2 bg-gray-800 border-b border-gray-700">
        <span class="text-sm font-semibold">{{ selectedPath || 'Select a file to view' }}</span>
      </div>

      <div class="flex-1 overflow-auto p-4 font-mono text-sm">
        <div v-if="contentLoading" class="text-center text-muted">Loading...</div>
        <pre v-else-if="content" class="whitespace-pre-wrap">{{ content }}</pre>
        <div v-else class="text-center text-muted">Select a file to view its content</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import type { FileNode } from '@forkweb/shared';
import { gitApi } from '@/api/git';
import FileTreeNode from '@/components/FileTreeNode.vue';

const route = useRoute();

const loading = ref(false);
const tree = ref<FileNode[]>([]);
const selectedPath = ref<string | null>(null);
const content = ref('');
const contentLoading = ref(false);

const repoId = computed(() => route.params.id as string);

onMounted(() => {
  loadTree();
});

async function loadTree() {
  loading.value = true;
  try {
    tree.value = await gitApi.getTree(repoId.value);
  } catch (error) {
    console.error('Failed to load file tree:', error);
  } finally {
    loading.value = false;
  }
}

async function selectFile(path: string, isDirectory: boolean) {
  if (isDirectory) return;

  selectedPath.value = path;
  contentLoading.value = true;

  try {
    content.value = await gitApi.getFileContent(repoId.value, path);
  } catch (error) {
    console.error('Failed to load file content:', error);
    content.value = '';
  } finally {
    contentLoading.value = false;
  }
}
</script>
