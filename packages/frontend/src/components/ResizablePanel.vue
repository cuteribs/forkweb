<template>
  <div class="flex" :class="direction === 'horizontal' ? 'flex-row' : 'flex-col'" :style="{ height: '100%' }">
    <!-- First Panel -->
    <div
      :style="firstPanelStyle"
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
    <div :style="secondPanelStyle">
      <slot name="second"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';

interface Props {
  direction?: 'horizontal' | 'vertical';
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  resizeTarget?: 'first' | 'second';
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'horizontal',
  defaultSize: 256,
  minSize: 200,
  maxSize: undefined,
  resizeTarget: 'first',
});

const size = ref(props.defaultSize);
const isDragging = ref(false);
const startPos = ref(0);
const startSize = ref(0);
let animationFrameId: number | null = null;

const firstPanelStyle = computed(() => {
  if (props.resizeTarget === 'first') {
    return {
      [props.direction === 'horizontal' ? 'width' : 'height']: `${size.value}px`,
      flexShrink: 0,
      overflow: 'hidden',
      willChange: isDragging.value ? 'width, height' : 'auto',
    };
  } else {
    return {
      flex: 1,
      overflow: 'hidden',
    };
  }
});

const secondPanelStyle = computed(() => {
  if (props.resizeTarget === 'second') {
    return {
      [props.direction === 'horizontal' ? 'width' : 'height']: `${size.value}px`,
      flexShrink: 0,
      overflow: 'hidden',
      willChange: isDragging.value ? 'width, height' : 'auto',
    };
  } else {
    return {
      flex: 1,
      overflow: 'hidden',
    };
  }
});

function startResize(e: MouseEvent) {
  isDragging.value = true;
  startPos.value = props.direction === 'horizontal' ? e.clientX : e.clientY;
  startSize.value = size.value;

  document.addEventListener('mousemove', onResize, { passive: true });
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = props.direction === 'horizontal' ? 'col-resize' : 'row-resize';
  document.body.style.userSelect = 'none';
}

function onResize(e: MouseEvent) {
  if (!isDragging.value) return;

  // Cancel any pending animation frame
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }

  // Use requestAnimationFrame for smooth updates
  animationFrameId = requestAnimationFrame(() => {
    const currentPos = props.direction === 'horizontal' ? e.clientX : e.clientY;
    let delta = currentPos - startPos.value;
    
    // If resizing the second panel, invert the delta
    if (props.resizeTarget === 'second') {
      delta = -delta;
    }
    
    let newSize = startSize.value + delta;
    newSize = Math.max(props.minSize, newSize);
    if (props.maxSize !== undefined) {
      newSize = Math.min(props.maxSize, newSize);
    }
    size.value = newSize;
    animationFrameId = null;
  });
}

function stopResize() {
  isDragging.value = false;
  
  // Cancel any pending animation frame
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
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
