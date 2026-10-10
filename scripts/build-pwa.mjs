import fs from 'node:fs/promises';import crypto from 'node:crypto';
const dir=process.argv[2] || 'dist',html=await fs.readFile(`${dir}/index.html`,'utf8');
const version=crypto.createHash('sha256').update(html).digest('hex').slice(0,16);
const worker=await fs.readFile('public/sw.js','utf8');await fs.writeFile(`${dir}/sw.js`,worker.replace('__BUILD__',version));
console.log(`PWA shell cache: ${version}`);

// Absolute sharing metadata is filled only when the deployment origin is known.
const origin=process.env.WEB_PUBLIC_ORIGIN;
if(origin){const url=new URL(origin);if(url.protocol!=='https:' || url.pathname!=='/' || url.search || url.hash || url.username || url.password)throw new Error('WEB_PUBLIC_ORIGIN must be an HTTPS origin');const escaped=url.origin.replaceAll('&','&amp;').replaceAll('"','&quot;');const page=html.replaceAll('content="/pwa/social-preview.png"',`content="${escaped}/pwa/social-preview.png"`).replace('</head>',`<link rel="canonical" href="${escaped}/" /><meta property="og:url" content="${escaped}/" /></head>`);await fs.writeFile(`${dir}/index.html`,page);}
