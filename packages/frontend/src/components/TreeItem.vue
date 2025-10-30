<template>
  <button
    @click="$emit('click')"
    @dblclick="$emit('dblclick')"
    class="w-full flex items-center gap-2 px-2 py-1 rounded text-sm transition-colors text-left"
    :class="[
      active 
        ? 'bg-primary-900 text-primary-200' 
        : 'hover:bg-gray-800 text-gray-300',
      bold ? 'font-bold' : 'font-normal'
    ]"
  >
    <Icon :icon="icon" class="text-xs flex-shrink-0" />
    <span class="truncate flex-1">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';

interface Props {
  label: string;
  icon?: string;
  active?: boolean;
  bold?: boolean;
}

withDefaults(defineProps<Props>(), {
  icon: 'codicon:circle-small',
  active: false,
  bold: false,
});

defineEmits<{
  click: [];
  dblclick: [];
}>();
</script>
