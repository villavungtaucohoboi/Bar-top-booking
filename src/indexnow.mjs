// Báo cho Bing, Yandex và các công cụ dùng IndexNow biết trang nào mới hoặc vừa đổi.
// Dùng: node src/indexnow.mjs all        → gửi toàn bộ trang trong sitemap
//       node src/indexnow.mjs file1 ...   → gửi các file html đã đổi (đường dẫn trong repo)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config.json'), 'utf8'));
const SITE = CFG.siteUrl.replace(/\/$/, '');
const keyFile = fs.readdirSync(path.join(ROOT, 'public')).find(f => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) { console.log('Chưa có file khoá IndexNow, bỏ qua.'); process.exit(0); }
const key = keyFile.replace('.txt', '');
const args = process.argv.slice(2);
let urls = [];
if (args[0] === 'all') {
  const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
} else {
  for (const f of args) {
    if (!/\.html$/.test(f) || /^(404|quan-ly|viet-bai|mau-bia|huy-hieu\/x)/.test(f)) continue;
    const dir = f.replace(/index\.html$/, '').replace(/^\.\//, '');
    if (f === '404.html') continue;
    urls.push(`${SITE}/${dir}`);
  }
}
urls = [...new Set(urls)].filter(u => !/\/(quan-ly|viet-bai|mau-bia)\//.test(u));
if (!urls.length) { console.log('Không có URL cần gửi.'); process.exit(0); }
const host = new URL(SITE).host;
for (let i = 0; i < urls.length; i += 100) {
  const chunk = urls.slice(i, i + 100);
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation: `${SITE}/${keyFile}`, urlList: chunk }),
  });
  console.log(`IndexNow: gửi ${chunk.length} URL → HTTP ${r.status}`);
}
