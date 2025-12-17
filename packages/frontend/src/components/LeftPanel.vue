<template>
  <div class="h-full bg-gray-850 border-r border-gray-700 flex flex-col overflow-hidden">
    <!-- Quick Actions Section -->
    <div class="p-2 space-y-1">
      <button
        @click="$emit('select', 'local-changes')"
        class="w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors"
        :class="selectedItem === 'local-changes' 
          ? 'bg-primary-900 text-primary-200' 
          : 'hover:bg-gray-800 text-gray-300'"
      >
        <Icon icon="codicon:git-commit" />
        <span>Local Changes</span>
        <span v-if="changesCount > 0" class="ml-auto badge badge-primary text-xs">{{ changesCount }}</span>
      </button>
      
      <button
        @click="$emit('select', 'all-commits')"
        class="w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors"
        :class="selectedItem === 'all-commits' 
          ? 'bg-primary-900 text-primary-200' 
          : 'hover:bg-gray-800 text-gray-300'"
      >
        <Icon icon="codicon:history" />
        <span>All Commits</span>
      </button>
    </div>

    <div class="h-px bg-gray-700 mx-2"></div>

    <!-- Tree Views Section -->
    <div class="flex-1 overflow-y-auto p-2 space-y-2">
      <!-- Local Branches -->
      <TreeSection
        title="Local Branches"
        icon="codicon:home"
        :expanded="expandedSections.localBranches"
        @toggle="toggleSection('localBranches')"
      >
        <BranchTreeNode
          v-for="node in localBranchTree"
          :key="node.fullPath"
          :node="node"
          :selected-branch="selectedBranch"
          :depth="0"
          :expanded-folders="expandedFolders"
          @toggle-folder="toggleFolder"
          @view-branch="(name) => $emit('view-branch', name, 'local')"
          @checkout-branch="(name) => $emit('checkout-branch', name)"
        />
      </TreeSection>

      <!-- Remotes -->
      <TreeSection
        title="Remotes"
        icon="codicon:cloud"
        :expanded="expandedSections.remotes"
        @toggle="toggleSection('remotes')"
      >
        <BranchTreeNode
          v-for="node in remoteBranchTree"
          :key="node.fullPath"
          :node="node"
          :selected-branch="selectedBranch"
          :depth="0"
          :expanded-folders="expandedFolders"
          @toggle-folder="toggleFolder"
          @view-branch="(name) => $emit('view-branch', name, 'remote')"
          @checkout-branch="(name) => $emit('checkout-branch', name)"
        />
      </TreeSection>

      <!-- Tags -->
      <TreeSection
        title="Tags"
        icon="codicon:tag"
        :expanded="expandedSections.tags"
        @toggle="toggleSection('tags')"
      >
        <TreeItem
          v-for="tag in tags"
          :key="tag"
          :label="tag"
          icon="codicon:tag"
        />
      </TreeSection>

      <!-- Stashes -->
      <TreeSection
        title="Stashes"
        icon="codicon:archive"
        :expanded="expandedSections.stashes"
        @toggle="toggleSection('stashes')"
      >
        <TreeItem
          v-for="(stash, index) in stashes"
          :key="index"
          :label="`stash@{${index}}: ${stash}`"
          icon="codicon:file"
        />
      </TreeSection>

      <!-- Submodules -->
      <TreeSection
        title="Submodules"
        icon="codicon:folder"
        :expanded="expandedSections.submodules"
        @toggle="toggleSection('submodules')"
      >
        <TreeItem
          v-for="submodule in submodules"
          :key="submodule"
          :label="submodule"
          icon="codicon:folder-opened"
        />
      </TreeSection>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import type { Branch } from '@forkweb/shared';
import TreeSection from './TreeSection.vue';
import TreeItem from './TreeItem.vue';
import BranchTreeNode from './BranchTreeNode.vue';

interface BranchNode {
  name: string;
  fullPath: string;
  branch?: Branch;
  children: BranchNode[];
  isFolder: boolean;
}

interface Props {
  selectedItem?: string;
  selectedBranch?: string;
  changesCount?: number;
  localBranches?: Branch[];
  remoteBranches?: Branch[];
  remotes?: string[];
  tags?: string[];
  stashes?: string[];
  submodules?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  selectedItem: 'local-changes',
  selectedBranch: undefined,
  changesCount: 0,
  localBranches: () => [],
  remoteBranches: () => [],
  remotes: () => [],
  tags: () => [],
  stashes: () => [],
  submodules: () => [],
});

const emit = defineEmits<{
  select: [item: string];
  'view-branch': [branchName: string, type: 'local' | 'remote'];
  'checkout-branch': [branchName: string];
}>();

const expandedSections = ref({
  localBranches: true,
  remotes: false,
  tags: false,
  stashes: false,
  submodules: false,
});

const expandedFolders = ref<Set<string>>(new Set());

function toggleSection(section: keyof typeof expandedSections.value) {
  expandedSections.value[section] = !expandedSections.value[section];
}

function toggleFolder(path: string) {
  if (expandedFolders.value.has(path)) {
    expandedFolders.value.delete(path);
  } else {
    expandedFolders.value.add(path);
  }
}

function organizeBranches(branches: Branch[]): BranchNode[] {
  const root: BranchNode[] = [];
  
  for (const branch of branches) {
    const parts = branch.name.split('/');
    let currentLevel = root;
    let currentPath = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;
      
      let node = currentLevel.find(n => n.name === part);
      
      if (!node) {
        node = {
          name: part,
          fullPath: currentPath,
          branch: isLast ? branch : undefined,
          children: [],
          isFolder: !isLast,
        };
        currentLevel.push(node);
      }
      
      currentLevel = node.children;
    }
  }
  
  return root;
}

const localBranchTree = computed(() => organizeBranches(props.localBranches));
const remoteBranchTree = computed(() => organizeBranches(props.remoteBranches));
</script>
