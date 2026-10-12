/** Notify retained menus only after map metadata has been committed. */
const listeners = new Set<() => void>();
export function subscribeMapDownloads(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function notifyMapDownloads() { for (const listener of listeners) listener(); }
