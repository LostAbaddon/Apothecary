import { ref } from 'vue';

export const toasts = ref([]);
let idSeq = 0;

export function showToast(message, options = {}) {
  const id = ++idSeq;
  const toast = {
    id,
    message,
    type: options.type || 'info',
    // 统一 3 秒展示
    duration: options.duration ?? 3000,
  };
  // 单条顶替：只保留最新一条
  toasts.value = [toast];
  // 自动移除（若被顶替，旧定时器 remove 将无效）
  window.setTimeout(() => removeToast(id), toast.duration);
}

export function removeToast(id) {
  const idx = toasts.value.findIndex(t => t.id === id);
  if (idx !== -1) toasts.value.splice(idx, 1);
}
