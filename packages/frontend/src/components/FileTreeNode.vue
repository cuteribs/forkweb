<template>
  <div>
    <div
      class="flex items-center gap-1 px-3 py-1 hover:bg-gray-800 cursor-pointer text-sm"
      :class="{ 'bg-gray-800': selectedPath === node.path }"
      :style="{ paddingLeft: `${depth * 0.75 + 0.75}rem` }"
      @click="handleClick"
    >
      <Icon 
        v-if="node.type === 'directory'" 
        :icon="expanded ? 'codicon:chevron-down' : 'codicon:chevron-right'" 
        class="w-4 text-gray-500" 
      />
      <span v-else class="w-4"></span>
      <Icon 
        :icon="node.type === 'directory' ? (expanded ? 'codicon:folder-opened' : 'codicon:folder') : 'codicon:file'"
        class="text-gray-500"
      />
      <span class="truncate">{{ fileName }}</span>
    </div>

    <div v-if="node.type === 'directory' && expanded && node.children">
      <FileTreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        :selected-path="selectedPath"
        @select="(event) => $emit('select', event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import type { FileNode } from '@forkweb/shared';

interface Props {
  node: FileNode;
  depth?: number;
  selectedPath?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0,
  selectedPath: null,
});

const emit = defineEmits<{
  select: [{ path: string; isDirectory: boolean }];
}>();

const expanded = ref(false);

const fileName = computed(() => {
  const parts = props.node.path.split('/');
  return parts[parts.length - 1];
});

function handleClick() {
  if (props.node.type === 'directory') {
    expanded.value = !expanded.value;
  } else {
    emit('select', { path: props.node.path, isDirectory: false });
  }
}
</script>
