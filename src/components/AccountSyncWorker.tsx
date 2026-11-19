import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { syncAccountArchive } from '../services/accountArchive';
import {isRideLocked, subscribeRideLock} from '../services/rideLock';
import { request, syncSummaries, type AccountStatus } from '../services/accountSync';
import { subscribeRides } from '../services/rideHistory';

const observers = new Set<() => void>();
const listeners = new Set<(error?: unknown) => void>();
export function refreshAccountSync() { for (const observer of observers) observer(); }
export function observeAccountSync(listener: (error?: unknown) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export default function AccountSyncWorker() {
  useEffect(() => {
    let running = false;
    let queued = false;
    let disposed = false;
    async function sync() {
      if (disposed || isRideLocked() || AppState.currentState === 'background' ||
        (Platform.OS === 'web' && (document.visibilityState !== 'visible' || !navigator.onLine))) return;
      if (running) { queued = true; return; }
      running = true;
      try {
        const response = await request('status');
        const status: AccountStatus = await response.json();
        const outcomes = await Promise.allSettled([syncAccountArchive(status), syncSummaries(status)]);
        for (const outcome of outcomes) if (outcome.status === 'rejected') throw outcome.reason;
        if (!disposed) for (const listener of listeners) listener();
      } catch (error) {
        if (!disposed) for (const listener of listeners) listener(error);
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
    const stopRide = subscribeRideLock(schedule);
    const interval = setInterval(schedule, 90_000);
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
      stopRide();
      clearInterval(interval);
      state.remove();
      if (Platform.OS === 'web') {
        document.removeEventListener('visibilitychange', schedule);
        window.removeEventListener('online', schedule);
      }
    };
  }, []);
  return null;
}
