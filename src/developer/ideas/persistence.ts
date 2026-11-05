// SPDX-License-Identifier: AGPL-3.0-only
import { Idea, ideasDocument, parseIdeas } from './model';
export const IDEAS_KEY = 'developer-ideas-v1';
/** Serialize read/modify/write operations; failed writes never replace the persisted collection. */
export function createIdeasStore(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<unknown>;
}) { let queue: Promise<unknown> = Promise.resolve(); const listeners = new Set<() => void>(); return { subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }, async read(): Promise<Idea[]> { await queue.catch(() => { }); const raw = await storage.getItem(IDEAS_KEY); return raw ? parseIdeas(raw).ideas : []; }, update(change: (ideas: Idea[]) => Idea[]) { const operation = queue.catch(() => { }).then(async () => { const raw = await storage.getItem(IDEAS_KEY); const result = change(raw ? parseIdeas(raw).ideas : []); const text = JSON.stringify(ideasDocument(result)); parseIdeas(text); await storage.setItem(IDEAS_KEY, text); for (const fn of listeners)
        fn(); return result; }); queue = operation; return operation; } }; }
