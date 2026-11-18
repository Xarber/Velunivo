import { useEffect } from 'react';
import { syncSummaries } from '../services/accountSync.web';
import { subscribeRides } from '../services/rideHistory';

export default function AccountSyncWorker() {
  useEffect(() => {
    let running = false;
    let queued = false;
    let disposed = false;
    async function sync() {
      if (disposed || document.visibilityState !== 'visible' || !navigator.onLine) return;
      if (running) { queued = true; return; }
      running = true;
      try {
        await syncSummaries();
        if (!disposed) window.dispatchEvent(new Event('velunivo-account-updated'));
      } catch {
        // A later foreground, ride or network event retries without changing local rides.
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
    const unsubscribe = subscribeRides(schedule);
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('online', schedule);
    window.addEventListener('velunivo-account-sync', schedule);
    schedule();
    return () => {
      disposed = true;
      clearTimeout(timer);
      unsubscribe();
      document.removeEventListener('visibilitychange', schedule);
      window.removeEventListener('online', schedule);
      window.removeEventListener('velunivo-account-sync', schedule);
    };
  }, []);
  return null;
}
