import { ref, createApp, h } from 'vue';
import MISAToast from '@/components/ui/MISAToast.vue';

/**
 * Toast notification composable
 * Provides programmatic toast notifications
 * Created By: DatND (19/1/2026)
 * 
 * @example
 * const toast = useToast();
 * toast.success('Operation completed successfully!');
 * toast.error('Something went wrong');
 * toast.warning('Please check your input');
 * toast.info('New update available');
 */

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  duration?: number;
  showClose?: boolean;
}

interface ToastInstance {
  show: () => void;
  close: () => void;
  destroy: () => void;
}

const toastInstances = ref<ToastInstance[]>([]);

/**
 * Create and show a toast notification
 */
function createToast(options: ToastOptions): ToastInstance {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const app = createApp({
    setup() {
      const visible = ref(true);

      const handleClose = () => {
        visible.value = false;
        setTimeout(() => {
          app.unmount();
          document.body.removeChild(container);
          // Remove from instances array
          const index = toastInstances.value.indexOf(instance);
          if (index > -1) {
            toastInstances.value.splice(index, 1);
          }
        }, 300); // Wait for transition to complete
      };

      return () =>
        h(MISAToast, {
          ...options,
          visible: visible.value,
          'onUpdate:visible': (val: boolean) => {
            visible.value = val;
          },
          onClose: handleClose,
        });
    },
  });

  const instance = app.mount(container) as any;

  const toastInstance: ToastInstance = {
    show: () => instance.show?.(),
    close: () => instance.close?.(),
    destroy: () => {
      app.unmount();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    },
  };

  toastInstances.value.push(toastInstance);
  return toastInstance;
}

/**
 * Show a success toast
 */
function success(message: string, options?: Partial<ToastOptions>): ToastInstance {
  return createToast({
    message,
    type: 'success',
    duration: 3000,
    ...options,
  });
}

/**
 * Show an error toast
 */
function error(message: string, options?: Partial<ToastOptions>): ToastInstance {
  return createToast({
    message,
    type: 'error',
    duration: 4000,
    ...options,
  });
}

/**
 * Show a warning toast
 */
function warning(message: string, options?: Partial<ToastOptions>): ToastInstance {
  return createToast({
    message,
    type: 'warning',
    duration: 3500,
    ...options,
  });
}

/**
 * Show an info toast
 */
function info(message: string, options?: Partial<ToastOptions>): ToastInstance {
  return createToast({
    message,
    type: 'info',
    duration: 3000,
    ...options,
  });
}

/**
 * Close all active toasts
 */
function closeAll(): void {
  toastInstances.value.forEach((instance) => {
    instance.close();
  });
}

export function useToast() {
  return {
    success,
    error,
    warning,
    info,
    show: createToast,
    closeAll,
  };
}

export type { ToastOptions, ToastInstance };
