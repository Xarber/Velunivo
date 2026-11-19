import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { syncSummaries } from '../services/accountSync';
import { subscribeRides } from '../services/rideHistory';

const observers = new Set<() => void>();
const listeners = new Set<() => void>();
export function refreshAccountSync() { for (const observer of observers) observer(); }
export function observeAccountSync(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export default function AccountSyncWorker() {
  useEffect(() => {
    let running = false;
    let queued = false;
    let disposed = false;
    async function sync() {
      if (disposed || AppState.currentState === 'background' ||
        (Platform.OS === 'web' && (document.visibilityState !== 'visible' || !navigator.onLine))) return;
      if (running) { queued = true; return; }
      running = true;
      try {
        await syncSummaries();
        if (!disposed) for (const listener of listeners) listener();
      } catch {
        // The next foreground, ride or network event can retry.
      } finally {
        running = false;
        if (queued) { queued = false; void sync(); }
      }
    }
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void sync(), 1500);
    };
    observers.add(schedule);
    const unsubscribe = subscribeRides(schedule);
    const state = AppState.addEventListener('change', schedule);
    if (Platform.OS === 'web') {
      document.addEventListener('visibilitychange', schedule);
      window.addEventListener('online', schedule);
    }
    schedule();
    return () => {
      disposed = true;
      clearTimeout(timer);
      observers.delete(schedule);
      unsubscribe();
      state.remove();
      if (Platform.OS === 'web') {
        document.removeEventListener('visibilitychange', schedule);
        window.removeEventListener('online', schedule);
      }
    };
  }, []);
  return null;
}
