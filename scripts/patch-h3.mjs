import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const originalDecoder = 'var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;';
export const compatibleDecoder = 'var UTF16Decoder; /* VELUNIVO_H3_OPTIONAL_UTF16 */\n  try { UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined; } catch (_) { /* Hermes may only support UTF-8. H3 does not use this optional decoder. */ }';
export function patchH3Source(source) {
  if (source.includes(compatibleDecoder)) return source;
  if (source.split(originalDecoder).length !== 2) throw new Error('H3 decoder source changed; review the native compatibility patch.');
  return source.replace(originalDecoder, compatibleDecoder);
}
export function applyH3Patch(directory = root) {
  const folder = path.join(directory, 'node_modules/h3-js');
  const version = JSON.parse(fs.readFileSync(path.join(folder, 'package.json'), 'utf8')).version;
  if (version !== '4.5.0') throw new Error(`Review H3 decoder compatibility for version ${version}`);
  for (const entry of ['dist/h3-js.js', 'dist/h3-js.es.js', 'dist/browser/h3-js.js', 'dist/browser/h3-js.es.js']) {
    const file = path.join(folder, entry);
    fs.writeFileSync(file, patchH3Source(fs.readFileSync(file, 'utf8')));
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) applyH3Patch();
