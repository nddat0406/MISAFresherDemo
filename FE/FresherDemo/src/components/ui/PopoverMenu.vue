<script setup lang="ts">
import router from '../../router';
import type { PopoverCategory, PopoverPosition } from '../../types/navigation';

/**
 * PopoverMenu Component
 * Renders floating popover menu with categorized items
 * Created By: DatND (13/1/2026)
 */

interface Props {
  categories: PopoverCategory[];
  position: PopoverPosition;
  currentPath?: string;
}

interface Emits {
  (e: 'item-click', itemId: string, path?: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Check if item is active based on current path.
 * Created By: DatND (13/1/2026)
 */
const isItemActive = (itemPath?: string): boolean => {
  return !!itemPath && !!props.currentPath && props.currentPath === itemPath;
};

/**
 * Handle popover item click.
 * Created By: DatND (13/1/2026)
 */
const handleItemClick = (itemId: string, path?: string) => {
  emit('item-click', itemId, path);
  if (path) {
    router.push(path);
  }
};
</script>

<template>
  <div class="popover-wrapper" :style="{
    top: position.top !== undefined ? position.top + 'px' : undefined,
    bottom: position.bottom !== undefined ? position.bottom + 'px' : undefined,
    left: position.left + 'px'
  }">
    <div class="sub-nav flex">
      <div v-for="cate in categories" :key="cate.title" :class="categories.length > 1 ? 'w-1/2' : 'w-full'">
        <div class="flex flex-col gap-1 sub-nav-col">
          <div class="sub-nav-group"><span class="title-group">{{ cate.title }}</span></div>
          <button v-for="item in cate.items" :key="item.id"
            :class="['sub-nav-item', 'flex-row', { 'active': isItemActive(item.path) }]"
            @click="handleItemClick(item.id, item.path)">
            <span class="sub-nav-item-text">{{ item.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.popover-wrapper {
  position: fixed;
  background: #1f2937;
  border: 1px solid rgba(209, 213, 219, 0.2);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  animation: popoverFadeIn 0.2s ease-out;
}

@keyframes popoverFadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.sub-nav {
  background: #111827;
  border: 1px solid #707070;
  border-radius: 4px;
  min-height: max-content;
  padding: 8px;
  column-gap: 8px;
  cursor: default;
}

.sub-nav-group {
  height: 32px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  position: relative;
}

.sub-nav-group .title-group {
  color: #4b5563;
  font-weight: 500;
  font-size: 13px;
  width: 100%;
  line-height: 14px;
}

.sub-nav .sub-nav-item {
  justify-content: flex-start;
  color: #9ca3af;
  position: relative;
  padding: 0 32px;
  height: 32px;
  font-weight: 400;
  font-size: 13px;
  display: flex;
  align-items: center;
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  text-align: left;
}

.sub-nav .sub-nav-item-text {
  z-index: 1;
  text-wrap: nowrap;
}

.sub-nav .sub-nav-item:hover span {
  z-index: 1;
}

.sub-nav .sub-nav-item:hover {
  cursor: pointer;
  color: #fff;
  background: rgba(156, 163, 175, .15);
  border-radius: 4px;
}

.sub-nav .sub-nav-item:hover::after {
  content: "";
  position: absolute;
  left: 8px;
  width: 20px;
  height: 20px;
  mask-image: url('../../assets/icons/icon-palette-1.svg');
  mask-repeat: no-repeat;
  mask-position: -58px -67px;
  background-color: #fff;
  z-index: 2;
}

.sub-nav .sub-nav-item.active {
  background: #4b5563;
  border-radius: 4px;
  color: #fff;
  font-weight: 500;
}

.sub-nav .sub-nav-item.active::after {
  content: "";
  position: absolute;
  left: 8px;
  width: 20px;
  height: 20px;
  mask-image: url('../../assets/icons/icon-palette-1.svg');
  mask-repeat: no-repeat;
  mask-position: -58px -67px;
  background-color: #fff;
  z-index: 2;
}
</style>
