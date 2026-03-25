import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  function add(type: ToastType, message: string, duration = 3000) {
    const id = crypto.randomUUID();
    update((t) => [...t, { id, type, message }]);
    setTimeout(() => remove(id), duration);
  }

  function remove(id: string) {
    update((t) => t.filter((toast) => toast.id !== id));
  }

  return {
    subscribe,
    success: (msg: string) => add('success', msg),
    error: (msg: string) => add('error', msg, 5000),
    info: (msg: string) => add('info', msg),
    warning: (msg: string) => add('warning', msg),
    remove,
  };
}

export const toast = createToastStore();
