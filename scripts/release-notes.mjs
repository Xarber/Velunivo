import { conventionalChanges } from './conventional-changes.mjs';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const current = process.env.RELEASE_TAG || '';
const tags = execFileSync('git', ['tag', '--sort=-version:refname', '--list', 'v*'], { encoding: 'utf8' }).trim().split('\n');
let published;
try { published = JSON.parse(execFileSync('gh', ['release', 'list', '--limit', '100', '--json', 'tagName,isDraft'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })).filter(r => !r.isDraft).map(r => r.tagName); }
catch { console.warn('Published release lookup unavailable; release notes fall back to local version tags.'); }
const previous = (published || tags).find(t => /^v\d+\.\d+\.\d+$/.test(t) && t !== current);
const args = ['log', '--format=%H%x09%s', ...(previous ? [`${previous}..HEAD`] : [])];
const lines = execFileSync('git', args, { encoding: 'utf8' }).trim().split('\n');
const names = { feat: 'Features', fix: 'Fixes', perf: 'Performance', refactor: 'Refactoring', ci: 'Build and release', docs: 'Documentation', test: 'Verification', chore: 'Maintenance' };
const groups = new Map();
for (const line of lines) {
  const [sha, subject] = line.split('\t'); if (!subject) continue;
  for (const change of conventionalChanges(subject)) {
    const title = names[change.type] || 'Other changes';
    if (!groups.has(title)) groups.set(title, []);
    groups.get(title).push(`- ${change.text} (${sha.slice(0, 7)})`);
  }
}
let notes = `# ${current || 'Velunivo release'}\n\n`;
for (const [name, entries] of groups) notes += `## ${name}\n\n${entries.join('\n')}\n\n`;
notes += '## Installation\n\n- iPhone: unsigned IPA, intended for AltStore Classic or SideStore re-signing.\n- Simulator: .app.zip, not an IPA; requires an Apple Silicon Simulator.\n- Android: APK. Without configured signing secrets, the build uses Expo’s development signing key.\n- Web: web.zip; serve its contents with a static server.\n\nScheduled ETAs exclude traffic. Route eligibility is unverified. See README for provider setup and tested limitations.\n';
writeFileSync('release-notes.md', notes);
