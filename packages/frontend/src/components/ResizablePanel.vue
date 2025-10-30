<template>
  <div class="flex" :class="direction === 'horizontal' ? 'flex-row' : 'flex-col'" :style="{ height: '100%' }">
    <!-- First Panel -->
    <div
      :style="{
        [direction === 'horizontal' ? 'width' : 'height']: `${size}px`,
        flexShrink: 0,
        overflow: 'hidden',
      }"
    >
      <slot name="first"></slot>
    </div>

    <!-- Resizer -->
    <div
      :class="[
        'resizer',
        direction === 'horizontal' ? 'resizer-vertical' : 'resizer-horizontal',
        isDragging ? 'resizer-active' : '',
      ]"
      @mousedown="startResize"
    ></div>

    <!-- Second Panel -->
    <div style="flex: 1; overflow: hidden">
      <slot name="second"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Props {
  direction?: 'horizontal' | 'vertical';
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'horizontal',
  defaultSize: 256,
  minSize: 200,
  maxSize: 800,
});

const size = ref(props.defaultSize);
const isDragging = ref(false);
const startPos = ref(0);
const startSize = ref(0);

function startResize(e: MouseEvent) {
  isDragging.value = true;
  startPos.value = props.direction === 'horizontal' ? e.clientX : e.clientY;
  startSize.value = size.value;

  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = props.direction === 'horizontal' ? 'col-resize' : 'row-resize';
  document.body.style.userSelect = 'none';
}

function onResize(e: MouseEvent) {
  if (!isDragging.value) return;

  const currentPos = props.direction === 'horizontal' ? e.clientX : e.clientY;
  const delta = currentPos - startPos.value;
  const newSize = Math.max(props.minSize, Math.min(props.maxSize, startSize.value + delta));
  size.value = newSize;
}

function stopResize() {
  isDragging.value = false;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
});
</script>

<style scoped>
.resizer {
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.resizer-vertical {
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background-color 0.2s;
}

.resizer-vertical:hover,
.resizer-vertical.resizer-active {
  background-color: rgba(59, 130, 246, 0.5);
}

.resizer-horizontal {
  height: 4px;
  cursor: row-resize;
  background: transparent;
  transition: background-color 0.2s;
}

.resizer-horizontal:hover,
.resizer-horizontal.resizer-active {
  background-color: rgba(59, 130, 246, 0.5);
}
</style>
