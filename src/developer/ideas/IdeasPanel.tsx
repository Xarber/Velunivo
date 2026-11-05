// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useState } from 'react';
import { View, TextInput, Switch, Share } from 'react-native';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { releaseHighlights } from '../../core/appIntroduction';
import { Ionicons } from '@expo/vector-icons';
import Text from '../../components/LocalizedText';
import { Button, IconButton, styles, usePalette } from '../../components/ui';
import { t } from '../../i18n/core';
import { Idea, IdeaStatus, IdeaRevision, categories, statuses, reviseIdea, reviewIdeas, mergeIdeas, ideasMarkdown } from './model';
import { ideasStore } from './store';
import { exportIdeas, pickIdeas } from './files';
const icons: Record<string, keyof typeof Ionicons.glyphMap> = { 'Feature': 'sparkles-outline', 'Improvement': 'build-outline', 'Bug Fix': 'bug-outline', 'UI/UX': 'color-palette-outline', 'Performance': 'speedometer-outline', 'Other': 'bulb-outline' };
const blank = (id: string): Idea => ({ id, createdAt: Date.now(), at: Date.now(), title: '', description: '', steps: '', category: 'Feature', priority: 0, status: 'Pending', deleted: false, history: [] });
export default function IdeasPanel() {
    const [visible, setVisible] = useState(50), [historyVisible, setHistoryVisible] = useState(20);
    const p = usePalette(), [ideas, setIdeas] = useState<Idea[]>([]), [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [query, setQuery] = useState(''), [filter, setFilter] = useState<IdeaStatus | null>(null), [category, setCategory] = useState<Idea['category'] | null>(null), [sort, setSort] = useState<'updated' | 'priority' | 'created'>('updated'), [deleted, setDeleted] = useState(false), [selected, setSelected] = useState<Set<string>>(new Set()), [edit, setEdit] = useState<Idea | null>(null), [expanded, setExpanded] = useState<string | null>(null), [incoming, setIncoming] = useState<Idea[] | null>(null), [accept, setAccept] = useState<Set<string>>(new Set()), [verify, setVerify] = useState(false), [version, setVersion] = useState(''), [commit, setCommit] = useState('');
    useEffect(() => { let live = true; const load = () => void ideasStore.read().then(items => { if (live) {
        setIdeas(items);
        setReady(true);
    } }).catch(() => { if (live)
        setMessage('Ideas could not be loaded.'); }); load(); const remove = ideasStore.subscribe(load); return () => { live = false; remove(); }; }, []);
    async function run(task: () => Promise<unknown>) { if (busy)
        return; setBusy(true); setMessage(''); try {
        await task();
    }
    catch {
        setMessage('Could not save or transfer ideas. Your existing ideas are preserved.');
    }
    finally {
        setBusy(false);
    } }
    const field = (label: string, value: string, onChangeText: (value: string) => void, multiline = false) => <TextInput accessibilityLabel={t(label)} editable={!busy} placeholder={t(label)} placeholderTextColor={p.muted} value={value} onChangeText={onChangeText} multiline={multiline} maxLength={multiline ? 20000 : 200} style={{ padding: 12, borderRadius: 12, backgroundColor: p.bg, color: p.text, minHeight: multiline ? 90 : 44 }}/>;
    const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => set(current => { const next = new Set(current); if (next.has(id))
        next.delete(id);
    else
        next.add(id); return next; });
    function startEdit(idea: Idea) { setEdit(idea); setVerify(false); setVersion(idea.reference?.version || ''); setCommit(idea.reference?.commit || ''); }
    async function save() { if (!edit || !edit.title.trim() || (edit.status === 'Implemented' && (!verify || !version.trim())))
        return; await ideasStore.update(items => { const existing = items.find(i => i.id === edit.id), reference = edit.status === 'Implemented' ? { version: version.trim(), ...commit.trim() && { commit: commit.trim() }, verifiedAt: Date.now() } : edit.reference; const next = existing ? reviseIdea(existing, { ...edit, reference }, Date.now()) : { ...edit, reference, at: Date.now() }; return existing ? items.map(i => i.id === edit.id ? next : i) : [next, ...items]; }); setEdit(null); }
    const list = ideas.filter(i => i.deleted === deleted && (!filter || i.status === filter) && (!category || i.category === category) && (`${i.title} ${i.description} ${i.steps}`.toLowerCase().includes(query.toLowerCase()))).sort((a, b) => sort === 'priority' ? b.priority - a.priority || b.at - a.at : sort === 'created' ? b.createdAt - a.createdAt : b.at - a.at);
    const batch = (change: Partial<IdeaRevision>) => run(async () => { await ideasStore.update(items => items.map(i => selected.has(i.id) ? reviseIdea(i, change, Date.now()) : i)); setSelected(new Set()); });
    return <View style={{ gap: 16 }}>
  <Text style={{ color: p.muted }}>Private, offline notes for your next development session. Export them to share with your coding agent.</Text>
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{statuses.slice(0, 3).map(s => <Text key={s} style={{ color: p.muted }}>{t(s)}: {ideas.filter(i => !i.deleted && i.status === s).length}</Text>)}</View>
  <Button title={t('New idea')} icon="add-outline" disabled={!ready || busy} onPress={() => startEdit(blank(Crypto.randomUUID()))}/>
  {edit && <View style={[styles.card, { backgroundColor: p.card, gap: 12 }]}>
   {field('Idea title', edit.title, title => setEdit({ ...edit, title }))}{field('Description', edit.description, description => setEdit({ ...edit, description }), true)}{field('Reproduction steps', edit.steps, steps => setEdit({ ...edit, steps }), true)}
   <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{categories.map(c => <Button key={c} title={t(c)} icon={icons[c]} secondary={edit.category !== c} disabled={busy} onPress={() => setEdit({ ...edit, category: c })}/>)}</View>
   <Button title={`${t('Priority')}: ${edit.priority}`} secondary disabled={busy} onPress={() => setEdit({ ...edit, priority: (edit.priority + 1) % 4 })}/>
   <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{statuses.map(s => <Button key={s} title={t(s)} secondary={edit.status !== s} disabled={busy} onPress={() => setEdit({ ...edit, status: s })}/>)}</View>
   {edit.status === 'Implemented' && <>{field('Release version', version, setVersion)}{field('Commit hash (optional)', commit, setCommit)}<View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><Text style={{ color: p.text, flex: 1 }}>Implementation has been verified</Text><Switch accessibilityLabel={t('Implementation has been verified')} value={verify} onValueChange={setVerify}/></View></>}
   <Button title={t('Save idea')} icon="checkmark-outline" loading={busy} disabled={busy || !edit.title.trim() || edit.status === 'Implemented' && (!verify || !version.trim())} onPress={() => void run(save)}/><Button title={t('Cancel')} secondary disabled={busy} onPress={() => setEdit(null)}/>
  </View>}
  {field('Search ideas', query, setQuery)}
  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}><Button title={filter ? t(filter) : t('All statuses')} secondary onPress={() => setFilter(filter === null ? statuses[0] : statuses[statuses.indexOf(filter) + 1] || null)}/><Button title={category ? t(category) : t('All categories')} secondary onPress={() => setCategory(category === null ? categories[0] : categories[categories.indexOf(category) + 1] || null)}/><Button title={t(sort === 'updated' ? 'Recently updated' : sort === 'priority' ? 'Priority' : 'Recently created')} secondary onPress={() => setSort(sort === 'updated' ? 'priority' : sort === 'priority' ? 'created' : 'updated')}/><Button title={t(deleted ? 'Show active ideas' : 'Show deleted ideas')} secondary onPress={() => { setDeleted(!deleted); setSelected(new Set()); }}/></View>
  {selected.size > 0 && <View style={[styles.card, { backgroundColor: p.card, gap: 8 }]}><Text style={{ color: p.text }}>{selected.size} {t('selected')}</Text><Button title={t('Export selected')} icon="share-outline" disabled={busy} onPress={() => void run(() => exportIdeas(ideas.filter(i => selected.has(i.id))))}/><Button title={t('Defer selected')} secondary disabled={busy} onPress={() => void batch({ status: 'Deferred' })}/><Button title={t(deleted ? 'Restore selected' : 'Delete selected')} icon="trash-outline" secondary disabled={busy} onPress={() => void batch({ deleted: !deleted })}/><Button title={t('Clear selection')} secondary onPress={() => setSelected(new Set())}/></View>}
  {!list.length && ready && <Text style={{ color: p.muted }}>No matching ideas.</Text>}
  {list.slice(0, visible).map(idea => <View key={idea.id} style={[styles.card, { backgroundColor: p.card, gap: 10 }]}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Ionicons name={icons[idea.category]} size={22} color={p.accent}/><View style={{ flex: 1 }}><Text translate={false} numberOfLines={2} style={{ color: p.text, fontWeight: '700' }}>{idea.title}</Text><Text style={{ color: p.muted, fontSize: 12 }}>{t(idea.status)} · {t(idea.category)} · {t('Priority')} {idea.priority}</Text></View><Switch accessibilityLabel={`${t('Select idea')}: ${idea.title}`} value={selected.has(idea.id)} disabled={busy} onValueChange={() => toggle(setSelected, idea.id)}/></View><Text translate={false} numberOfLines={expanded === idea.id ? undefined : 2} style={{ color: p.muted }}>{idea.description}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}><Button title={t(expanded === idea.id ? 'Show less' : 'Details')} secondary onPress={() => {setExpanded(expanded === idea.id ? null : idea.id);setHistoryVisible(20);}}/><IconButton icon="create-outline" label={t('Edit')} disabled={busy} onPress={() => startEdit(idea)}/><IconButton icon="copy-outline" label={t('Duplicate idea')} disabled={busy} onPress={() => void run(() => ideasStore.update(items => [{ ...idea, id: Crypto.randomUUID(), createdAt: Date.now(), at: Date.now(), status: 'Pending', deleted: false, reference: undefined, history: [] }, ...items]))}/><IconButton icon="share-outline" label={t('Share idea')} disabled={busy} onPress={() => void run(() => Share.share({ message: ideasMarkdown([idea]) }))}/></View>
   {expanded === idea.id && <><Text translate={false} style={{ color: p.muted }}>{idea.steps}</Text><Text translate={false} style={{ color: p.muted, fontSize: 12 }}>{new Date(idea.createdAt).toLocaleString()} → {new Date(idea.at).toLocaleString()}</Text>{idea.reference && releaseHighlights.some(r => r.version === idea.reference!.version) && <Button title={t('View changelog')} secondary onPress={() => router.push({ pathname: '/settings/changelog/[version]', params: { version: idea.reference!.version } })}/>}<Text style={{ color: p.text, fontWeight: '700' }}>History</Text>{idea.history.length>historyVisible&&<Button title={t('Show more')} secondary onPress={()=>setHistoryVisible(historyVisible+20)}/>}
                        {idea.history.slice().reverse().slice(0, historyVisible).map((h, index) => <View key={index} style={{ gap: 4 }}><Text translate={false} style={{ color: p.muted, fontSize: 12 }}>{new Date(h.at).toLocaleString()} · {t(h.status)} · {h.title}</Text><Text translate={false} style={{ color: p.muted, fontSize: 12 }}>{h.description}{h.steps ? '\n' + h.steps : ''}</Text></View>)}</>}
  </View>)}
  {list.length>visible&&<Button title={t('Show more')} secondary onPress={()=>setVisible(visible+50)}/>}
        <Button title={t('Export ideas JSON')} icon="download-outline" disabled={!ready || busy} onPress={() => void run(() => exportIdeas(ideas))}/><Button title={t('Export ideas Markdown')} icon="document-text-outline" secondary disabled={!ready || busy} onPress={() => void run(() => exportIdeas(ideas, true))}/><Button title={t('Import ideas')} icon="push-outline" secondary disabled={!ready || busy} onPress={() => void run(async () => { const d = await pickIdeas(); if (d) {
        setIncoming(d.ideas);
        setAccept(new Set(reviewIdeas(ideas, d.ideas).filter(r => r.kind === 'new').map(r => r.idea.id)));
    } })}/>
  {incoming && <View style={[styles.card, { backgroundColor: p.card, gap: 12 }]}><Text style={{ color: p.text, fontWeight: '700' }}>Review incoming ideas</Text><Text style={{ color: p.muted }}>Select additions or replacements. Conflicting versions are preserved in history. Nothing is deleted automatically.</Text>{reviewIdeas(ideas, incoming).map(({ idea, kind }) => <View key={idea.id} style={{ gap: 6 }}><Text translate={false} style={{ color: p.text, fontWeight: '600' }}>{idea.title} · {t(kind === 'new' ? 'New' : kind === 'same' ? 'Unchanged' : 'Conflict')}</Text><Text translate={false} style={{ color: p.muted }}>{idea.description}{idea.steps ? '\n' + idea.steps : ''}</Text><Text translate={false} style={{ color: p.muted, fontSize: 12 }}>{new Date(idea.at).toLocaleString()}{idea.deleted ? ' · ' + t('Show deleted ideas') : ''}</Text><Text style={{ color: p.muted }}>{t(idea.status)} · {t(idea.category)}</Text>{kind === 'conflict' && <Text translate={false} style={{ color: p.muted }}>{t('Current idea')}: {ideas.find(i => i.id === idea.id)?.description}</Text>}{kind !== 'same' && <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><Text style={{ color: p.text, flex: 1 }}>{t('Use imported version')}</Text><Switch accessibilityLabel={`${t('Use imported version')}: ${idea.title}`} value={accept.has(idea.id)} onValueChange={() => toggle(setAccept, idea.id)} disabled={busy}/></View>}</View>)}<Button title={t('Confirm import')} disabled={busy} loading={busy} onPress={() => void run(async () => { await ideasStore.update(current => mergeIdeas(current, incoming.filter(i => current.some(x => x.id === i.id) || accept.has(i.id)), accept)); setIncoming(null); setMessage('Ideas imported.'); })}/><Button title={t('Cancel')} secondary disabled={busy} onPress={() => setIncoming(null)}/></View>}
  {!!message && <Text style={{ color: p.muted }}>{message}</Text>}
 </View>;
}
