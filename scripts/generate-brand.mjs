// Editable vector geometry is shared by every native and repository asset.
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
const emerald = '#007F6D', ink = '#102C2B', mint = '#87E9CA';
const mark = (color = mint, arrow = '#FFFFFF') => `<path d="M296 366L476 674Q490 698 508 662L696 314" fill="none" stroke="${color}" stroke-width="82" stroke-linecap="round" stroke-linejoin="round"/><path d="M559 314H696V452" fill="none" stroke="${arrow}" stroke-width="82" stroke-linecap="round" stroke-linejoin="round"/><circle cx="296" cy="366" r="41" fill="${arrow}"/>`;
const svg = (body, w = 1024, h = w) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const icon = svg(`<rect width="1024" height="1024" fill="${emerald}"/>${mark()}`);
const transparent = svg(mark());
const mono = svg(mark('#FFFFFF', '#FFFFFF'));
await mkdir('assets/brand', { recursive: true });
await mkdir('docs/brand', { recursive: true });
async function asset(file, vector, size) {
  await writeFile(file.replace(/\.png$/, '.svg'), vector);
  await sharp(Buffer.from(vector)).resize(size, size).png().toFile(file);
}
await asset('assets/icon.png', icon, 1024);
await asset('assets/brand/icon-dark.png', svg(`<rect width="1024" height="1024" fill="${ink}"/>${mark()}`), 1024);
await asset('assets/brand/icon-tinted.png', svg(`<rect width="1024" height="1024" fill="#202020"/>${mark('#D6D6D6', '#FFFFFF')}`), 1024);
await asset('assets/android-icon-foreground.png', transparent, 1024);
await asset('assets/android-icon-monochrome.png', mono, 1024);
await asset('assets/android-icon-background.png', svg(`<rect width="1024" height="1024" fill="${emerald}"/>`), 1024);
await asset('assets/favicon.png', icon, 64);
await asset('assets/brand/mark.png', transparent, 256);
await asset('assets/brand/splash.png', transparent, 1024);
await asset('assets/brand/splash-light.png', svg(mark(emerald, emerald)), 1024);
// Route lines are original decorative artwork, not map/provider data.
function banner(w, h) {
  const scale = w / 1600;
  return svg(`<rect width="${w}" height="${h}" fill="${ink}"/><g transform="scale(${scale})"><g fill="none" stroke="#29534B" stroke-width="3"><path d="M950 -80V150Q950 220 1020 220H1610"/><path d="M840 -80V320Q840 370 890 370H1320Q1400 370 1400 450V1000"/><path d="M1200 -40V1000"/><path d="M0 640H900Q980 640 980 720V1000"/><path d="M1090 -40V1000"/></g><path d="M1080 700L1080 580Q1080 530 1130 530H1340Q1390 530 1390 480V330" fill="none" stroke="${mint}" stroke-width="10" stroke-linecap="round"/><circle cx="1080" cy="700" r="16" fill="${mint}"/><path d="M1368 349L1390 322L1412 349" fill="none" stroke="${mint}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><g transform="translate(64 102) scale(.19)">${mark()}</g><text x="64" y="${h / scale > 750 ? 448 : 338}" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="112" font-weight="700" letter-spacing="-6">Velunivo</text><text x="70" y="${h / scale > 750 ? 518 : 408}" fill="${mint}" font-family="Arial,Helvetica,sans-serif" font-size="40">Your route. Your riding speed.</text><text x="70" y="${h / scale > 750 ? 650 : 495}" fill="#B6CFC7" font-family="Arial,Helvetica,sans-serif" font-size="25">Navigation for e-scooters and e-bikes</text><text x="70" y="${h / scale > 750 ? 692 : 537}" fill="#B6CFC7" font-family="Arial,Helvetica,sans-serif" font-size="25">iPhone · iPad · Android · Web</text></g>`, w, h);
}
for (const [name, w, h] of [['banner', 1600, 900], ['social-preview', 1280, 640]]) {
  const vector = banner(w, h);
  await writeFile(`docs/brand/${name}.svg`, vector);
  await sharp(Buffer.from(vector)).png().toFile(`docs/brand/${name}.png`);
}
console.log('Generated native icons, transparent marks, splash artwork and GitHub banners.');
