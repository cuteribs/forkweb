<template>
  <div class="w-64 bg-gray-850 border-r border-gray-700 flex flex-col overflow-hidden">
    <!-- Quick Actions Section -->
    <div class="p-2 space-y-1">
      <button
        @click="$emit('select', 'local-changes')"
        class="w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors"
        :class="selectedItem === 'local-changes' 
          ? 'bg-primary-900 text-primary-200' 
          : 'hover:bg-gray-800 text-gray-300'"
      >
        <span>📝</span>
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
        <span>📊</span>
        <span>All Commits</span>
      </button>
    </div>

    <div class="h-px bg-gray-700 mx-2"></div>

    <!-- Tree Views Section -->
    <div class="flex-1 overflow-y-auto p-2 space-y-2">
      <!-- Local Branches -->
      <TreeSection
        title="Local Branches"
        icon="🌿"
        :expanded="expandedSections.localBranches"
        @toggle="toggleSection('localBranches')"
      >
        <TreeItem
          v-for="branch in localBranches"
          :key="branch.name"
          :label="branch.name"
          :active="branch.current"
          :icon="branch.current ? '●' : '○'"
          @click="$emit('checkout-branch', branch.name)"
        />
      </TreeSection>

      <!-- Remotes -->
      <TreeSection
        title="Remotes"
        icon="🌐"
        :expanded="expandedSections.remotes"
        @toggle="toggleSection('remotes')"
      >
        <TreeItem
          v-for="remote in remotes"
          :key="remote"
          :label="remote"
          icon="📡"
        />
      </TreeSection>

      <!-- Tags -->
      <TreeSection
        title="Tags"
        icon="🏷️"
        :expanded="expandedSections.tags"
        @toggle="toggleSection('tags')"
      >
        <TreeItem
          v-for="tag in tags"
          :key="tag"
          :label="tag"
          icon="•"
        />
      </TreeSection>

      <!-- Stashes -->
      <TreeSection
        title="Stashes"
        icon="📦"
        :expanded="expandedSections.stashes"
        @toggle="toggleSection('stashes')"
      >
        <TreeItem
          v-for="(stash, index) in stashes"
          :key="index"
          :label="`stash@{${index}}: ${stash}`"
          icon="📌"
        />
      </TreeSection>

      <!-- Submodules -->
      <TreeSection
        title="Submodules"
        icon="📂"
        :expanded="expandedSections.submodules"
        @toggle="toggleSection('submodules')"
      >
        <TreeItem
          v-for="submodule in submodules"
          :key="submodule"
          :label="submodule"
          icon="⊂"
        />
      </TreeSection>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Branch } from '@forkweb/shared';
import TreeSection from './TreeSection.vue';
import TreeItem from './TreeItem.vue';

interface Props {
  selectedItem?: string;
  changesCount?: number;
  localBranches?: Branch[];
  remotes?: string[];
  tags?: string[];
  stashes?: string[];
  submodules?: string[];
}

withDefaults(defineProps<Props>(), {
  selectedItem: 'local-changes',
  changesCount: 0,
  localBranches: () => [],
  remotes: () => [],
  tags: () => [],
  stashes: () => [],
  submodules: () => [],
});

defineEmits<{
  select: [item: string];
  'checkout-branch': [branchName: string];
}>();

const expandedSections = ref({
  localBranches: true,
  remotes: false,
  tags: false,
  stashes: false,
  submodules: false,
});

function toggleSection(section: keyof typeof expandedSections.value) {
  expandedSections.value[section] = !expandedSections.value[section];
}
</script>
