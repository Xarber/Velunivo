// SPDX-License-Identifier: AGPL-3.0-only
export const statuses = ['Pending', 'Approved', 'Deferred', 'In Progress', 'Implemented', 'Rejected'] as const;
export const categories = ['Feature', 'Improvement', 'Bug Fix', 'UI/UX', 'Performance', 'Other'] as const;
export type IdeaStatus = typeof statuses[number];
export interface IdeaReference {
    version: string;
    commit?: string;
    url?: string;
    verifiedAt: number;
}
export interface IdeaRevision {
    at: number;
    title: string;
    description: string;
    steps: string;
    category: typeof categories[number];
    priority: number;
    status: IdeaStatus;
    deleted: boolean;
    reference?: IdeaReference;
}
export interface Idea extends IdeaRevision {
    id: string;
    createdAt: number;
    history: IdeaRevision[];
}
export interface IdeasDocument {
    schema: 1;
    project: 'org.velunivo.app';
    application: 'Velunivo';
    exportedAt: number;
    ideas: Idea[];
}
export const MAX_IDEAS_BYTES = 5000000;
const fail = () => { throw new Error('Invalid ideas file.'); };
function revision(value: unknown): IdeaRevision {
    if (!value || typeof value !== 'object')
        return fail();
    const v = value as Record<string, unknown>;
    for (const [key, max] of [['title', 200], ['description', 20000], ['steps', 10000]] as const)
        if (typeof v[key] !== 'string' || v[key].length > max)
            return fail();
    if (!(v.title as string).trim() || !Number.isSafeInteger(v.at) || Number(v.at) < 0 || !categories.includes(v.category as never) || !statuses.includes(v.status as never) || !Number.isInteger(v.priority) || Number(v.priority) < 0 || Number(v.priority) > 3 || typeof v.deleted !== 'boolean')
        return fail();
    let reference: IdeaReference | undefined;
    if (v.reference !== undefined) {
        const r = v.reference as IdeaReference;
        if (!r || typeof r.version !== 'string' || r.version.length > 80 || !Number.isSafeInteger(r.verifiedAt) || r.verifiedAt < 0 || r.verifiedAt > Number(v.at) || r.commit !== undefined && (typeof r.commit !== 'string' || !/^[a-f0-9]{7,40}$/i.test(r.commit)) || r.url !== undefined && (typeof r.url !== 'string' || r.url.length > 1000 || !/^https:\/\//.test(r.url)))
            return fail();
        reference = { version: r.version, verifiedAt: r.verifiedAt, ...r.commit && { commit: r.commit }, ...r.url && { url: r.url } };
    }
    if (v.status === 'Implemented' && !reference)
        return fail();
    return { at: Number(v.at), title: (v.title as string).trim(), description: v.description as string, steps: v.steps as string, category: v.category as IdeaRevision['category'], priority: Number(v.priority), status: v.status as IdeaStatus, deleted: v.deleted, ...reference && { reference } };
}
export function parseIdeas(text: string): IdeasDocument {
    if (text.length > MAX_IDEAS_BYTES)
        return fail();
    let d: IdeasDocument;
    try {
        d = JSON.parse(text);
    }
    catch {
        return fail();
    }
    if (d?.schema !== 1 || d.project !== 'org.velunivo.app' || d.application !== 'Velunivo' || !Number.isSafeInteger(d.exportedAt) || d.exportedAt < 0 || !Array.isArray(d.ideas) || d.ideas.length > 2000)
        return fail();
    const ids = new Set<string>();
    const ideas = d.ideas.map(value => { const r = revision(value); if (typeof value.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value.id) || ids.has(value.id) || !Number.isSafeInteger(value.createdAt) || value.createdAt < 0 || value.createdAt > r.at || !Array.isArray(value.history) || value.history.length > 1000)
        return fail(); ids.add(value.id); const history = value.history.map(revision); if (history.some(h => h.at < value.createdAt || h.at > r.at))
        return fail(); return { ...r, id: value.id, createdAt: value.createdAt, history }; });
    return { schema: 1, project: 'org.velunivo.app', application: 'Velunivo', exportedAt: d.exportedAt, ideas };
}
export const ideasDocument = (ideas: Idea[], now = Date.now()): IdeasDocument => ({ schema: 1, project: 'org.velunivo.app', application: 'Velunivo', exportedAt: now, ideas });
export function reviseIdea(idea: Idea, changes: Partial<IdeaRevision>, now: number): Idea { const { id, createdAt, history, ...previous } = idea; return parseIdeas(JSON.stringify(ideasDocument([{ ...idea, ...changes, id, createdAt, at: Math.max(now, idea.at + 1), history: [...history, previous] }], now))).ideas[0]; }
export function reviewIdeas(local: Idea[], incoming: Idea[]) { const map = new Map(local.map(i => [i.id, i])); return incoming.map(idea => ({ idea, kind: !map.has(idea.id) ? 'new' : JSON.stringify(map.get(idea.id)) === JSON.stringify(idea) ? 'same' : 'conflict' } as const)); }
/** Explicit per-conflict choice. Preserve the losing full revision and history. */
export function mergeIdeas(local: Idea[], incoming: Idea[], accept: Set<string>): Idea[] { const map = new Map(local.map(i => [i.id, i])); for (const candidate of incoming) {
    const old = map.get(candidate.id);
    if (!old) {
        map.set(candidate.id, candidate);
        continue;
    }
    if (JSON.stringify(old) === JSON.stringify(candidate))
        continue;
    const chosen = accept.has(candidate.id) ? candidate : old, other = chosen === old ? candidate : old;
    const { id: _id, createdAt: _created, history, ...snapshot } = other;
    const revisions = [...chosen.history, ...history, snapshot];
    const unique = [...new Map(revisions.map(r => [JSON.stringify(r), r])).values()];
    map.set(candidate.id, { ...chosen, createdAt: Math.min(old.createdAt, candidate.createdAt), at: Math.max(old.at, candidate.at), history: unique });
} return parseIdeas(JSON.stringify(ideasDocument([...map.values()]))).ideas; }
export function ideasMarkdown(ideas: Idea[]) { return '# Velunivo ideas\n\n' + ideas.map(i => `## ${i.title.replace(/[\r\n]/g, ' ')}\n\n- ID: ${i.id}\n- Status: ${i.status}${i.deleted ? ' (deleted)' : ''}\n- Category: ${i.category}\n- Priority: ${i.priority}\n- Created: ${new Date(i.createdAt).toISOString()}\n- Updated: ${new Date(i.at).toISOString()}\n\n${i.description}\n\n${i.steps}\n${i.reference ? '\nRelease: ' + i.reference.version + ' ' + (i.reference.commit || '') : ''}\n`).join('\n'); }
