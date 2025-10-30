<template>
  <div>
    <!-- Folder -->
    <button
      v-if="node.isFolder"
      @click="$emit('toggle-folder', node.fullPath)"
      class="w-full flex items-center gap-2 px-2 py-1 rounded text-sm transition-colors text-left hover:bg-gray-800 text-gray-300"
      :style="{ paddingLeft: `${depth * 12 + 8}px` }"
    >
      <Icon 
        :icon="isExpanded ? 'codicon:chevron-down' : 'codicon:chevron-right'" 
        class="text-xs flex-shrink-0" 
      />
      <Icon icon="codicon:folder" class="text-xs flex-shrink-0" />
      <span class="truncate flex-1">{{ node.name }}</span>
    </button>

    <!-- Branch -->
    <button
      v-else-if="node.branch"
      @click="$emit('view-branch', node.branch.name)"
      @dblclick.stop="$emit('checkout-branch', node.branch.name)"
      class="w-full flex items-center gap-2 px-2 py-1 rounded text-sm transition-colors text-left"
      :class="[
        selectedBranch === node.branch.name
          ? 'bg-primary-900 text-primary-200' 
          : 'hover:bg-gray-800 text-gray-300',
        node.branch.current ? 'font-bold' : 'font-normal'
      ]"
      :style="{ paddingLeft: `${depth * 12 + 8}px` }"
    >
      <Icon 
        :icon="node.branch.current ? 'codicon:check' : 'codicon:circle-outline'" 
        class="text-xs flex-shrink-0" 
      />
      <span class="truncate flex-1">{{ node.name }}</span>
    </button>

    <!-- Children (recursively render) -->
    <template v-if="node.isFolder && isExpanded">
      <BranchTreeNode
        v-for="child in node.children"
        :key="child.fullPath"
        :node="child"
        :selected-branch="selectedBranch"
        :depth="depth + 1"
        :expanded-folders="expandedFolders"
        @toggle-folder="(path) => $emit('toggle-folder', path)"
        @view-branch="(name) => $emit('view-branch', name)"
        @checkout-branch="(name) => $emit('checkout-branch', name)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

interface BranchNode {
  name: string;
  fullPath: string;
  branch?: any;
  children: BranchNode[];
  isFolder: boolean;
}

interface Props {
  node: BranchNode;
  selectedBranch?: string;
  depth: number;
  expandedFolders: Set<string>;
}

const props = defineProps<Props>();

defineEmits<{
  'toggle-folder': [path: string];
  'view-branch': [name: string];
  'checkout-branch': [name: string];
}>();

const isExpanded = computed(() => props.expandedFolders.has(props.node.fullPath));
</script>
