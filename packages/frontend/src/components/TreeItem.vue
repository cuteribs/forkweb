<template>
  <button
    @click="$emit('click')"
    class="w-full flex items-center gap-2 px-2 py-1 rounded text-sm transition-colors text-left"
    :class="active 
      ? 'bg-primary-900 text-primary-200 font-medium' 
      : 'hover:bg-gray-800 text-gray-300'"
  >
    <span class="text-xs">{{ icon }}</span>
    <span class="truncate flex-1">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  label: string;
  icon?: string;
  active?: boolean;
}

withDefaults(defineProps<Props>(), {
  icon: '•',
  active: false,
});

defineEmits<{
  click: [];
}>();
</script>
