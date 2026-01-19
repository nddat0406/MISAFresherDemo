<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';

/**
 * MISAToast - Reusable toast notification component
 * Created By: AI Assistant (19/1/2026)
 */

export interface ToastProps {
  /** Toast message text */
  message?: string;
  /** Toast type/variant */
  type?: 'success' | 'error' | 'warning' | 'info';
  /** Toast position */
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Auto close duration in milliseconds (0 = no auto close) */
  duration?: number;
  /** Whether the toast is visible */
  visible?: boolean;
  /** Whether to show close button */
  showClose?: boolean;
}

const props = withDefaults(defineProps<ToastProps>(), {
  message: '',
  type: 'success',
  position: 'top',
  duration: 3000,
  visible: false,
  showClose: true,
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}>();

const isVisible = ref(props.visible);
let closeTimer: number | null = null;

/**
 * Show the toast
 */
const show = () => {
  isVisible.value = true;
  emit('update:visible', true);
  startCloseTimer();
};

/**
 * Hide the toast
 */
const close = () => {
  isVisible.value = false;
  emit('update:visible', false);
  emit('close');
  clearCloseTimer();
};

/**
 * Start auto-close timer
 */
const startCloseTimer = () => {
  clearCloseTimer();
  if (props.duration > 0) {
    closeTimer = window.setTimeout(() => {
      close();
    }, props.duration);
  }
};

/**
 * Clear auto-close timer
 */
const clearCloseTimer = () => {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
};

// Watch for external visible prop changes
watch(() => props.visible, (newVal) => {
  if (newVal && !isVisible.value) {
    show();
  } else if (!newVal && isVisible.value) {
    close();
  }
});

// Watch for duration changes
watch(() => props.duration, () => {
  if (isVisible.value && props.duration > 0) {
    startCloseTimer();
  }
});

// Cleanup on unmount
onUnmounted(() => {
  clearCloseTimer();
});

// Expose methods for parent components
defineExpose({
  show,
  close,
});
</script>

<template>
  <Transition name="toast-fade">
    <div v-if="isVisible" :class="['v-toast', `v-toast--${position}`]">
      <div
        role="alert"
        :class="[
          'v-toast__item',
          `v-toast__item--${type}`,
          `v-toast__item--${position}`,
        ]"
        @click="close"
      >
        <div class="v-toast__icon"></div>
        <div class="v-toast__text">
          <div class="flex justify-between flex1">
            <div class="max-width">
              <!-- Default slot for custom content -->
              <slot>{{ message }}</slot>
            </div>
            <div
              v-if="showClose"
              class="icon20 mi close pointer ml-4"
              @click.stop="close"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Toast fade transition */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-fade-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Toast container positioning */
.v-toast {
  position: fixed;
  display: flex;
  padding: 2em;
  overflow: hidden;
  z-index: 1090;
  pointer-events: none;
}

.v-toast.v-toast--top {
  flex-direction: column;
  top: 0;
  left: 0;
  right: 0;
  align-items: center;
}

.v-toast.v-toast--bottom {
  flex-direction: column;
  bottom: 0;
  left: 0;
  right: 0;
  align-items: center;
}

.v-toast.v-toast--top-left {
  flex-direction: column;
  top: 0;
  left: 0;
  align-items: flex-start;
}

.v-toast.v-toast--top-right {
  flex-direction: column;
  top: 0;
  right: 0;
  align-items: flex-end;
}

.v-toast.v-toast--bottom-left {
  flex-direction: column;
  bottom: 0;
  left: 0;
  align-items: flex-start;
}

.v-toast.v-toast--bottom-right {
  flex-direction: column;
  bottom: 0;
  right: 0;
  align-items: flex-end;
}

/* Toast item base */
.v-toast__item {
  background-color: #fff !important;
  display: inline-flex;
  align-items: center;
  box-shadow: 0 4px 16px #0000003d;
  max-width: 552px;
  min-width: 300px;
  min-height: 48px;
  padding: 12px 0;
  border-radius: 4px;
  position: relative;
  animation-duration: 0.15s;
  margin: 0.5em 0;
  pointer-events: auto;
  opacity: 0.92;
  color: #fff;
  cursor: pointer;
}

.v-toast__item.v-toast__item--top,
.v-toast__item.v-toast__item--bottom {
  align-self: center;
}

/* Toast item variants - colored left bar */
.v-toast__item:before {
  position: absolute;
  content: "";
  width: 16px;
  height: 100%;
  border-radius: 4px;
  top: 0;
  left: 0;
}

.v-toast__item:after {
  content: "";
  position: absolute;
  width: 12px;
  height: 100%;
  background: #fff;
  top: 0;
  left: 6px;
  border-radius: 9px;
}

/* Success variant */
.v-toast__item.v-toast__item--success:before {
  background: #009b71;
}

.v-toast__item.v-toast__item--success .v-toast__icon {
  background: url(../../assets/icons/ic-toast-success-bg.svg) no-repeat;
}

.v-toast__item.v-toast__item--success .v-toast__icon:before {
  background-position: -98px -168px;
}

/* Error variant */
.v-toast__item.v-toast__item--error:before {
  background: #dc2626;
}

.v-toast__item.v-toast__item--error .v-toast__icon {
  background: url(../../assets/icons/ic-toast-success-bg.svg) no-repeat;
}

.v-toast__item.v-toast__item--error .v-toast__icon:before {
  background-position: -98px -168px;
  filter: hue-rotate(180deg);
}

/* Warning variant */
.v-toast__item.v-toast__item--warning:before {
  background: #f59e0b;
}

.v-toast__item.v-toast__item--warning .v-toast__icon {
  background: url(../../assets/icons/ic-toast-success-bg.svg) no-repeat;
}

.v-toast__item.v-toast__item--warning .v-toast__icon:before {
  background-position: -98px -168px;
  filter: hue-rotate(30deg);
}

/* Info variant */
.v-toast__item.v-toast__item--info:before {
  background: #3b82f6;
}

.v-toast__item.v-toast__item--info .v-toast__icon {
  background: url(../../assets/icons/ic-toast-success-bg.svg) no-repeat;
}

.v-toast__item.v-toast__item--info .v-toast__icon:before {
  background-position: -98px -168px;
  filter: hue-rotate(200deg);
}

/* Toast icon */
.v-toast__item .v-toast__icon {
  height: 20px;
  width: 20px;
  min-width: 20px;
  margin: 1px 8px 0 16px;
  position: relative;
  background-color: #fff !important;
  display: block;
}

.v-toast__item .v-toast__icon:before {
  content: "";
  background: transparent url(../../assets/icons/icon-palette-1.svg) no-repeat;
  position: absolute;
  height: 20px;
  width: 20px;
  top: 4px;
  right: 0;
}

/* Toast text */
.v-toast__item .v-toast__text {
  padding: 0 16px 0 0;
  color: #111827;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 24px;
  line-height: 24px;
}

/* Utility classes */
.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.flex1 {
  flex: 1;
}

.max-width {
  max-width: 100%;
  word-wrap: break-word;
}

.pointer {
  cursor: pointer;
}

.ml-4 {
  margin-left: 1rem;
}
</style>
