<template>
  <div class="text-sm">
    <button
      @click="$emit('toggle')"
      class="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800 text-gray-400 transition-colors"
    >
      <Icon :icon="expanded ? 'codicon:chevron-down' : 'codicon:chevron-right'" class="text-xs" />
      <Icon :icon="icon" />
      <span class="font-semibold">{{ title }}</span>
    </button>
    <div v-if="expanded" class="ml-3 mt-1 space-y-0.5">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';

interface Props {
  title: string;
  icon: string;
  expanded?: boolean;
}

withDefaults(defineProps<Props>(), {
  expanded: false,
});

defineEmits<{
  toggle: [];
}>();
</script>
