// SPDX-License-Identifier: AGPL-3.0-only
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Idea, ideasDocument, ideasMarkdown, MAX_IDEAS_BYTES, parseIdeas } from './model';
export async function exportIdeas(ideas: Idea[], markdown = false) { const content = markdown ? ideasMarkdown(ideas) : JSON.stringify(ideasDocument(ideas), null, 2), name = 'velunivo-ideas.' + (markdown ? 'md' : 'json'), mime = markdown ? 'text/markdown' : 'application/json'; if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
} if (!await Sharing.isAvailableAsync())
    throw Error('Sharing is unavailable on this device.'); const file = new File(Paths.cache, name); file.create({ overwrite: true }); file.write(content); await Sharing.shareAsync(file.uri, { mimeType: mime }); }
export async function pickIdeas() { const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'], copyToCacheDirectory: true }); if (result.canceled)
    return null; const asset = result.assets[0]; if ((asset.size ?? 0) > MAX_IDEAS_BYTES)
    throw Error('Invalid ideas file.'); const text = Platform.OS === 'web' ? await (await fetch(asset.uri)).text() : await new File(asset.uri).text(); return parseIdeas(text); }
