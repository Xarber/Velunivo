# Developer Ideas

Developer Options → Ideas is a local-first notebook for features, improvements, bugs, UI/UX, performance and other observations. Titles, descriptions and reproduction steps are searchable. Categories, status, priority and creation/update ordering organize the list. Select multiple rows for export, deferral, soft deletion or restoration. Details reveal the edit history. Duplication creates a new identifier and Pending status. Editing/reopening keeps earlier content and statuses.

## Modules and storage

`src/developer/ideas/model.ts` validates and transforms the portable model. `persistence.ts` serializes transactional read/modify/write operations against an injected key-value adapter; `store.ts` supplies AsyncStorage and subscriptions. The UI uses existing Settings, controls, keyboard scrolling and developer gating. `files.ts` reuses Expo DocumentPicker/File/Sharing APIs from installed SDK 57. Supported app languages are English, Italian, Spanish, French, German and Portuguese.

Single atomic storage value `developer-ideas-v1` stores schema 1. Ordinary app updates never remove it. Explicit confirmed Clear all app data removes it. Corrupt data produces an error instead of replacing it with an empty collection. A failed write leaves the saved collection intact. This collection is deliberately excluded from ordinary backups, peer sync, public release bundles and public source metadata to avoid publishing private notes. Storage remains on-device; no GitHub token, server or permission is needed to record ideas.

## Interchange and conflicts

JSON fields: `schema:1`, `application:"Velunivo"`, `project:"org.velunivo.app"`, `exportedAt`, `ideas`. Each idea has a stable UUID, `createdAt`, modification time `at`, `title`, `description`, `steps`, `category`, integer `priority` 0–3, `status`, `deleted`, and `history` of earlier revisions. Optional `reference` contains release version, commit, HTTPS URL and `verifiedAt`. Implemented status requires a reference; the UI also requires the user to confirm verification. This is an attestation, not automatic proof that code works. Source timestamps survive export/import. JSON is authoritative; Markdown and platform sharing provide readable text.

Limits: 5 million text characters (picker rejects files over 5 MB), 2,000 entries, 1,000 history entries per idea, title 200 characters, description 20,000, steps 10,000. Invalid schemas/project identities, duplicate IDs, invalid enums/times, unsafe links and oversized collections are rejected before persistence. Version 1 is the first format; no earlier Ideas schema exists to migrate.

Imports show incoming entries and conflicts before confirmation. Existing versions win by default; a switch explicitly accepts each incoming replacement. Unselected new entries are skipped. A conflict preserves both versions in history, including when local content wins. Deletion is a reversible tombstone; imports do not erase existing entries or silently remove them. Repeated imports retain one stable record per ID and deduplicate identical history revisions. Merge modification time is the maximum of the source versions, never import wall-clock time.

## Agent workflow and privacy

Read `docs/IDEAS.json` at session start. It contains the already-public section-35 implementation task; private on-device ideas have not been retrieved. `tsx scripts/ideas.ts list` reports counts. The one-action app export can be passed to an agent and reviewed with `tsx scripts/ideas.ts import FILE`; no file is written in preview mode. `--apply` adds entries locally while keeping local conflicts; `--accept=ID` chooses incoming conflicts. Review the diff and remove private information before publishing. This public repository is not an authorized destination for private ideas merely because an export was provided. No automatic retrieval/sync is claimed.

Ask which unrelated ideas to implement now or later. Preserve deferred/unselected work. Explicitly requested tasks need no redundant approval. Mark an idea Implemented only after relevant verification and record its version, commit and verification time. Associate structured release entries using `ideaIds`; include `Idea: ID` in commit bodies so the existing generated developer changelog preserves the link. Only verified completed features belong in release highlights. The UI offers a changelog link only when the referenced version exists in release history. Native builds/OTA delivery remain governed by existing runtime and channel restrictions.

## Validation boundaries

Unit tests cover validation, lossless interchange, statuses/reopening, deletion, merge conflicts/idempotence, serialized persistence, failed writes and corrupt storage. Browser and native UI testing must be reported separately. No simulator, SDK installation, private repository upload or production service change is required by this feature. Existing governance gaps remain listed in `docs/reports/STANDARDS_ADOPTION.md`; adding Ideas is not a certification that every universal requirement is fulfilled.

`docs/IDEAS_REVIEW.json` stores the last explicit agent review time. `list` also reports new/updated ideas since that time. Run `tsx scripts/ideas.ts review` only after reviewing the collection; it changes no idea status. Repository review times do not imply that private device collections were accessed.
