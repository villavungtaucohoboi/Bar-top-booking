// TopChill – bộ build trang tĩnh chuẩn SEO. Không cần cài thư viện: `node src/build.mjs`
// Nguồn: src/app.html (app + dữ liệu bar), src/seo-data.mjs (nội dung thành phố), content/blog/*.md (bài viết)
// Đầu ra: thư mục gốc repo (GitHub Pages phục vụ trực tiếp).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { barStory, TYPE, COMMON_TIPS } from './bar-story.mjs';
import { CITY_SEO } from './seo-data.mjs';
import { LOGO } from './logo.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Thư mục đầu ra: mặc định gốc repo (GitHub Pages). Cloudflare Pages dùng OUT_DIR=dist để chỉ đưa bản build lên, không kèm mã nguồn.
const OUT = process.env.OUT_DIR ? path.resolve(ROOT, process.env.OUT_DIR) : ROOT;
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config.json'), 'utf8'));
const SITE = CFG.siteUrl.replace(/\/$/, '');
const BASE = CFG.basePath.endsWith('/') ? CFG.basePath : CFG.basePath + '/';
const INDEX = !!CFG.allowIndexing;
const TODAY = new Date().toISOString().slice(0, 10);
const GENERATED = []; // các thư mục/tệp do build sinh ra (để dọn sạch khi build lại)

/* ---------- tiện ích ---------- */
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd')
  .toLowerCase().replace(/&/g, ' va ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const fmt = n => Number(n).toLocaleString('vi-VN');
const url = p => SITE + '/' + p.replace(/^\//, '');          // URL tuyệt đối
const href = p => BASE + p.replace(/^\//, '');              // đường dẫn trong site
const UNS = (id, w) => /^(https?:|\/)/.test(id) ? id : `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w || 800}&q=70`;
function write(rel, html) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
  GENERATED.push(rel);
}
const clip = (s, n) => { s = String(s).replace(/\s+/g, ' ').trim(); if (s.length <= n) return s; const c = s.slice(0, n - 1); return c.slice(0, c.lastIndexOf(' ')).replace(/[,.;:–-]+$/, '') + '…'; };
const fmtDate = d => { const [y, m, dd] = String(d).split('-'); return `${dd}/${m}/${y}`; };

/* ---------- 1. Dữ liệu từ app ---------- */
/* Dữ liệu bar, khuyến mãi, dải tin: content/data.json (sửa bằng trang /quan-ly/) */
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/data.json'), 'utf8'));
const TODAY_ISO = new Date().toISOString().slice(0, 10);
const LIVE_BARS = DATA.bars.filter(b => !b.hidden).map(b => {
  const x = { ...b };
  if (x.promoUntil && x.promoUntil < TODAY_ISO) { x.bonus = 'Ưu đãi mới đang cập nhật, chat tổng đài để hỏi'; x.bonusNote = ''; }
  x.images = (x.images || []).map(p => p.startsWith('/') ? (CFG.basePath.replace(/\/$/, '') + p) : p);
  return x;
});
let APP = fs.readFileSync(path.join(ROOT, 'src/app.html'), 'utf8');
{ const a = APP.indexOf('const BARS=['), z = APP.indexOf('\n];\n', a);
  if (a < 0 || z < 0) throw new Error('Không tìm thấy BARS trong app.html');
  APP = APP.slice(0, a) + 'const BARS=' + JSON.stringify(LIVE_BARS) + ';' + APP.slice(z + 3);
  { const BK = CFG.web3formsKey ? { kind: 'w3f', url: 'https://api.web3forms.com/submit', key: CFG.web3formsKey }
      : CFG.bookingEndpoint ? { kind: 'url', url: CFG.bookingEndpoint }
      : CFG.bookingEmail ? { kind: 'fs', url: 'https://formsubmit.co/ajax/' + CFG.bookingEmail } : null;
    APP = APP.replace("const BOOKING=null;", 'const BOOKING=' + JSON.stringify(BK) + ';'); }
  APP = APP.replace(/const CONTACT=\{[^}]*\};/, 'const CONTACT=' + JSON.stringify({ tel: CFG.hotline.replace(/\s/g, ''), show: CFG.hotline, zalo: CFG.zalo || CFG.hotline.replace(/\s/g, ''), tg: CFG.telegram || '', tgUser: (CFG.telegramUser || '').replace(/^@/, '') }) + ';');
  APP = APP.replace('const TICKER=[];', 'const TICKER=' + JSON.stringify(DATA.ticker || []).replace(/</g, '\\u003c') + ';'); }
function grab(start, end) {
  const a = APP.indexOf(start); const b = APP.indexOf(end, a);
  if (a < 0 || b < 0) throw new Error('Không tìm thấy dữ liệu: ' + start);
  return APP.slice(a, b);
}
const ctx = {};
vm.createContext(ctx);
vm.runInContext(
  grab('const CITIES=[', 'const cityName') +
  grab('const BARS=[', 'const pad=') +
  grab('const MENU={', 'const REVIEWERS') +
  grab('const POOL={', 'function imgTag') +
  ';this.out={CITIES,BARS,MENU,POOL,TYPE_POOL,CITY_IMG};', ctx);
const { CITIES, BARS, MENU, POOL, TYPE_POOL, CITY_IMG } = ctx.out;
const pad = n => String(n).padStart(2, '0');
const P = b => b.partner !== false;
const hoursTxt = b => b.hoursKnown === false ? 'Liên hệ tổng đài' : b.hours;
const priceTxtS = b => b.priceKnown === false ? 'Giá: liên hệ' : `${b.price[0]}k–${b.price[1]}k/người`;
for (const b of BARS) {
  if (!P(b)) { b.deal = 0; b.gpct = 0; b.bonus = ''; b.rating = null; b.reviews = 0; }
  const o = +b.hours.slice(0, 2); let c = +b.hours.slice(8, 10); if (c <= o) c += 24;
  b.gLabel = `${pad(o)}:00–${pad((o + 2) % 24)}:00`;
  b.slug = slugify(b.name);
  b.path = `bar/${b.slug}/`;
}
for (const c of CITIES) { c.n = BARS.filter(b => b.city === c.id).length; c.slug = 'bar-' + slugify(c.name); c.path = c.slug + '/'; c.seo = CITY_SEO[c.id] || {}; }
const cityOf = id => CITIES.find(c => c.id === id);
for (const b of BARS) if (BARS.some(x => x !== b && slugify(x.name) === slugify(b.name))) { b.slug = slugify(b.name) + '-' + slugify(cityOf(b.city).name); b.path = `bar/${b.slug}/`; }
APP = APP.replace('const SLUGS={};', 'const SLUGS=' + JSON.stringify(Object.fromEntries(BARS.map(b => [b.id, b.slug]))) + ';');
const rankOrder = { top: 0, hot: 1, null: 2 };
const pinOf = b => b.pin || 999;
const ranked = list => list.slice().sort((a, b) => (pinOf(a) - pinOf(b)) || (rankOrder[a.boost] - rankOrder[b.boost]) || (P(b) - P(a)) || (b.rating || 0) - (a.rating || 0));
const TYPE_SLUG = { 'Rooftop': 'rooftop-bar', 'Club': 'club', 'Pub': 'pub', 'Lounge': 'lounge', 'Cocktail bar': 'cocktail-bar', 'Jazz bar': 'jazz-bar', 'Whisky bar': 'whisky-bar', 'Beach club': 'beach-club', 'Garden bar': 'garden-bar' };
const typeName = t => { const l = (TYPE[t] || {}).label || t.toLowerCase(); return l.charAt(0).toUpperCase() + l.slice(1); };
const LAND = {};   // `${city}|${type}` -> { path, name, type, city, bars }
for (const c of CITIES) {
  const types = [...new Set(BARS.filter(b => b.city === c.id).map(b => b.type))];
  for (const t of types) {
    const list = ranked(BARS.filter(b => b.city === c.id && b.type === t));
    if (list.length >= 2 && TYPE_SLUG[t]) LAND[c.id + '|' + t] = { path: `${TYPE_SLUG[t]}-${slugify(c.name)}/`, name: `${typeName(t)} ${c.name}`, type: t, city: c.id, bars: list };
  }
}
// Trang theo khu vực (bar Hoàn Kiếm, bar Bãi Cháy...): chỉ tạo khi khu có từ 3 quán trở lên
const AREA_DEF = [
  ['hn', 'hoan-kiem', 'Hoàn Kiếm', 'Hoàn Kiếm', 'Khu phố cổ và quanh hồ Hoàn Kiếm là nơi tập trung nhiều sky bar, cocktail bar kín đáo và club của Hà Nội. Các quán nằm gần nhau nên bạn dễ đi bộ ghé vài nơi trong một tối.'],
  ['hn', 'ba-dinh', 'Ba Đình', 'Ba Đình|Trúc Bạch', 'Ba Đình có phố Yên Phụ ven hồ, khu Trúc Bạch và các khách sạn cao tầng, nơi có nhiều club lớn, rooftop và quán bia thủ công.'],
  ['hn', 'yen-phu', 'Yên Phụ', 'Yên Phụ', 'Phố Yên Phụ thuộc quận Ba Đình, chạy dọc ven hồ, là nơi tập trung một số club lớn của Hà Nội. Các club nằm cùng một tuyến phố nên dễ di chuyển giữa các quán.'],
  ['sg', 'quan-1', 'Quận 1', 'Quận 1|Q1|Bến Nghé|Bến Thành', 'Quận 1 là trung tâm Sài Gòn, nơi tập trung rooftop khách sạn, cocktail bar và speakeasy, nhiều quán nằm gần phố đi bộ Nguyễn Huệ và chợ Bến Thành.'],
  ['dn', 'hai-chau', 'Hải Châu', 'Hải Châu', 'Hải Châu là quận trung tâm Đà Nẵng ven sông Hàn, có rooftop nhìn ra sông và cầu, cùng nhiều quán cocktail, pub trong phố.'],
  ['dn', 'my-khe', 'Mỹ Khê (Võ Nguyên Giáp)', 'Võ Nguyên Giáp|Mỹ Khê', 'Đường Võ Nguyên Giáp chạy dọc biển Mỹ Khê, nơi có rooftop khách sạn cao tầng và beach bar nhìn thẳng ra biển.'],
  ['dn', 'an-thuong', 'An Thượng', 'An Thượng', 'An Thượng là khu phố Tây gần biển Mỹ Khê, quận Ngũ Hành Sơn, có nhiều quán nhỏ, cocktail bar và beach club.'],
  ['dl', 'truong-cong-dinh', 'Trương Công Định', 'Trương Công Định', 'Trương Công Định là con phố về đêm sôi động ở trung tâm Đà Lạt, gần chợ Đà Lạt, có nhiều quán cocktail và pub nằm sát nhau.'],
  ['nt', 'tran-phu-nha-trang', 'Trần Phú (Nha Trang)', 'Trần Phú', 'Trần Phú là đường ven biển chính của Nha Trang, nơi tập trung rooftop khách sạn, beach club và club lớn.'],
  ['nt', 'pho-tay-nha-trang', 'phố Tây Nha Trang', 'Nguyễn Thiện Thuật|Trần Quang Khải|Biệt Thự', 'Phố Tây Nha Trang quanh Nguyễn Thiện Thuật, Trần Quang Khải, gần biển Trần Phú, có nhiều pub và bar mở khuya.'],
  ['pq', 'duong-dong', 'Dương Đông', 'Dương Đông', 'Dương Đông là trung tâm đảo Phú Quốc, dọc đường Trần Hưng Đạo có pub, cocktail bar và beach bar.'],
  ['pq', 'bai-truong', 'Bãi Trường', 'Bãi Trường|Dương Tơ', 'Bãi Trường là bờ biển phía tây nam Phú Quốc, có nhiều resort, beach club và rooftop ngắm hoàng hôn.'],
  ['ql', 'bai-chay', 'Bãi Cháy', 'Bãi Cháy|Sun World', 'Bãi Cháy là khu du lịch chính của Hạ Long với bãi tắm, phố cổ Sun World và khách sạn ven vịnh, nơi tập trung club, pub và beach club.'],
  ['ql', 'hong-gai', 'Hồng Gai', 'Hồng Gai', 'Hồng Gai nằm phía bên kia cầu Bãi Cháy, yên tĩnh hơn khu du lịch, có quán cocktail nhỏ và rooftop khách sạn.'],
  ['vt', 'bai-sau', 'Bãi Sau', 'Bãi Sau|Thùy Vân|Thắng Tam', 'Bãi Sau là bãi biển dài dọc đường Thùy Vân, Vũng Tàu, có beach bar, pub và rooftop khách sạn.'],
  ['vt', 'bai-truoc', 'Bãi Trước', 'Bãi Trước|Hạ Long|Quang Trung|Lý Tự Trọng|Phường 1|Phường 2', 'Bãi Trước là khu trung tâm Vũng Tàu dọc đường Hạ Long, Quang Trung, có pub, cocktail bar và quán nhạc sống.'],
  ['hp', 'hong-bang', 'Hồng Bàng', 'Hồng Bàng', 'Hồng Bàng là quận trung tâm Hải Phòng, có nhiều cocktail bar, pub bia thủ công và rooftop.'],
  ['hue', 'pho-tay-hue', 'phố Tây Huế', 'Phạm Ngũ Lão|Võ Thị Sáu|Chu Văn An|Đội Cung|Nguyễn Công Trứ|Ngô Gia Tự', 'Phố Tây Huế quanh Phạm Ngũ Lão, Võ Thị Sáu, Chu Văn An gần sông Hương là nơi tập trung pub và bar của thành phố.'],
  ['ct', 'ninh-kieu', 'Ninh Kiều', 'Ninh Kiều', 'Ninh Kiều là quận trung tâm Cần Thơ gần bến Ninh Kiều, có nhiều club, beer club và lounge.'],
  ['bd', 'thu-dau-mot', 'Thủ Dầu Một', 'Thủ Dầu Một', 'Thủ Dầu Một là trung tâm tỉnh Bình Dương, có pub, beer bar và lounge.'],
];
const AREAS = AREA_DEF.map(([city, key, name, pat, intro]) => {
  const re = new RegExp(pat, 'i');
  const bars = ranked(BARS.filter(b => b.city === city && re.test(`${b.area} ${b.addr}`)));
  return { city, key, name, intro, bars, path: `bar-${key}/` };
}).filter(A => A.bars.length >= 3);
const areasOf = b => AREAS.filter(A => A.bars.includes(b));

// Sự kiện & lịch DJ: chỉ hiện sự kiện chưa qua ngày (giờ Việt Nam)
const TODAY_VN = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const EVENTS = (DATA.events || []).map(e => ({ ...e, bar: BARS.find(b => b.id === e.barId) }))
  .filter(e => e.bar && e.date >= TODAY_VN && e.name)
  .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
const barImgs = b => { if (b.images && b.images.length) return b.images.concat((POOL[TYPE_POOL[b.type]] || POOL.cocktail).slice(0, 1)); const p = POOL[TYPE_POOL[b.type]] || POOL.cocktail; const k = b.id % p.length; return p.slice(k).concat(p.slice(0, k)).slice(0, 3); };
const cityImgs = c => (CITY_IMG[c.id] || []).concat(POOL.club.slice(0, 2));
const bookHref = b => href('') + '?dat=' + b.id;

/* ảnh có dự phòng: thử lần lượt các ảnh, hết thì ẩn để lộ nền gradient */
function img(ids, w, alt, { eager = false, ratio = [16, 9] } = {}) {
  ids = [].concat(ids).filter(Boolean);
  return `<img src="${esc(UNS(ids[0], w))}" data-c="${esc(ids.slice(1).join('|'))}" data-w="${w}" alt="${esc(alt)}" width="${w}" height="${Math.round(w * ratio[1] / ratio[0])}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

/* ---------- 2. Markdown tối giản ---------- */
function parseFront(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const meta = {}; let body = src;
  if (m) {
    body = src.slice(m[0].length);
    for (const line of m[1].split(/\r?\n/)) {
      const mm = line.match(/^([a-zA-Z_]+):\s*(.*)$/); if (!mm) continue;
      let v = mm[2].trim();
      if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map(x => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      else v = v.replace(/^["']|["']$/g, '').replace(/\\"/g, '"');
      meta[mm[1]] = v;
    }
  }
  return { meta, body };
}
function inline(s) {
  s = esc(s);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
    const ext = /^https?:/.test(u) && !u.startsWith(SITE);
    const h = u.startsWith('/') ? href(u) : u;
    return `<a href="${h}"${ext ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
  });
  return s;
}
function md(src) {
  const lines = src.replace(/\r/g, '').split('\n');
  const out = []; const toc = []; const faq = []; let inFaq = false; let curQ = null;
  let i = 0;
  const pushFaqText = t => { if (inFaq && curQ) curQ.a += (curQ.a ? ' ' : '') + t.replace(/<[^>]+>/g, ''); };
  while (i < lines.length) {
    let l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = l.match(/^(#{2,3})\s+(.*)$/))) {
      const lvl = m[1].length; const text = m[2].trim(); const id = slugify(text);
      if (lvl === 2) { toc.push({ id, text }); inFaq = /câu hỏi thường gặp|hỏi đáp|faq/i.test(text); curQ = null; }
      if (lvl === 3 && inFaq) { curQ = { q: text, a: '' }; faq.push(curQ); }
      out.push(`<h${lvl} id="${id}">${inline(text)}</h${lvl}>`); i++; continue;
    }
    if ((m = l.match(/^!\[([^\]]*)\]\(([^)\s]+)\)/))) {
      const src = m[2].replace(/^unsplash:/, '');
      out.push(`<figure><div class="ph-box">${img([src].concat(POOL.cocktail.slice(0, 1)), 1200, m[1])}</div>${m[1] ? `<figcaption>${esc(m[1])}</figcaption>` : ''}</figure>`); i++; continue;
    }
    if (/^:::cta/.test(l)) {
      const buf = []; i++; while (i < lines.length && !/^:::/.test(lines[i])) buf.push(lines[i++]); i++;
      const [title, ...rest] = buf.filter(x => x.trim());
      out.push(`<aside class="ctabox"><b>${inline(title || 'Đặt bàn qua TopChill')}</b>${rest.length ? `<p>${inline(rest.join(' '))}</p>` : ''}<a class="btn btn-gold" href="${href('')}">Đặt Bàn Ngay</a></aside>`);
      continue;
    }
    if (/^>\s?/.test(l)) {
      const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`); pushFaqText(buf.join(' ')); continue;
    }
    if (/^\|/.test(l)) {
      const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(rows[0]); const body = rows.slice(2).map(cells);
      out.push(`<div class="tbl"><table><thead><tr>${head.map(h => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l); const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ''));
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map(x => `<li>${inline(x)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
      pushFaqText(items.join('. '));
      continue;
    }
    const buf = []; while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|!\[|>|\||\s*([-*]|\d+\.)\s|:::)/.test(lines[i])) buf.push(lines[i++]);
    const p = inline(buf.join(' ')); out.push(`<p>${p}</p>`); pushFaqText(p);
  }
  const text = src.replace(/[#>*|\-\[\]()!:]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return { html: out.join('\n'), toc, faq, words };
}

/* ---------- 3. Bài viết ---------- */
const POSTS = fs.readdirSync(path.join(ROOT, 'content/blog')).filter(f => f.endsWith('.md')).map(f => {
  const { meta, body } = parseFront(fs.readFileSync(path.join(ROOT, 'content/blog', f), 'utf8'));
  const r = md(body);
  const slug = meta.slug || f.replace(/\.md$/, '');
  return {
    file: f, slug, path: `blog/${slug}/`, title: meta.title || slug, description: meta.description || '',
    keyword: meta.keyword || '', date: meta.date || TODAY, updated: meta.updated || meta.date || TODAY,
    cover: meta.cover || POOL.cocktail[0], coverAlt: meta.coverAlt || meta.title, tags: [].concat(meta.tags || []),
    bars: [].concat(meta.bars || []), city: meta.city || '', author: meta.author || CFG.defaultAuthor,
    draft: meta.draft === 'true', ...r, minutes: Math.max(2, Math.round(r.words / 220)),
  };
}).filter(p => !p.draft).sort((a, b) => b.date.localeCompare(a.date));

/* ---------- 4. Khung trang ---------- */
const ORG = { '@type': 'Organization', '@id': SITE + '/#org', name: CFG.siteName, alternateName: ['TopChill.vn', 'Top Chill'], url: SITE + '/', logo: { '@type': 'ImageObject', url: url('icon-512.png'), width: 512, height: 512 }, image: url('logo-topchill.jpg'), description: 'TopChill là nền tảng đặt bàn bar, lounge, club tại Việt Nam: tổng đài giữ bàn 24/7, không cần cọc, thông tin bar có nguồn rõ ràng.', telephone: CFG.hotline, areaServed: 'VN' };
function breadcrumbLd(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it[0], item: url(it[1]) })) };
}
function crumbsHtml(items) {
  return `<nav class="crumbs" aria-label="Breadcrumb">${items.map((it, i) => i < items.length - 1 ? `<a href="${href(it[1])}">${esc(it[0])}</a><span aria-hidden="true">›</span>` : `<span aria-current="page">${esc(it[0])}</span>`).join('')}</nav>`;
}
function faqLd(list) {
  return list.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: list.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) } : null;
}
function faqHtml(list) {
  return `<div class="faq">${list.map(f => `<details><summary>${esc(f.q)}</summary><div>${esc(f.a)}</div></details>`).join('')}</div>`;
}
/* Google Ads: thẻ toàn trang + chuyển đổi "liên hệ" khi khách bấm Gọi / Zalo / Telegram hoặc gửi số điện thoại */
const ADS_TAG = CFG.googleAdsId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${CFG.googleAdsId}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${CFG.googleAdsId}');
(function(){var ID='${CFG.googleAdsId}/',L=${JSON.stringify(CFG.googleAdsLabels || {})};
function conv(label){if(label)try{gtag('event','conversion',{send_to:ID+label})}catch(e){}}
var last=0;window.tcConv=function(kind){var now=Date.now();if(now-last<1500)return;last=now;conv(L[kind])};
document.addEventListener('click',function(e){var t=e.target;if(!t||!t.closest)return;var a=t.closest('a[href^="tel:"],a[href*="zalo.me"],a[href*="t.me/"],#bkZalo,#bkTg,[data-fbzalo]');if(!a)return;var h=a.getAttribute('href')||'';
tcConv(h.indexOf('tel:')===0?'call':(h.indexOf('zalo.me')>-1||a.id==='bkZalo'||a.hasAttribute('data-fbzalo'))?'zalo':(h.indexOf('t.me/')>-1||a.id==='bkTg')?'telegram':'')},true);
var sc=false;addEventListener('scroll',function(){if(sc)return;var d=document.documentElement;if((scrollY+innerHeight)/d.scrollHeight>=0.75){sc=true;conv(L.scroll75)}},{passive:true});
var sec=0,tm=setInterval(function(){if(document.visibilityState!=='visible')return;if(++sec>=30){conv(L.stay30s);clearInterval(tm)}},1000)})();</script>
` : '';
/* Bảo mật: CSP (chỉ chạy code từ nguồn cho phép), khoá tên miền, chống nhúng khung */
const ALLOWED_HOSTS = ['topchill.vn', 'www.topchill.vn', 'localhost', '127.0.0.1'];
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://embed.tawk.to https://*.tawk.to https://www.gstatic.com https://apis.google.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://www.google.com https://*.google.com https://*.google.com.vn https://*.google-analytics.com https://*.analytics.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.tawk.to",
  "font-src 'self' data: https://fonts.gstatic.com https://*.tawk.to",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.tawk.to https://*.googleusercontent.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://www.google.com https://*.google.com https://*.google.com.vn https://*.google-analytics.com https://*.analytics.google.com",
  "connect-src 'self' https://www.googletagmanager.com https://*.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://www.google.com https://*.google.com https://*.google.com.vn https://*.google-analytics.com https://*.analytics.google.com https://api.web3forms.com https://formsubmit.co https://api.github.com https://raw.githubusercontent.com https://*.tawk.to wss://*.tawk.to https://*.googleapis.com https://*.firebaseio.com",
  "media-src 'self' data: blob:",
  "frame-src https://td.doubleclick.net https://*.doubleclick.net https://www.googletagmanager.com https://*.tawk.to https://*.firebaseapp.com https://accounts.google.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');
const SECURITY_TAGS = `<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="format-detection" content="telephone=no">
<script>(function(){var H=${JSON.stringify(ALLOWED_HOSTS)},h=location.hostname;
if(top!==self){try{top.location.replace(self.location.href)}catch(e){document.documentElement.style.display='none'}}
if(location.protocol!=='file:'&&H.indexOf(h)<0&&!/(^|\.)topchill\.pages\.dev$/.test(h)){document.documentElement.style.display='none';addEventListener('DOMContentLoaded',function(){document.documentElement.style.display='';document.body.innerHTML='<div style="font:16px/1.6 system-ui,sans-serif;max-width:520px;margin:18vh auto;padding:24px;color:#fff;background:#140c1e;border-radius:18px;text-align:center">Đây là bản sao trái phép của TopChill.<br>Trang chính thức: <a style="color:#ff6fb5" href="https://topchill.vn">topchill.vn</a></div>';document.body.style.background='#0b0710'});setTimeout(function(){location.replace('https://topchill.vn'+location.pathname)},4000)}})();</script>`;
const HEAD_SCRIPT = `<script>var t='dark';try{t=localStorage.getItem('topchill-theme')||'dark'}catch(e){}document.documentElement.setAttribute('data-theme',t);
document.addEventListener('error',function(e){var el=e.target;if(!el||el.tagName!=='IMG'||!el.dataset||el.dataset.c===undefined||el.classList.contains('ph'))return;var r=el.dataset.c.split('|').filter(Boolean);if(r.length){el.dataset.c=r.slice(1).join('|');el.src=/^https?:/.test(r[0])?r[0]:'https://images.unsplash.com/photo-'+r[0]+'?auto=format&fit=crop&w='+el.dataset.w+'&q=70'}else{el.style.visibility='hidden'}},true);</script>`;

function headTags({ title, desc, pathRel, image, type = 'website', noindex = false, ld = [] }) {
  const robots = (!INDEX || noindex) ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="${robots}">
${SECURITY_TAGS}
<link rel="canonical" href="${url(pathRel)}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${esc(CFG.siteName)}">
<meta property="og:locale" content="vi_VN">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url(pathRel)}">
<meta property="og:image" content="${esc(/^\//.test(image || '') ? url(image) : UNS(image || POOL.cocktail[0], 1200))}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b0710">
<meta name="color-scheme" content="dark">
<link rel="icon" href="${href('favicon.ico')}" sizes="48x48">
<link rel="icon" href="${href('favicon-96.png')}" type="image/png" sizes="96x96">
<link rel="icon" href="${href('favicon-192.png')}" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="${href('icon-192.png')}">
<link rel="manifest" href="${href('manifest.webmanifest')}">
${noindex ? '' : ADS_TAG}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://images.unsplash.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Be+Vietnam+Pro:wght@400;500;600;700&family=Fredoka:wght@600;700&display=swap">
<link rel="stylesheet" href="${href('assets/site.css')}?v=${STAMP}">
${ld.filter(Boolean).map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join('\n')}
${HEAD_SCRIPT}`;
}
const STAMP = Date.now().toString(36);
const CHAT_TAGS = () => `<link rel="stylesheet" href="${href('assets/chat.css')}?v=${STAMP}">\n<script src="${href('assets/chat-data.js')}?v=${STAMP}" defer></script>\n<script src="${href('assets/chat.js')}?v=${STAMP}" defer></script>\n<script src="${href('assets/music.js')}?v=${STAMP}" defer></script>\n<script src="${href('assets/install.js')}?v=${STAMP}" defer></script>`;
const NAV = [['bar-ha-noi/', 'Bar Hà Nội'], ['bar-sai-gon/', 'Bar Sài Gòn'], ['bar-da-nang/', 'Bar Đà Nẵng'], ['blog/', 'Cẩm nang']];
function header(active) {
  const links = NAV.map(([p, t]) => `<a href="${href(p)}"${active === p ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  return `<header class="hdr"><div class="wrap hdr-in">
  <a class="logo" href="${href('')}" aria-label="TopChill trang chủ">${LOGO('')}</a>
  <nav class="nav" aria-label="Chính">${links}</nav>
  <a class="btn btn-gold" href="${href('')}">Đặt Bàn Ngay</a>
</div><div class="wrap subnav">${links}</div></header>`;
}
function footer() {
  const cityLinks = CITIES.filter(c => BARS.some(b => b.city === c.id)).map(c => `<a href="${href(c.path)}">Bar ${esc(c.name)}</a>`).join('');
  const postLinks = POSTS.slice(0, 5).map(p => `<a href="${href(p.path)}">${esc(p.title.split(':')[0])}</a>`).join('');
  return `<footer class="foot"><div class="wrap foot-grid">
  <div><a class="logo" href="${href('')}">${LOGO('')}</a>
    <p style="margin-top:10px">Đặt bàn bar, lounge, club khắp Việt Nam. Đặt bàn không cần cọc, hỗ trợ 24/7, hạng thành viên giảm đến 10% bill.</p>
    <p class="note">© ${new Date().getFullYear()} TopChill.vn. Bảo lưu mọi quyền. Nghiêm cấm sao chép giao diện, nội dung và mã nguồn.</p>
    <p class="note">Thông tin bar tổng hợp từ nguồn công khai, có thể thay đổi; gọi ${esc(CFG.hotline)} để xác nhận trước khi đi. Uống có trách nhiệm, không lái xe sau khi uống rượu bia.</p></div>
  <div><h4>Bar theo thành phố</h4>${cityLinks}</div>
  <div><h4>Cẩm nang</h4>${postLinks}<a href="${href('blog/')}">Tất cả bài viết</a></div>
  <div><h4>TopChill</h4><a href="${href('gioi-thieu/')}">Giới thiệu TopChill</a><a href="${href('su-kien/')}">Sự kiện &amp; lịch DJ</a><a href="${href('thanh-vien/')}">Hạng thành viên</a><a href="${href('chu-bar/')}">Dành cho chủ bar</a><a href="${href('huy-hieu/')}">Huy hiệu đối tác</a><a href="tel:${CFG.hotline.replace(/\s/g, '')}">Hotline ${esc(CFG.hotline)}</a><a href="https://zalo.me/${CFG.zalo}" target="_blank" rel="noopener">Zalo ${esc(CFG.hotline)}</a><a href="https://t.me/${CFG.telegram}" target="_blank" rel="noopener">Telegram ${esc(CFG.hotline)}</a></div>
</div></footer>`;
}
function page(opts, body, { mcta = '' } = {}) {
  return `<!doctype html>
<html lang="vi">
<head>
${headTags(opts)}
</head>
<body>
${header(opts.active)}
<main>
${body}
</main>
${footer()}
${mcta}
${CHAT_TAGS()}
</body>
</html>
`;
}
const mctaBar = (label, link) => `<div class="mcta"><a class="btn btn-gold" href="${link}">${esc(label)}</a><a class="btn call" href="tel:${CFG.hotline.replace(/\s/g, '')}" aria-label="Gọi tổng đài ${esc(CFG.hotline)}">📞</a></div>`;

/* ---------- 5. Thẻ dùng chung ---------- */
function postCard(p) {
  return `<a class="card" href="${href(p.path)}"><div class="card-ph">${img([p.cover, POOL.cocktail[1]], 640, p.coverAlt)}</div><div class="card-b"><span class="meta"><span>${fmtDate(p.updated)}</span><span>${p.minutes} phút đọc</span></span><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p></div></a>`;
}
function barCardSmall(b) {
  const c = cityOf(b.city);
  return `<a class="card" href="${href(b.path)}"><div class="card-ph">${img(barImgs(b), 640, `${b.name} – ${b.type} ${c.name}`)}</div><div class="card-b"><span class="meta">${b.rating ? `<span class="rate">★ ${b.rating.toFixed(1)}</span>` : ''}<span>${esc(c.name)}</span><span>${esc(b.type)}</span></span><h3>${esc(b.name)}</h3><p class="muted" style="font-size:13px">📍 ${esc([b.addr, b.addr && b.addr.includes(b.area) ? '' : b.area, c.name].filter(Boolean).join(', '))}</p><p>${P(b) ? `Giảm ${b.deal}% bill${b.gpct ? ` · giờ vàng ${b.gLabel} giảm thêm ${b.gpct}%` : ''}` : 'Đặt bàn qua tổng đài, không cần cọc'}</p></div></a>`;
}

/* ---------- 6. Trang thành phố ---------- */
function cityFaq(c, bars) {
  if (!bars.length) return [];
  const priced = bars.filter(b => b.priceKnown !== false), timed = bars.filter(b => b.hoursKnown !== false), partners = bars.filter(P), golds = partners.filter(b => b.gpct);
  const close = b => +b.hours.slice(8, 10) + (+b.hours.slice(8, 10) < 12 ? 24 : 0);
  const out = [];
  if (priced.length) out.push({ q: `Giá đi bar ở ${c.name} khoảng bao nhiêu?`, a: `Mức chi phổ biến tại các bar trong danh sách ở ${c.name} từ ${fmt(Math.min(...priced.map(b => b.price[0])) * 1000)}đ đến ${fmt(Math.max(...priced.map(b => b.price[1])) * 1000)}đ mỗi người. Bàn VIP thường có mức chi tối thiểu cao hơn.${partners.length ? ` Đặt qua TopChill tại bar đối tác được giảm thẳng vào bill.` : ''}` });
  if (timed.length) { const late = timed.slice().sort((a, b) => close(b) - close(a))[0]; out.push({ q: `Bar ở ${c.name} mở cửa đến mấy giờ?`, a: `Phần lớn bar ở ${c.name} mở từ chiều tối đến khuya. ${late.name} mở muộn nhất trong danh sách, khung giờ ${late.hours}.` }); }
  out.push({ q: `Đặt bàn bar ${c.name} qua TopChill như thế nào?`, a: `Chọn bar, chọn ngày giờ và số khách rồi gửi yêu cầu. Tổng đài TopChill gọi lại xác nhận. Có thể gọi hoặc nhắn Zalo ${CFG.hotline} để đặt nhanh.` });
  if (golds.length) { const g = golds.slice().sort((a, b) => b.gpct - a.gpct)[0]; out.push({ q: `Giờ vàng ở bar ${c.name} là gì?`, a: `Giờ vàng là 2 giờ đầu sau khi bar đối tác mở cửa. Đến trong khung này được giảm thêm. Hiện ${g.name} giảm giờ vàng ${g.gpct}% từ ${g.gLabel}.` }); }
  return out;
}

/* ---------- 7b. Trang loại hình × thành phố (pub-ha-noi, rooftop-bar-sai-gon...) ---------- */
function landingPage(L) {
  const c = cityOf(L.city), t = L.type, T = TYPE[t], bars = L.bars, n = bars.length;
  const seed = c.n + t.length + n;
  const label = typeName(t);
  const crumbs = [['Trang chủ', ''], [`Bar ${c.name}`, c.path], [L.name, L.path]];
  const priced = bars.filter(b => b.priceKnown !== false && b.price && b.price[1] > 0);
  const lo = priced.length ? Math.min(...priced.map(b => b.price[0])) : 0, hi = priced.length ? Math.max(...priced.map(b => b.price[1])) : 0;
  const areas = [...new Set(bars.map(b => b.area))];
  const names = bars.slice(0, 3).map(b => b.name);
  const title = clip(`${L.name}: ${n} quán nổi bật, địa chỉ, giá tham khảo`, 65);
  const desc = clip(`${L.name}: ${n} quán ở ${areas.slice(0, 3).join(', ')}. Xem địa chỉ, ảnh, mức chi${lo ? ` ${fmt(lo * 1000)}đ–${fmt(hi * 1000)}đ` : ''} và đặt bàn không cần cọc qua TopChill.`, 158);
  const intro = `${n} ${T.label} ở ${c.name} được TopChill tổng hợp, nằm ở ${areas.slice(0, 3).join(', ')}${areas.length > 3 ? ' và các khu khác' : ''}.${lo ? ` Mức chi tham khảo khoảng ${fmt(lo * 1000)}đ đến ${fmt(hi * 1000)}đ mỗi người.` : ''} Gọi ${CFG.hotline} hoặc để lại số, tổng đài giữ bàn, không cần cọc.`;
  const rowTable = `<div class="tbl"><table><thead><tr><th>Quán</th><th>Khu vực</th><th>Âm nhạc</th><th>Mức chi tham khảo</th></tr></thead><tbody>${bars.map(b => `<tr><td><a href="${href(b.path)}">${esc(b.name)}</a></td><td>${esc(b.area)}</td><td>${esc(b.music || '–')}</td><td>${b.priceKnown !== false && b.price[1] > 0 ? `${fmt(b.price[0] * 1000)}đ – ${fmt(b.price[1] * 1000)}đ` : 'Liên hệ'}</td></tr>`).join('')}</tbody></table></div>`;
  const byArea = areas.map(a => { const xs = bars.filter(b => b.area === a); return `<li><b>${esc(a)}:</b> ${xs.map(b => `<a href="${href(b.path)}">${esc(b.name)}</a>`).join(', ')}</li>`; }).join('');
  const others = Object.values(LAND).filter(x => x.city === L.city && x !== L);
  const sameType = Object.values(LAND).filter(x => x.type === t && x.city !== L.city);
  const tips = [...T.tips, COMMON_TIPS[seed % COMMON_TIPS.length], COMMON_TIPS[1], COMMON_TIPS[4]].filter((x, i, a) => a.indexOf(x) === i).slice(0, 5);
  const faq = [
    { q: `${L.name} nào đáng đi?`, a: `${names.join(', ')} là những quán đang nằm đầu danh sách ${L.name} trên TopChill. Bạn chọn theo khu vực và mức chi, rồi gọi ${CFG.hotline} để tổng đài giữ bàn.` },
    ...(lo ? [{ q: `Đi ${T.label} ở ${c.name} hết bao nhiêu tiền?`, a: `Mức chi tham khảo khoảng ${fmt(lo * 1000)}đ đến ${fmt(hi * 1000)}đ mỗi người cho 2–3 đồ uống. Đây là giá tham khảo, giá thực tế tuỳ đồ uống và ngày đi.` }] : []),
    { q: `Có cần đặt bàn trước khi đi ${T.label} ở ${c.name} không?`, a: `Nên đặt trước vào tối thứ 6, thứ 7 và dịp lễ. Đặt qua TopChill không cần cọc: bạn gọi ${CFG.hotline}, nhắn Zalo hoặc để lại số, tổng đài gọi lại xác nhận.` },
    { q: `Nên đi ${T.label} ở ${c.name} vào lúc nào?`, a: `Thời điểm thường được chọn là ${T.best}.` },
  ];
  const body = `
<div class="wrap">${crumbsHtml(crumbs)}
  <section class="phero">${img(cityImgs(c), 1400, `${L.name} về đêm`, { eager: true })}
    <div class="phero-in">
      <span class="eyebrow">${n} quán · cập nhật ${fmtDate(TODAY)}</span>
      <h1>${esc(L.name)}</h1>
      <p class="lead">${esc(intro)}</p>
      <div class="hero-cta"><a class="btn btn-gold btn-lg" href="${href('kham-pha/')}?tp=${c.id}">Đặt Bàn Ngay</a></div>
    </div>
  </section>
</div>
<section class="sec"><div class="wrap">
  <h2>${n} ${esc(T.label)} ${esc(c.name)} nổi bật</h2>
  <p class="lead-p" style="margin-bottom:18px">Thông tin tổng hợp từ nguồn công khai và có thể thay đổi. Gọi ${esc(CFG.hotline)} để xác nhận giờ mở cửa và giữ bàn.</p>
  <ol class="blist">${bitems(bars, c)}</ol>
</div></section>
<section class="sec"><div class="wrap narrow">
  <h2>So sánh nhanh ${esc(L.name)}</h2>
  ${rowTable}
</div></section>
<section class="sec"><div class="wrap narrow">
  <h2>Đi ${esc(T.label)} ở ${esc(c.name)}: nên biết gì?</h2>
  <div class="prose">
    <p>${esc(T.space[seed % T.space.length])}</p>
    <p>Các quán ${esc(T.label)} ở ${esc(c.name)} thường hợp với ${esc(T.who)}. Thời điểm hay được chọn là ${esc(T.best)}.</p>
    <h3>Khu vực có ${esc(T.label)} ở ${esc(c.name)}</h3>
    <ul>${byArea}</ul>
    <h3>Lưu ý khi đi</h3>
    <ul>${tips.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  </div>
  <aside class="ctabox"><b>Đặt bàn ${esc(L.name)}</b><p>Gọi ${esc(CFG.hotline)} hoặc để lại số điện thoại, tổng đài TopChill giữ bàn giúp bạn, không cần cọc.</p><a class="btn btn-gold" href="${href('kham-pha/')}?tp=${c.id}">Đặt Bàn Ngay</a></aside>
</div></section>
<section class="sec"><div class="wrap narrow"><h2>Câu hỏi thường gặp về ${esc(L.name)}</h2>${faqHtml(faq)}</div></section>
<section class="sec"><div class="wrap">
  <h2>Loại hình khác ở ${esc(c.name)}</h2>
  <div class="citylinks"><a href="${href(c.path)}">Tất cả bar ${esc(c.name)}</a>${others.map(x => `<a href="${href(x.path)}">${esc(x.name)}</a>`).join('')}</div>
  ${sameType.length ? `<h2 style="margin-top:28px">${esc(label)} ở thành phố khác</h2><div class="citylinks">${sameType.map(x => `<a href="${href(x.path)}">${esc(x.name)}</a>`).join('')}</div>` : ''}
</div></section>`;
  const ld = [breadcrumbLd(crumbs),
    { '@context': 'https://schema.org', '@type': 'ItemList', name: L.name, itemListElement: bars.map((b, i) => ({ '@type': 'ListItem', position: i + 1, url: url(b.path), name: b.name })) },
    faqLd(faq)];
  write(L.path + 'index.html', page({ title, desc, pathRel: L.path, image: cityImgs(c)[0], ld, active: c.path }, body, { mcta: mctaBar('Đặt Bàn Ngay', href('kham-pha/') + '?tp=' + c.id) }));
}


/* ---------- 7c. Trang khu vực ---------- */
function areaPage(A) {
  const c = cityOf(A.city), bars = A.bars, n = bars.length;
  const crumbs = [['Trang chủ', ''], [`Bar ${c.name}`, c.path], [`Bar ${A.name}`, A.path]];
  const priced = bars.filter(b => b.priceKnown !== false && b.price && b.price[1] > 0);
  const lo = priced.length ? Math.min(...priced.map(b => b.price[0])) : 0, hi = priced.length ? Math.max(...priced.map(b => b.price[1])) : 0;
  const types = [...new Set(bars.map(b => b.type))];
  const cityTag = A.name.includes(c.name) ? '' : `, ${c.name}`;
  const title = clip(`Bar ${A.name}${cityTag}: ${n} quán, địa chỉ, giá tham khảo`, 65);
  const desc = clip(`Bar ${A.name}${cityTag}: ${n} quán ${types.slice(0, 3).map(t => t.toLowerCase()).join(', ')}. Địa chỉ, ảnh, mức chi${lo ? ` ${fmt(lo * 1000)}đ–${fmt(hi * 1000)}đ` : ''}, đặt bàn không cần cọc qua TopChill.`, 158);
  const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`bar ${A.name}, ${c.name}`);
  const early = bars.filter(b => /Rooftop|Cocktail bar|Lounge|Whisky bar|Jazz bar|Garden bar|Beach club/.test(b.type)).slice(0, 2);
  const late = bars.filter(b => /Club|Pub/.test(b.type)).slice(0, 2);
  const link = b => `<a href="${href(b.path)}">${esc(b.name)}</a>`;
  const route = early.length && late.length
    ? `<p>Một tối gợi ý: bắt đầu ở ${early.map(link).join(' hoặc ')} để ngồi trò chuyện, ngắm cảnh lúc đầu buổi tối, sau khoảng 22h chuyển sang ${late.map(link).join(' hoặc ')} khi không khí sôi động hơn.</p>`
    : `<p>Các quán ở ${esc(A.name)} khá gần nhau, bạn có thể chọn 2–3 quán cùng kiểu rồi ghé lần lượt trong một tối.</p>`;
  const others = AREAS.filter(x => x.city === A.city && x !== A);
  const lands = Object.values(LAND).filter(x => x.city === A.city);
  const evs = EVENTS.filter(e => bars.includes(e.bar));
  const faq = [
    { q: `Bar ${A.name} nào đáng đi?`, a: `${bars.slice(0, 3).map(b => b.name).join(', ')} là những quán đang ở đầu danh sách bar ${A.name} trên TopChill. Gọi ${CFG.hotline} để tổng đài tư vấn và giữ bàn.` },
    ...(lo ? [{ q: `Đi bar ở ${A.name} hết bao nhiêu tiền?`, a: `Mức chi tham khảo khoảng ${fmt(lo * 1000)}đ đến ${fmt(hi * 1000)}đ mỗi người cho 2–3 đồ uống, tuỳ quán và đồ uống bạn chọn.` }] : []),
    { q: `Có cần đặt bàn trước khi đi bar ở ${A.name} không?`, a: `Nên đặt trước vào tối thứ 6, thứ 7 và dịp lễ. Đặt qua TopChill không cần cọc: gọi ${CFG.hotline}, nhắn Zalo hoặc để lại số, tổng đài gọi lại xác nhận.` },
  ];
  const body = `
<div class="wrap">${crumbsHtml(crumbs)}
  <section class="phero">${img(barImgs(bars[0]), 1400, `Bar ${A.name}, ${c.name} về đêm`, { eager: true })}
    <div class="phero-in">
      <span class="eyebrow">${n} quán · ${esc(c.name)} · cập nhật ${fmtDate(TODAY)}</span>
      <h1>Bar ${esc(A.name)}</h1>
      <p class="lead">${esc(A.intro)} TopChill tổng hợp ${n} quán ở đây${lo ? `, mức chi tham khảo ${fmt(lo * 1000)}đ–${fmt(hi * 1000)}đ mỗi người` : ''}.</p>
      <div class="hero-cta"><a class="btn btn-gold btn-lg" href="${href('kham-pha/')}?tp=${c.id}">Đặt Bàn Ngay</a></div>
    </div>
  </section>
</div>
<section class="sec"><div class="wrap">
  <h2>${n} bar ${esc(A.name)} nổi bật</h2>
  <p class="lead-p" style="margin-bottom:18px">Thông tin tổng hợp từ nguồn công khai và có thể thay đổi. <a href="${esc(mapUrl)}" target="_blank" rel="noopener">Xem khu vực trên Google Maps</a>.</p>
  <ol class="blist">${bitems(bars, c)}</ol>
</div></section>
${evs.length ? `<section class="sec"><div class="wrap narrow"><h2>Sự kiện sắp tới ở ${esc(A.name)}</h2>${eventList(evs)}</div></section>` : ''}
<section class="sec"><div class="wrap narrow">
  <h2>Đi bar ở ${esc(A.name)}: gợi ý cho một tối</h2>
  <div class="prose">${route}
    <div class="tbl"><table><thead><tr><th>Quán</th><th>Loại hình</th><th>Địa chỉ</th><th>Mức chi tham khảo</th></tr></thead><tbody>${bars.map(b => `<tr><td>${link(b)}</td><td>${esc(b.type)}</td><td>${esc(b.addr || b.area)}</td><td>${b.priceKnown !== false && b.price[1] > 0 ? `${fmt(b.price[0] * 1000)}đ – ${fmt(b.price[1] * 1000)}đ` : 'Liên hệ'}</td></tr>`).join('')}</tbody></table></div>
    <h3>Lưu ý khi đi</h3>
    <ul>${[COMMON_TIPS[0], COMMON_TIPS[1], 'Các quán trong khu khá gần nhau, nên đi bộ hoặc gọi xe thay vì tự lái.', COMMON_TIPS[3], COMMON_TIPS[4]].map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  </div>
  <aside class="ctabox"><b>Đặt bàn bar ${esc(A.name)}</b><p>Gọi ${esc(CFG.hotline)} hoặc để lại số điện thoại, tổng đài TopChill giữ bàn giúp bạn, không cần cọc.</p><a class="btn btn-gold" href="${href('kham-pha/')}?tp=${c.id}">Đặt Bàn Ngay</a></aside>
</div></section>
<section class="sec"><div class="wrap narrow"><h2>Câu hỏi thường gặp về bar ${esc(A.name)}</h2>${faqHtml(faq)}</div></section>
<section class="sec"><div class="wrap">
  <h2>Khu vực và loại hình khác ở ${esc(c.name)}</h2>
  <div class="citylinks"><a href="${href(c.path)}">Tất cả bar ${esc(c.name)}</a>${others.map(x => `<a href="${href(x.path)}">Bar ${esc(x.name)}</a>`).join('')}${lands.map(x => `<a href="${href(x.path)}">${esc(x.name)}</a>`).join('')}</div>
</div></section>`;
  const ld = [breadcrumbLd(crumbs),
    { '@context': 'https://schema.org', '@type': 'ItemList', name: `Bar ${A.name}`, itemListElement: bars.map((b, i) => ({ '@type': 'ListItem', position: i + 1, url: url(b.path), name: b.name })) },
    faqLd(faq), ...evs.map(eventLd)];
  write(A.path + 'index.html', page({ title, desc, pathRel: A.path, image: barImgs(bars[0])[0], ld, active: c.path }, body, { mcta: mctaBar('Đặt Bàn Ngay', href('kham-pha/') + '?tp=' + c.id) }));
}

/* ---------- 7d. Sự kiện & lịch DJ ---------- */
const absImg = u => /^\//.test(u) ? url(u) : UNS(u, 1200);
function eventLd(e) {
  const b = e.bar, c = cityOf(b.city);
  const ld = { '@context': 'https://schema.org', '@type': 'Event', name: e.name, startDate: `${e.date}T${e.start}:00+07:00`,
    eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: b.name, address: { '@type': 'PostalAddress', streetAddress: b.addr || b.area, addressLocality: `${b.area}, ${c.name}`, addressCountry: 'VN' } },
    image: [absImg(barImgs(b)[0])], description: e.desc || `${e.name} tại ${b.name}, ${c.name}.`,
    organizer: { '@type': 'Organization', name: b.name, url: url(b.path) }, url: url('su-kien/') + '#' + e.id };
  if (e.end) { const next = e.end <= e.start; const d = new Date(e.date + 'T00:00:00Z'); if (next) d.setUTCDate(d.getUTCDate() + 1); ld.endDate = `${d.toISOString().slice(0, 10)}T${e.end}:00+07:00`; }
  if (e.artist) ld.performer = { '@type': 'PerformingGroup', name: e.artist };
  return ld;
}
const DOW = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const evDate = d => { const x = new Date(d + 'T00:00:00Z'); return `${DOW[x.getUTCDay()]}, ${d.split('-').reverse().join('/')}`; };
function eventList(evs) {
  return `<div class="evlist">${evs.map(e => { const b = e.bar, c = cityOf(b.city); return `<article class="evitem" id="${esc(e.id)}">
    <div class="evdate"><b>${e.date.slice(8, 10)}/${e.date.slice(5, 7)}</b><small>${esc(e.start)}${e.end ? '–' + esc(e.end) : ''}</small></div>
    <div class="evb"><h3>${esc(e.name)}</h3>
      <p class="meta"><span>${evDate(e.date)}</span><span><a href="${href(b.path)}">${esc(b.name)}</a></span><span>${esc(b.area)}, ${esc(c.name)}</span>${e.artist ? `<span>${esc(e.artist)}</span>` : ''}</p>
      ${e.desc ? `<p>${esc(e.desc)}</p>` : ''}
      <p class="meta">${e.price ? `<span>${esc(e.price)}</span>` : ''}${e.source ? `<span><a href="${esc(e.source)}" target="_blank" rel="nofollow noopener">Nguồn</a></span>` : ''}</p>
      <a class="btn btn-gold" href="${bookHref(b)}">Đặt Bàn Ngay</a>
    </div></article>`; }).join('')}</div>`;
}
function eventsPage() {
  const crumbs = [['Trang chủ', ''], ['Sự kiện & lịch DJ', 'su-kien/']];
  const byCity = CITIES.map(c => ({ c, evs: EVENTS.filter(e => e.bar.city === c.id) })).filter(x => x.evs.length);
  const body = `
<div class="wrap narrow">${crumbsHtml(crumbs)}
  <header class="post-head">
    <span class="eyebrow">Cập nhật ${fmtDate(TODAY)}</span>
    <h1>Sự kiện bar, club &amp; lịch DJ sắp tới</h1>
    <p class="lead">Lịch sự kiện, đêm nhạc và DJ tại các bar, club trên TopChill. Thông tin được tổng đài xác nhận với quán, sự kiện đã qua tự ẩn. Gọi ${esc(CFG.hotline)} để giữ bàn, không cần cọc.</p>
  </header>
  ${byCity.length ? `<div class="citylinks" style="margin-bottom:18px">${byCity.map(x => `<a href="#tp-${x.c.id}">${esc(x.c.name)} <small>${x.evs.length}</small></a>`).join('')}</div>` + byCity.map(x => `<section id="tp-${x.c.id}" style="margin-top:28px"><h2>Sự kiện ở ${esc(x.c.name)}</h2>${eventList(x.evs)}</section>`).join('')
    : `<div class="prose"><p>TopChill đang cập nhật lịch sự kiện tuần này. Bạn muốn biết tối nay quán nào có DJ hay nhạc sống, gọi <a href="tel:${CFG.hotline.replace(/\s/g, '')}">${esc(CFG.hotline)}</a> để tổng đài tư vấn.</p><p>Xem trước các quán: <a href="${href('club-ha-noi/')}">club Hà Nội</a>, <a href="${href('blog/top-bar-ha-noi/')}">top bar Hà Nội</a>, <a href="${href('bar-sai-gon/')}">bar Sài Gòn</a>.</p></div>`}
  <aside class="ctabox"><b>Chủ bar muốn đăng sự kiện?</b><p>Gửi lịch DJ, đêm nhạc, khuyến mãi theo dịp cho tổng đài ${esc(CFG.hotline)}, TopChill đăng miễn phí.</p><a class="btn btn-gold" href="${href('chu-bar/')}">Dành cho chủ bar</a></aside>
</div>`;
  const ld = [breadcrumbLd(crumbs), ...EVENTS.map(eventLd)];
  write('su-kien/index.html', page({ title: 'Sự kiện bar, club & lịch DJ sắp tới | TopChill', desc: 'Lịch sự kiện, đêm nhạc, DJ tại bar, club Hà Nội, Sài Gòn, Đà Nẵng và các thành phố. Xem lịch và giữ bàn không cần cọc qua TopChill.', pathRel: 'su-kien/', ld, noindex: !EVENTS.length }, body));
  return !EVENTS.length;
}

function bitems(bars, c) {
  return bars.map((b, i) => `<li class="bitem ${b.boost === 'top' ? 'top' : ''}">
    <div class="bitem-ph">${img(barImgs(b), 600, `${b.name} – ${b.type} ở ${b.area}, ${c.name}`, { eager: i === 0 })}<span class="rk">#${i + 1}</span></div>
    <div class="bitem-b">
      <span class="meta">${b.rating ? `<span class="rate">★ ${b.rating.toFixed(1)}</span><span>${fmt(b.reviews)} đánh giá</span>` : ''}<span>${esc(b.area)}</span><span>${esc(b.type)}</span></span>
      <h3><a href="${href(b.path)}">${esc(b.name)}</a></h3>
      <p>${esc(b.desc)}</p>
      ${P(b) ? `<div class="chips on-surface"><span class="chip gold">Giảm ${b.deal}% bill</span>${b.gpct ? `<span class="chip neon">⚡ Giờ vàng ${b.gLabel} -${b.gpct}%</span>` : ''}${b.bonus ? `<span class="chip">🎁 ${esc(b.bonus)}</span>` : ''}</div>` : ''}
      <span class="meta"><span>Giờ mở ${hoursTxt(b)}</span><span>${priceTxtS(b)}</span>${b.music ? `<span>${esc(b.music)}</span>` : ''}${b.addr ? `<span>${esc(b.addr)}</span>` : ''}</span>
      <div class="acts"><a class="btn btn-gold" href="${bookHref(b)}">Đặt Bàn Ngay</a><a class="btn btn-ghost" href="${href(b.path)}">Xem chi tiết</a></div>
    </div></li>`).join('');
}
function cityPage(c) {
  const bars = ranked(BARS.filter(b => b.city === c.id));
  const S = c.seo;
  const title = bars.length ? clip(`Bar ${c.name}: ${bars.length} bar, lounge, club nổi bật, đặt bàn nhanh (${new Date().getFullYear()})`, 65) : `Bar ${c.name}: đặt bàn bar, lounge, club giảm giá`;
  const desc = S.description || `Danh sách bar ${c.name} nổi bật: rooftop, lounge, club. Xem giá, giờ mở cửa, giá tham khảo và đặt bàn không cần cọc qua TopChill.`;
  const crumbs = [['Trang chủ', ''], [`Bar ${c.name}`, c.path]];
  const faq = cityFaq(c, bars);
  const related = POSTS.filter(p => p.city === c.id || p.tags.some(t => slugify(t).includes(slugify(c.name)))).concat(POSTS).filter((p, i, a) => a.indexOf(p) === i).slice(0, 3);
  const list = bitems(bars, c);
  const body = `
<div class="wrap">${crumbsHtml(crumbs)}
  <section class="phero">${img(cityImgs(c), 1400, `Bar ${c.name} về đêm`, { eager: true })}
    <div class="phero-in">
      <span class="eyebrow">${fmt(c.n)} bar · cập nhật ${fmtDate(TODAY)}</span>
      <h1>Bar ${esc(c.name)}</h1>
      <p class="lead">${esc(S.intro || `Tổng hợp bar, lounge, club ở ${c.name} được khách đặt nhiều nhất trên TopChill.`)}</p>
      <div class="hero-cta"><a class="btn btn-gold btn-lg" href="${href('kham-pha/')}?tp=${c.id}">Đặt Bàn Ngay</a></div>
    </div>
  </section>
</div>
<section class="sec"><div class="wrap">
  <h2>${bars.length || ''} bar ${esc(c.name)} nổi bật</h2>
  <p class="lead-p" style="margin-bottom:18px">Bar đối tác có ưu đãi khi đặt qua TopChill được xếp trước. Các bar còn lại đặt bàn qua tổng đài, thông tin tổng hợp từ nguồn công khai và có thể thay đổi.</p>
  ${bars.length ? `<ol class="blist">${list}</ol>` : `<p class="muted">TopChill đang cập nhật bar đối tác tại ${esc(c.name)}. Gọi ${esc(CFG.hotline)} để được tư vấn chỗ đi tối nay.</p>`}
</div></section>
${S.areas ? `<section class="sec"><div class="wrap narrow">
  <h2>Khu vực đi bar nổi tiếng ở ${esc(c.name)}</h2>
  <div class="prose">${S.areas.map(a => `<h3>${esc(a[0])}</h3><p>${esc(a[1])}</p>`).join('')}</div>
</div></section>` : ''}
${S.tips ? `<section class="sec"><div class="wrap narrow">
  <h2>Kinh nghiệm đi bar ${esc(c.name)}</h2>
  <div class="prose"><ul>${S.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
</div></section>` : ''}
${faq.length ? `<section class="sec"><div class="wrap narrow"><h2>Câu hỏi thường gặp về bar ${esc(c.name)}</h2>${faqHtml(faq)}</div></section>` : ''}
${related.length ? `<section class="sec"><div class="wrap"><h2>Cẩm nang đi bar</h2><div class="cards">${related.map(postCard).join('')}</div></div></section>` : ''}
${AREAS.filter(x => x.city === c.id).length ? `<section class="sec"><div class="wrap"><h2>Bar ${esc(c.name)} theo khu vực</h2><div class="citylinks">${AREAS.filter(x => x.city === c.id).map(x => `<a href="${href(x.path)}">Bar ${esc(x.name)} <small>${x.bars.length}</small></a>`).join('')}</div></div></section>` : ''}
${EVENTS.some(e => e.bar.city === c.id) ? `<section class="sec"><div class="wrap narrow"><h2>Sự kiện sắp tới ở ${esc(c.name)}</h2>${eventList(EVENTS.filter(e => e.bar.city === c.id).slice(0, 6))}<p><a href="${href('su-kien/')}">Xem tất cả sự kiện →</a></p></div></section>` : ''}
${Object.values(LAND).filter(x => x.city === c.id).length ? `<section class="sec"><div class="wrap"><h2>Tìm bar ${esc(c.name)} theo loại hình</h2><div class="citylinks">${Object.values(LAND).filter(x => x.city === c.id).map(x => `<a href="${href(x.path)}">${esc(x.name)} <small>${x.bars.length}</small></a>`).join('')}</div></div></section>` : ''}
<section class="sec"><div class="wrap"><h2>Bar ở thành phố khác</h2><div class="citylinks">${CITIES.filter(x => x.id !== c.id && BARS.some(b => b.city === x.id)).map(x => `<a href="${href(x.path)}">Bar ${esc(x.name)}</a>`).join('')}</div></div></section>`;
  const ld = [
    breadcrumbLd(crumbs),
    bars.length ? { '@context': 'https://schema.org', '@type': 'ItemList', name: `Top bar ${c.name}`, itemListElement: bars.map((b, i) => ({ '@type': 'ListItem', position: i + 1, url: url(b.path), name: b.name })) } : null,
    faqLd(faq),
  ];
  write(c.path + 'index.html', page({ title, desc, pathRel: c.path, image: cityImgs(c)[0], ld, active: c.path, noindex: !bars.length }, body, { mcta: bars.length ? mctaBar('Đặt Bàn Ngay', href('') + '#tp-' + c.id) : '' }));
  return { path: c.path, noindex: !bars.length };
}

/* ---------- 7. Trang bar ---------- */
function barPage(b) {
  const c = cityOf(b.city), p = P(b), hk = b.hoursKnown !== false, pk = b.priceKnown !== false;
  const title = clip(p ? `${b.name} ${c.name}: giá, menu, đặt bàn giảm ${b.deal}%` : `${b.name} ${c.name}: địa chỉ, giờ mở cửa, đặt bàn`, 65);
  const desc = clip(`${b.name}, ${b.type.toLowerCase()} ở ${b.area}, ${c.name}.${hk ? ` Mở ${b.hours}.` : ''}${pk ? ` ${b.price[0]}k–${b.price[1]}k/người.` : ''} ${p ? `Đặt qua TopChill giảm ${b.deal}%${b.gpct ? `, giờ vàng giảm thêm ${b.gpct}%` : ''}${b.bonus ? ', ' + b.bonus.toLowerCase() : ''}.` : `${b.desc} Đặt bàn nhanh qua tổng đài TopChill.`}`, 160);
  const crumbs = [['Trang chủ', ''], [`Bar ${c.name}`, c.path], [b.name, b.path]];
  const menu = [];
  const where = [b.addr, b.addr && b.addr.includes(b.area) ? '' : b.area, c.name].filter(Boolean).join(', ');
  const faq = [];
  if (hk) faq.push({ q: `${b.name} mở cửa mấy giờ?`, a: `${b.name} mở cửa từ ${b.hours}.${b.gpct ? ` Giờ vàng ${b.gLabel} được giảm thêm ${b.gpct}% khi đặt bàn qua TopChill.` : ''} Giờ có thể thay đổi vào dịp lễ, nên gọi ${CFG.hotline} để xác nhận.` });
  if (pk || menu.length) faq.push({ q: `Đi ${b.name} hết bao nhiêu tiền?`, a: `${pk ? `Mức chi tham khảo ${fmt(b.price[0] * 1000)}đ–${fmt(b.price[1] * 1000)}đ mỗi người.` : ''} ${menu.length ? `Đồ uống nổi bật: ${menu.map(m => `${m[0]} ${fmt(m[1])}.000đ`).join(', ')}.` : ''}${p ? ` Đặt qua TopChill được giảm ${b.deal}% tổng bill.` : ''}`.trim() });
  if (b.dress || b.music) faq.push({ q: `${b.name} có dress code không?`, a: `${b.dress ? `Dress code: ${b.dress}.` : 'Nên mặc lịch sự, smart casual.'}${b.music ? ` Nhạc: ${b.music}.` : ''}` });
  faq.push({ q: `${b.name} ở đâu?`, a: `${b.name} nằm tại ${where}.` });
  const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([b.name, b.addr, b.area, c.name].filter(Boolean).join(', '));
  const story = barStory(b, { esc, fmt, land: LAND[b.city + '|' + b.type], areas: areasOf(b), c, href, hotline: CFG.hotline, bars: ranked(BARS), P, pk, hk, mapUrl });
  faq.push(...story.extraFaq);
  const others = ranked(BARS.filter(x => x.city === b.city && x.id !== b.id)).slice(0, 3);
  const morePosts = POSTS.filter(x => x.bars.includes(b.slug) || x.city === b.city).concat(POSTS).filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 3);
  const srcs = (b.sources || []).filter(u => /^https:\/\//.test(u)).slice(0, 4);
  const offers = p ? `<h2>Ưu đãi khi đặt qua TopChill</h2>
    <div class="perkbox">
      <div class="perk"><b class="v">-${b.deal}%</b><div><b>Giảm thẳng vào bill</b><small>Quét mã QR tại quầy khi thanh toán.</small></div></div>
      ${b.gpct ? `<div class="perk n"><b class="v">-${b.gpct}%</b><div><b>Giờ vàng ${b.gLabel}</b><small>Đến trong khung này, giảm thêm, cộng dồn.</small></div></div>` : ''}
      ${b.bonus ? `<div class="perk"><b class="v">🎁</b><div><b>${esc(b.bonus)}</b><small>${esc(b.bonusNote || 'Tặng tại bàn theo điều kiện của bar.')}${b.promoUntil ? ' · Hạn đến ' + fmtDate(b.promoUntil) : ''}</small></div></div>` : ''}
      <div class="perk"><b class="v">-10%</b><div><b>Giảm thêm theo hạng thành viên</b><small>Silver 5%, Vàng 8%, Platinum 10% bill. Newbie: hỗ trợ 24/7, không cần cọc.</small></div></div>
    </div>` : `<h2>Đặt bàn qua TopChill</h2>
    <div class="perkbox"><div class="perk"><b class="v">📞</b><div><b>Tổng đài giữ bàn giúp bạn</b><small>Bar chưa áp dụng ưu đãi qua TopChill. Gửi yêu cầu hoặc gọi ${esc(CFG.hotline)}, tổng đài gọi lại xác nhận.</small></div></div></div>`;
  const body = `
<div class="wrap">${crumbsHtml(crumbs)}
  <section class="phero">${img(barImgs(b), 1400, `${b.name} – ${b.type} ở ${b.area}, ${c.name}`, { eager: true })}
    <div class="phero-in">
      <span class="eyebrow">${esc(b.type)} · ${esc(b.area)}, ${esc(c.name)}${b.boost === 'top' ? ' · Top ' + esc(c.name) : ''}</span>
      <h1>${esc(b.name)}</h1>
      <p class="lead">${b.rating ? `<span class="rate">★ ${b.rating.toFixed(1)}</span> · ${fmt(b.reviews)} đánh giá trên TopChill · ` : ''}${esc(b.music || b.type)}</p>
      ${p ? `<div class="chips"><span class="chip gold">Giảm ${b.deal}% bill</span>${b.gpct ? `<span class="chip neon">⚡ Giờ vàng ${b.gLabel} -${b.gpct}%</span>` : ''}${b.bonus ? `<span class="chip">🎁 ${esc(b.bonus)}</span>` : ''}</div>` : ''}
      <div class="hero-cta"><a class="btn btn-gold btn-lg" href="${bookHref(b)}">Đặt Bàn Ngay</a></div>
      ${b.images && b.images.length ? '' : '<span class="muted" style="font-size:12px;color:#cfc6dd">Ảnh minh hoạ</span>'}
    </div>
  </section>
</div>
<section class="sec"><div class="wrap grid2">
  <div>
    <h2>Giới thiệu ${esc(b.name)}</h2>
    <div class="prose"><p>${esc(b.desc)}</p></div>
    <h2 style="margin-top:28px">Thông tin cần biết</h2>
    <table class="info"><tbody>
      <tr><th scope="row">Địa chỉ</th><td>${esc(where)}</td></tr>
      <tr><th scope="row">Giờ mở cửa</th><td>${esc(hoursTxt(b))}</td></tr>
      ${b.gpct ? `<tr><th scope="row">Giờ vàng</th><td>${b.gLabel}, giảm thêm ${b.gpct}%</td></tr>` : ''}
      <tr><th scope="row">Mức chi</th><td>${pk ? `${fmt(b.price[0] * 1000)}đ – ${fmt(b.price[1] * 1000)}đ / người` : 'Liên hệ tổng đài'}</td></tr>
      ${b.music ? `<tr><th scope="row">Nhạc</th><td>${esc(b.music)}</td></tr>` : ''}
      ${b.dress ? `<tr><th scope="row">Dress code</th><td>${esc(b.dress)}</td></tr>` : ''}
    </tbody></table>
    ${(b.images || []).length > 1 ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:18px">${b.images.map((u, i) => `<img src="${esc(BASE + u.replace(/^\//, ''))}" alt="${esc(b.name)} ${esc(c.name)} ảnh ${i + 1}" loading="lazy" decoding="async" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px">`).join('')}</div>` : ''}
    ${(b.photoSources || []).length ? `<p class="muted" style="font-size:12px;margin-top:8px">Ảnh sưu tầm từ: ${b.photoSources.slice(0, 5).map((u, i) => `<a href="${esc(u)}" target="_blank" rel="nofollow noopener">[${i + 1}]</a>`).join(' ')}. Chủ ảnh cần gỡ vui lòng liên hệ ${esc(CFG.hotline)}.</p>` : ''}
    ${srcs.length ? `<p class="muted" style="font-size:13px;margin-top:12px">Nguồn thông tin: ${srcs.map((u, i) => `<a href="${esc(u)}" target="_blank" rel="nofollow noopener">[${i + 1}]</a>`).join(' ')}. Thông tin có thể thay đổi, gọi ${esc(CFG.hotline)} để xác nhận.</p>` : ''}
    ${story.html}
    ${EVENTS.some(e => e.bar === b) ? `<h2 style="margin-top:28px">Sự kiện sắp tới tại ${esc(b.name)}</h2>${eventList(EVENTS.filter(e => e.bar === b))}` : ''}
  </div>
  <div class="side-sticky">
    ${offers}
    <div class="sidebox"><b>Cần giữ bàn gấp?</b><p>Gọi <a href="tel:${CFG.hotline.replace(/\s/g, '')}">${esc(CFG.hotline)}</a> hoặc để lại số, tổng đài gọi lại trong vài phút.</p><a class="btn btn-gold" href="${bookHref(b)}">Đặt Bàn Ngay</a></div>
  </div>
</div></section>
<section class="sec"><div class="wrap narrow"><h2>Câu hỏi thường gặp về ${esc(b.name)}</h2>${faqHtml(faq)}</div></section>
${others.length ? `<section class="sec"><div class="wrap"><h2>Bar khác ở ${esc(c.name)}</h2><div class="cards">${others.map(barCardSmall).join('')}</div><p style="margin-top:16px"><a class="btn btn-ghost" href="${href(c.path)}">Xem tất cả bar ${esc(c.name)}</a></p></div></section>` : ''}
${morePosts.length ? `<section class="sec"><div class="wrap"><h2>Cẩm nang đi bar</h2><div class="cards">${morePosts.map(postCard).join('')}</div></div></section>` : ''}`;
  const biz = { '@context': 'https://schema.org', '@type': 'BarOrPub', name: b.name, url: url(b.path), image: UNS(barImgs(b)[0], 1200),
    address: { '@type': 'PostalAddress', streetAddress: b.addr || b.area, addressLocality: `${b.area}, ${c.name}`, addressCountry: 'VN' } };
  if (hk) biz.openingHours = `Mo-Su ${b.hours.replace(/\s/g, '').replace('–', '-')}`;
  if (pk) biz.priceRange = `${fmt(b.price[0] * 1000)}đ–${fmt(b.price[1] * 1000)}đ`;
  const ld = [breadcrumbLd(crumbs), biz, faqLd(faq), ...EVENTS.filter(e => e.bar === b).map(eventLd)];
  write(b.path + 'index.html', page({ title, desc, pathRel: b.path, image: barImgs(b)[0], ld, active: c.path }, body, { mcta: mctaBar('Đặt Bàn Ngay', bookHref(b)) }));
}

/* ---------- 8. Blog ---------- */
function postPage(p, idx) {
  const crumbs = [['Trang chủ', ''], ['Cẩm nang', 'blog/'], [p.title, p.path]];
  const barsIn = p.bars.map(s => BARS.find(b => b.slug === s)).filter(Boolean);
  const related = POSTS.filter(x => x !== p).sort((a, b) => (b.tags.filter(t => p.tags.includes(t)).length - a.tags.filter(t => p.tags.includes(t)).length)).slice(0, 3);
  const shareUrl = encodeURIComponent(url(p.path));
  const body = `
<article>
<div class="wrap">${crumbsHtml(crumbs)}
  <header class="post-head narrow">
    <span class="eyebrow">${esc(p.tags[0] || 'Cẩm nang')}</span>
    <h1>${esc(p.title)}</h1>
    <p class="lead">${esc(p.description)}</p>
    <div class="byline"><span>${esc(p.author)}</span><span>Cập nhật <time datetime="${p.updated}">${fmtDate(p.updated)}</time></span><span>${p.minutes} phút đọc</span></div>
  </header>
  <div class="cover">${img([p.cover, POOL.cocktail[0]], 1400, p.coverAlt, { eager: true, ratio: [16, 8] })}</div>
  <div class="post-grid">
    <div class="prose">${p.html}
      <aside class="ctabox"><b>Đặt bàn qua TopChill</b><p>Giảm thẳng vào bill, giờ vàng giảm thêm đến 20%, đặt bàn không cần cọc, hạng thành viên giảm đến 10% bill.</p><a class="btn btn-gold" href="${href('')}">Đặt Bàn Ngay</a></aside>
      ${p.tags.length ? `<div class="tags">${p.tags.map(t => `<a href="${href('blog/')}#${slugify(t)}">#${esc(t)}</a>`).join('')}</div>` : ''}
      <div class="share">Chia sẻ:
        <a class="btn btn-ghost" href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener">Facebook</a>
        <a class="btn btn-ghost" href="https://twitter.com/intent/tweet?url=${shareUrl}&text=${encodeURIComponent(p.title)}" target="_blank" rel="noopener">X</a>
      </div>
    </div>
    <aside>${p.toc.length > 2 ? `<nav class="toc" aria-label="Mục lục"><b>Mục lục</b><ol>${p.toc.map(t => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ol></nav>` : ''}</aside>
  </div>
</div>
</article>
${barsIn.length ? `<section class="sec"><div class="wrap"><h2>Bar được nhắc trong bài</h2><div class="cards">${barsIn.slice(0, 6).map(barCardSmall).join('')}</div></div></section>` : ''}
${related.length ? `<section class="sec"><div class="wrap"><h2>Bài viết liên quan</h2><div class="cards">${related.map(postCard).join('')}</div></div></section>` : ''}`;
  const ld = [
    breadcrumbLd(crumbs),
    { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, image: [UNS(p.cover, 1200)],
      datePublished: p.date, dateModified: p.updated, author: { '@type': 'Organization', name: p.author, url: SITE + '/' }, publisher: ORG,
      mainEntityOfPage: url(p.path), keywords: [p.keyword, ...p.tags].filter(Boolean).join(', '), wordCount: p.words, inLanguage: 'vi-VN' },
    faqLd(p.faq.filter(f => f.a)),
  ];
  write(p.path + 'index.html', page({ title: p.title, desc: p.description, pathRel: p.path, image: p.cover, type: 'article', ld, active: 'blog/' }, body, { mcta: mctaBar('Đặt Bàn Ngay', href('')) }));
}
function blogIndex() {
  const crumbs = [['Trang chủ', ''], ['Cẩm nang', 'blog/']];
  const tags = [...new Set(POSTS.flatMap(p => p.tags))];
  const body = `
<div class="wrap">${crumbsHtml(crumbs)}
  <header class="post-head narrow">
    <span class="eyebrow">Cẩm nang đi bar</span>
    <h1>Cẩm nang đi bar: kinh nghiệm, bảng giá, review bar</h1>
    <p class="lead">Kinh nghiệm đi bar lần đầu, bảng giá đặt bàn, gợi ý bar Hà Nội, Sài Gòn, Đà Nẵng và cách đặt bàn không cần cọc.</p>
  </header>
  ${tags.length ? `<div class="tags" style="margin-bottom:20px">${tags.map(t => `<a id="${slugify(t)}" href="#${slugify(t)}">#${esc(t)}</a>`).join('')}</div>` : ''}
  <div class="cards">${POSTS.length ? POSTS.map(postCard).join('') : '<p class="muted">Bài viết đang được cập nhật với thông tin bar thật. Quay lại sau nhé.</p>'}</div>
</div>
<section class="sec"><div class="wrap"><h2>Tìm bar theo thành phố</h2><div class="citylinks">${CITIES.filter(x => BARS.some(b => b.city === x.id)).map(x => `<a href="${href(x.path)}">Bar ${esc(x.name)}</a>`).join('')}</div></div></section>`;
  const ld = [breadcrumbLd(crumbs), { '@context': 'https://schema.org', '@type': 'Blog', name: 'Cẩm nang đi bar TopChill', url: url('blog/'), publisher: ORG,
    blogPost: POSTS.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: url(p.path), datePublished: p.date })) }];
  write('blog/index.html', page({ title: 'Cẩm nang đi bar: kinh nghiệm, bảng giá, review bar | TopChill', desc: 'Kinh nghiệm đi bar lần đầu, giá đặt bàn bar, top bar Hà Nội, Sài Gòn, Đà Nẵng, kinh nghiệm chọn bar và cách đặt bàn không cần cọc.', pathRel: 'blog/', ld, active: 'blog/' }, body));
}

/* ---------- 9b. Giới thiệu ---------- */
function aboutPage() {
  const crumbs = [['Trang chủ', ''], ['Giới thiệu', 'gioi-thieu/']];
  const tel = CFG.hotline.replace(/\s/g, '');
  const nCity = CITIES.filter(c => BARS.some(b => b.city === c.id)).length;
  const nImg = BARS.reduce((a, b) => a + ((b.images || []).length), 0);
  const body = `
<div class="wrap narrow">${crumbsHtml(crumbs)}
  <header class="post-head">
    <span class="eyebrow">Về chúng tôi</span>
    <h1>TopChill – đặt bàn bar, club, lounge khắp Việt Nam</h1>
    <p class="lead">TopChill giúp bạn tìm đúng chỗ đi chơi tối nay và giữ bàn chỉ bằng một cuộc gọi. Không cần cọc, không mất phí, có người thật hỗ trợ 24/7.</p>
  </header>
  <div class="prose">
    <p><img src="${href('logo-topchill.jpg')}" alt="Logo TopChill" width="220" height="220" style="position:static;border-radius:24px"></p>
    <h2 id="topchill-la-gi">TopChill là gì?</h2>
    <p>TopChill (topchill.vn) là nền tảng tìm và đặt bàn bar, lounge, club, rooftop, beach club tại Việt Nam. Hiện có <b>${BARS.length} địa điểm</b> ở <b>${nCity} thành phố</b>: Hà Nội, Sài Gòn, Đà Nẵng, Nha Trang, Phú Quốc, Đà Lạt, Hải Phòng, Vũng Tàu, Hạ Long, Cần Thơ, Huế và Bình Dương, kèm hơn ${Math.floor(nImg / 100) * 100} ảnh thực tế.</p>
    <h2 id="dat-ban-the-nao">Đặt bàn qua TopChill thế nào?</h2>
    <ol>
      <li><b>Chọn bar:</b> lọc theo thành phố, loại hình, xem ảnh, địa chỉ, mức chi tham khảo.</li>
      <li><b>Liên hệ theo cách bạn thích:</b> gọi <a href="tel:${tel}">${esc(CFG.hotline)}</a>, nhắn Zalo hoặc Telegram có sẵn nội dung, hoặc để lại số điện thoại.</li>
      <li><b>Tổng đài gọi lại xác nhận</b> trong vài phút và giữ bàn cho bạn. Đến bar, báo tên hoặc mã đặt bàn là xong.</li>
    </ol>
    <h2 id="cam-ket">Cam kết của TopChill</h2>
    <ul>
      <li><b>Miễn phí cho khách:</b> không thu phí đặt bàn, không yêu cầu đặt cọc.</li>
      <li><b>Thông tin minh bạch:</b> mỗi bar ghi rõ nguồn thông tin; giá là giá tham khảo và được tổng đài xác nhận khi đặt.</li>
      <li><b>Không bịa đánh giá:</b> chúng tôi không đăng điểm đánh giá hay review giả cho các bar.</li>
      <li><b>Bảo mật số điện thoại:</b> số bạn để lại chỉ dùng để gọi xác nhận đặt bàn.</li>
      <li><b>Uống có trách nhiệm:</b> khuyến khích khách không lái xe sau khi uống rượu bia; TopChill không phục vụ người dưới 18 tuổi.</li>
    </ul>
    <h2 id="hang-thanh-vien">Ưu đãi thành viên</h2>
    <p>Đăng ký miễn phí là hạng <b>Newbie</b>: hỗ trợ 24/7, đặt bàn không cần cọc. Chi tiêu qua TopChill từ 20 triệu lên <b>Silver</b> giảm 5% bill, từ 80 triệu lên <b>Vàng</b> giảm 8% kèm rượu quà sinh nhật, từ 150 triệu lên <b>Platinum</b> giảm 10%, tích điểm hàng tháng và các chương trình tặng rượu tại bar đối tác.</p>
    <h2 id="chu-bar">Dành cho chủ bar</h2>
    <p>Chủ bar muốn cập nhật thông tin, ảnh, khuyến mãi hoặc trở thành đối tác, vui lòng liên hệ hotline hoặc xem trang <a href="${href('chu-bar/')}">Dành cho chủ bar</a>. Nếu bạn là chủ ảnh hoặc chủ quán và muốn sửa, gỡ nội dung, chúng tôi xử lý trong 24 giờ.</p>
    <h2 id="lien-he">Liên hệ</h2>
    <ul>
      <li>Hotline đặt bàn 24/7: <a href="tel:${tel}">${esc(CFG.hotline)}</a></li>
      <li>Zalo: <a href="https://zalo.me/${CFG.zalo}" target="_blank" rel="noopener">${esc(CFG.hotline)}</a></li>
      ${CFG.telegram ? `<li>Telegram: <a href="https://t.me/${CFG.telegram}" target="_blank" rel="noopener">${esc(CFG.telegram)}</a></li>` : ''}
      <li>Website: <a href="${SITE}/">topchill.vn</a></li>
    </ul>
    <aside class="ctabox"><b>Tối nay đi đâu?</b><p>Xem ${BARS.length} bar, club, lounge và giữ bàn miễn phí, không cần cọc.</p><a class="btn btn-gold" href="${href('kham-pha/')}">Khám phá bar</a></aside>
  </div>
</div>`;
  const ld = [{ '@context': 'https://schema.org', '@type': 'AboutPage', name: 'Giới thiệu TopChill', url: url('gioi-thieu/'), mainEntity: { '@id': SITE + '/#org' }, inLanguage: 'vi-VN' },
    { '@context': 'https://schema.org', ...ORG, contactPoint: { '@type': 'ContactPoint', telephone: CFG.hotline, contactType: 'customer service', areaServed: 'VN', availableLanguage: 'Vietnamese', hoursAvailable: 'Mo-Su 00:00-23:59' } }, breadcrumbLd(crumbs)];
  write('gioi-thieu/index.html', page({ title: 'Giới thiệu TopChill – nền tảng đặt bàn bar, club không cần cọc', desc: `TopChill giúp bạn tìm và đặt bàn ${BARS.length} bar, club, lounge tại ${nCity} thành phố. Miễn phí, không cần cọc, tổng đài ${CFG.hotline} hỗ trợ 24/7.`, pathRel: 'gioi-thieu/', image: '/logo-topchill.jpg', ld }, body));
}

/* ---------- 9. Huy hiệu đối tác (backlink) ---------- */
function badgePage() {
  const crumbs = [['Trang chủ', ''], ['Huy hiệu đối tác', 'huy-hieu/']];
  const opts = ranked(BARS).map(b => `<option value="${b.slug}" data-name="${esc(b.name)}" data-city="${esc(cityOf(b.city).name)}">${esc(b.name)} – ${esc(cityOf(b.city).name)}</option>`).join('');
  const body = `
<div class="wrap narrow">${crumbsHtml(crumbs)}
  <header class="post-head">
    <span class="eyebrow">Dành cho chủ bar</span>
    <h1>Huy hiệu “Top bar trên TopChill”</h1>
    <p class="lead">Gắn huy hiệu lên website, fanpage hoặc menu QR của bar để khách biết bar đang có ưu đãi khi đặt qua TopChill. Bar gắn huy hiệu được cộng điểm xếp hạng.</p>
  </header>
  <div class="prose">
    <p><img src="${href('assets/badge.svg')}" alt="Huy hiệu Top bar trên TopChill" width="220" height="72" style="position:static"></p>
    <h2 id="lay-ma">Lấy mã nhúng</h2>
    <p><label for="bsel"><b>Chọn bar của bạn</b></label></p>
    <p><select id="bsel" style="width:100%;min-height:48px;padding:8px 12px;border-radius:12px;background:var(--surface);color:var(--fg);border:1px solid var(--line2);font:inherit">${opts}</select></p>
    <p><textarea id="bcode" readonly rows="5" style="width:100%;padding:12px;border-radius:12px;background:var(--surface);color:var(--fg);border:1px solid var(--line2);font:13px ui-monospace,monospace"></textarea></p>
    <p><button class="btn btn-gold" id="bcopy" type="button">Sao chép mã</button> <span id="bmsg" class="muted"></span></p>
    <h2 id="cach-gan">Cách gắn</h2>
    <ol><li>Website: dán mã vào chân trang hoặc trang giới thiệu.</li><li>Fanpage, Instagram: dán đường dẫn trang bar trên TopChill vào phần giới thiệu.</li><li>Menu QR, standee tại quầy: in huy hiệu kèm mã QR dẫn tới trang bar.</li></ol>
  </div>
</div>
<script>
(function(){var s=document.getElementById('bsel'),c=document.getElementById('bcode');
function upd(){var o=s.options[s.selectedIndex];c.value='<a href="${SITE}/bar/'+o.value+'/" title="Đặt bàn '+o.dataset.name+' trên TopChill"><img src="${SITE}/assets/badge.svg" alt="'+o.dataset.name+' – Top bar '+o.dataset.city+' trên TopChill" width="220" height="72"></a>'}
s.onchange=upd;upd();
document.getElementById('bcopy').onclick=function(){var m=document.getElementById('bmsg');(navigator.clipboard?navigator.clipboard.writeText(c.value):Promise.reject()).then(function(){m.textContent='Đã sao chép.'}).catch(function(){c.select();m.textContent='Đã chọn mã, nhấn Ctrl+C để sao chép.'})};})();
</script>`;
  write('huy-hieu/index.html', page({ title: 'Huy hiệu đối tác Top bar trên TopChill – mã nhúng cho chủ bar', desc: 'Lấy mã nhúng huy hiệu Top bar trên TopChill cho website, fanpage và menu QR của bar. Bar gắn huy hiệu được cộng điểm xếp hạng và tăng lượt đặt bàn.', pathRel: 'huy-hieu/', ld: [breadcrumbLd(crumbs)] }, body));
  write('assets/badge.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="72" viewBox="0 0 220 72"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd98a"/><stop offset=".6" stop-color="#f0b545"/><stop offset="1" stop-color="#c47d12"/></linearGradient></defs><rect width="220" height="72" rx="14" fill="#0a0912"/><rect x="1" y="1" width="218" height="70" rx="13" fill="none" stroke="url(#g)" stroke-width="2"/><rect x="12" y="14" width="44" height="44" rx="10" fill="url(#g)"/><text x="34" y="47" text-anchor="middle" font-family="Impact,Arial Narrow,sans-serif" font-size="32" font-weight="700" fill="#1a1206">T</text><text x="68" y="33" font-family="Arial,sans-serif" font-size="11" font-weight="700" letter-spacing="1.5" fill="#ffd98a">TOP BAR TRÊN</text><text x="68" y="55" font-family="Impact,Arial Narrow,sans-serif" font-size="22" letter-spacing="1" fill="#ffffff">TOPCHILL.VN</text></svg>`);
}

/* ---------- 10. Khu viết bài ---------- */
function editorPage() {
  const tpl = fs.readFileSync(path.join(ROOT, 'src/editor.html'), 'utf8');
  const data = { repo: CFG.repo, branch: CFG.branch, site: SITE, base: BASE,
    posts: POSTS.map(p => ({ slug: p.slug, title: p.title, file: p.file, keyword: p.keyword, updated: p.updated })),
    bars: BARS.map(b => ({ slug: b.slug, name: b.name, city: cityOf(b.city).name, path: b.path })),
    cities: CITIES.filter(c => BARS.some(b => b.city === c.id)).map(c => ({ id: c.id, name: c.name, path: c.path })) };
  const body = tpl.replace('/*__EDITOR_DATA__*/null', JSON.stringify(data));
  write('viet-bai/index.html', `<!doctype html>
<html lang="vi">
<head>
${headTags({ title: 'Khu viết bài – TopChill', desc: 'Soạn bài viết chuẩn SEO cho TopChill.', pathRel: 'viet-bai/', noindex: true })}
</head>
<body>
${header('')}
${body}
</body>
</html>
`);
}

/* ---------- 10b. Trang quản lý bar ---------- */
function adminPage() {
  const tpl = fs.readFileSync(path.join(ROOT, 'src/admin.html'), 'utf8');
  const data = { repo: CFG.repo, branch: CFG.branch, cities: CITIES.map(c => ({ id: c.id, name: c.name })), types: Object.keys(MENU) };
  write('quan-ly/index.html', `<!doctype html>
<html lang="vi">
<head>
${headTags({ title: 'Quản lý bar – TopChill', desc: 'Trang quản lý nội bộ.', pathRel: 'quan-ly/', noindex: true })}
</head>
<body>
${header('')}
${tpl.replace('/*__ADMIN_DATA__*/null', JSON.stringify(data))}
</body>
</html>
`);
}

/* ---------- 11. Trang chủ (app) ---------- */
function homePage() {
  let body = APP.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '');
  body = body.replace(/<title>[^<]*<\/title>\n?/, '');
  const citiesWithBars = CITIES.filter(c => BARS.some(b => b.city === c.id));
  const seoBlock = (POSTS.length ? `<section class="block"><div class="wrap">
    <div class="sec-head"><div><div class="eyebrow">Cẩm nang đi bar</div><h2>Kinh nghiệm &amp; review bar</h2></div><a class="lnk" href="${href('blog/')}">Xem tất cả bài viết →</a></div>
    <div class="grid">${POSTS.slice(0, 3).map(p => `<a class="card" href="${href(p.path)}" style="text-decoration:none"><div class="art"><img class="ph" src="${esc(UNS(p.cover, 700))}" data-c="${esc(POOL.cocktail[0])}" data-w="700" data-seed="${p.title.length}" data-hue="${p.title.length * 13 % 360}" alt="${esc(p.coverAlt)}" loading="lazy" decoding="async"></div><div class="card-body"><h3 style="font-size:21px">${esc(p.title)}</h3><p class="bonus">${esc(p.description)}</p></div></a>`).join('')}</div>
  </div></section>` : '') + `
  <section class="block"><div class="wrap">
    <div class="sec-head"><div><div class="eyebrow">Đặt bàn bar toàn quốc</div><h2>Bar Hà Nội, Sài Gòn và 12 thành phố</h2></div></div>
    <p class="muted" style="max-width:75ch;margin-bottom:16px">TopChill là nền tảng đặt bàn bar, lounge, club tại Việt Nam. Bạn xem danh sách bar theo thành phố, địa chỉ, giá tham khảo, giờ mở cửa, rồi gọi, nhắn Zalo hoặc để lại số để tổng đài giữ bàn, không cần cọc. Thành viên được giảm đến 10% bill tại bar đối tác theo hạng.</p>
    <div class="rail" style="flex-wrap:wrap">${citiesWithBars.map(c => `<a class="chip" href="${href(c.path)}">Bar ${esc(c.name)} <small>${c.n}</small></a>`).join('')}</div>
    <h3 style="margin:22px 0 10px;font-size:17px">Theo khu vực</h3>
    <div class="rail" style="flex-wrap:wrap">${AREAS.slice().sort((x, y) => y.bars.length - x.bars.length).map(x => `<a class="chip" href="${href(x.path)}">Bar ${esc(x.name)} <small>${x.bars.length}</small></a>`).join('')}</div>
    <h3 style="margin:22px 0 10px;font-size:17px">Tìm theo loại hình</h3>
    <div class="rail" style="flex-wrap:wrap">${Object.values(LAND).sort((x, y) => y.bars.length - x.bars.length).slice(0, 24).map(x => `<a class="chip" href="${href(x.path)}">${esc(x.name)} <small>${x.bars.length}</small></a>`).join('')}</div>
  </div></section>`;
  body = body.replace('<!--SEO_HOME-->', seoBlock);
  const i = body.indexOf('</style>') + 8;
  const title = 'TopChill – Đặt bàn bar, club, lounge toàn quốc, không cần cọc';
  const desc = `${BARS.length} bar, club, lounge tại 12 thành phố, ảnh thật, giá tham khảo. Gọi ${CFG.hotline} hoặc để lại số, tổng đài giữ bàn 24/7, không cần cọc.`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE + '/#website', name: CFG.siteName, alternateName: 'TopChill.vn', url: SITE + '/', inLanguage: 'vi-VN', publisher: { '@id': SITE + '/#org' } },
    { '@context': 'https://schema.org', ...ORG, contactPoint: { '@type': 'ContactPoint', telephone: CFG.hotline, contactType: 'customer service', areaServed: 'VN', availableLanguage: 'Vietnamese' } },
  ];
  const head = headTags({ title, desc, pathRel: '', image: '/logo-topchill.jpg', ld })
    .replace(/<link rel="stylesheet" href="[^"]*site\.css[^"]*">\n/, '')
    .replace(/<link rel="preconnect" href="https:\/\/fonts[^\n]*\n/, '').replace(/<link rel="stylesheet" href="https:\/\/fonts[^\n]*\n/, '');
  write('index.html', `<!doctype html>
<html lang="vi">
<head>
${head}
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="TopChill">
<style>:root{color-scheme:dark}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
${body.slice(0, i)}
</head>
<body>
${body.slice(i)}
${CHAT_TAGS()}
</body>
</html>
`);
  const home = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
  for (const [dir, t, d] of APP_ROUTES) {
    write(dir + 'index.html', home
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(t)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(d)}`)
      .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(t)}`)
      .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(d)}`)
      .replace(/(<link rel="canonical" href=")[^"]*/, `$1${url(dir)}`)
      .replace(/(<meta property="og:url" content=")[^"]*/, `$1${url(dir)}`));
  }
}
const APP_ROUTES = [
  ['kham-pha/', 'Khám phá bar, club, lounge 12 thành phố – TopChill', 'Lọc bar theo thành phố, loại hình, xem ảnh thật, giá tham khảo và đặt bàn không cần cọc qua tổng đài TopChill 24/7.'],
  ['thanh-vien/', 'Hạng thành viên TopChill – ưu đãi đến 15% bill', 'Newbie hỗ trợ 24/7, không cần cọc. Silver giảm 5%, Vàng giảm 8% + rượu sinh nhật, Platinum giảm 10% bill tại bar đối tác.'],
  ['hoi-nhom/', 'Hội nhóm đi bar – TopChill', 'Rủ bạn đi bar, chia sẻ kinh nghiệm và hỏi đáp về bar, club, lounge cùng cộng đồng TopChill.'],
  ['chu-bar/', 'Dành cho chủ bar – đưa bar lên TopChill', 'Đăng bar lên TopChill, cập nhật ảnh, khuyến mãi và nhận khách đặt bàn qua tổng đài 24/7.'],
];

/* ---------- 12. 404, sitemap, robots ---------- */
function misc(pages) {
  write('404.html', page({ title: 'Không tìm thấy trang – TopChill', desc: 'Trang bạn tìm không tồn tại.', pathRel: '404.html', noindex: true }, `<div class="wrap narrow" style="padding-block:60px"><h1 style="font-size:44px;text-transform:uppercase">Không tìm thấy trang</h1><p class="muted" style="margin-top:12px">Đường dẫn có thể đã đổi. Chọn thành phố để tìm bar tối nay:</p><div class="citylinks" style="margin-top:16px">${CITIES.filter(x => BARS.some(b => b.city === x.id)).map(x => `<a href="${href(x.path)}">Bar ${esc(x.name)}</a>`).join('')}</div><p style="margin-top:20px"><a class="btn btn-gold" href="${href('')}">Về trang chủ</a></p></div>`));
  const urls = pages.filter(p => !p.noindex).map(p => `  <url><loc>${url(p.path)}</loc><lastmod>${p.lastmod || TODAY}</lastmod>${p.priority ? `<priority>${p.priority}</priority>` : ''}</url>`).join('\n');
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  write('robots.txt', INDEX
    ? `User-agent: *\nAllow: /\nDisallow: ${BASE}viet-bai/\nDisallow: ${BASE}quan-ly/\nDisallow: ${BASE}src/\nDisallow: ${BASE}content/\n\nSitemap: ${url('sitemap.xml')}\n`
    : `# Đang ở chế độ demo: chặn Google lập chỉ mục.\n# Bật "allowIndexing": true trong src/config.json khi đã có dữ liệu bar thật và tên miền chính thức.\nUser-agent: *\nDisallow: /\n`);
}

/* ---------- Nén & làm rối code đầu ra ---------- */
async function minifyAll() {
  let terser, htmlMin;
  try { terser = await import('terser'); htmlMin = (await import('html-minifier-terser')).minify; }
  catch (e) { console.log('Bỏ qua nén code (chưa cài terser, html-minifier-terser). Chạy: npm install'); return; }
  const banner = '/*! (c) TopChill.vn – Bảo lưu mọi quyền. Nghiêm cấm sao chép. */';
  const jsOpt = { compress: { passes: 2, drop_debugger: true }, mangle: true, format: { comments: false } };
  let saved = 0;
  for (const rel of GENERATED) {
    const f = path.join(OUT, rel); if (!fs.existsSync(f)) continue;
    const src = fs.readFileSync(f, 'utf8'); let out = src;
    try {
      if (rel.endsWith('.html')) {
        out = await htmlMin(src, { collapseWhitespace: true, conservativeCollapse: true, removeComments: true, minifyCSS: true,
          minifyJS: jsOpt, removeRedundantAttributes: true, useShortDoctype: true, keepClosingSlash: false, decodeEntities: false,
          ignoreCustomFragments: [/<script type="application\/ld\+json">[\s\S]*?<\/script>/] });
        out = out.replace('<head>', '<head><!-- (c) TopChill.vn – Bảo lưu mọi quyền. Nghiêm cấm sao chép giao diện và mã nguồn. -->');
      } else if (rel.endsWith('.js') && !rel.endsWith('sw.js')) {
        const r = await terser.minify(src, jsOpt); out = banner + '\n' + r.code;
      } else if (rel.endsWith('.css')) {
        out = banner + '\n' + src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim();
      } else continue;
    } catch (e) { console.log('Không nén được ' + rel + ': ' + e.message); continue; }
    saved += src.length - out.length; fs.writeFileSync(f, out);
  }
  console.log('Đã nén code, giảm ' + Math.round(saved / 1024) + ' KB.');
}

/* ---------- 13. Chạy ---------- */
// dọn đầu ra cũ (chỉ các thư mục do build quản lý)
if (OUT !== ROOT) fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const d of [...Object.values(LAND).map(x => x.path.replace(/\/$/, '')), ...AREAS.map(x => x.path.replace(/\/$/, '')), 'su-kien', 'bar', 'blog', 'viet-bai', 'huy-hieu', 'gioi-thieu', 'kham-pha', 'thanh-vien', 'hoi-nhom', 'chu-bar', 'assets', 'mau-bia', 'img', 'quan-ly', ...CITIES.map(c => c.slug)]) fs.rmSync(path.join(OUT, d), { recursive: true, force: true });
for (const f of fs.readdirSync(path.join(ROOT, 'public'))) { fs.copyFileSync(path.join(ROOT, 'public', f), path.join(OUT, f)); GENERATED.push(f); }
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'src/site.css'), path.join(OUT, 'assets/site.css'));
fs.copyFileSync(path.join(ROOT, 'src/chat.css'), path.join(OUT, 'assets/chat.css'));
fs.copyFileSync(path.join(ROOT, 'src/chat.js'), path.join(OUT, 'assets/chat.js'));
fs.copyFileSync(path.join(ROOT, 'src/music.js'), path.join(OUT, 'assets/music.js'));
fs.copyFileSync(path.join(ROOT, 'src/install.js'), path.join(OUT, 'assets/install.js'));
// ảnh bar đã up
{ const src = path.join(ROOT, 'content/img/bars'), dst = path.join(OUT, 'img/bars');
  const cp = (a, b) => { fs.mkdirSync(b, { recursive: true }); for (const f of fs.readdirSync(a, { withFileTypes: true })) { if (f.isDirectory()) cp(path.join(a, f.name), path.join(b, f.name)); else if (/\.(webp|jpe?g|png)$/i.test(f.name)) fs.copyFileSync(path.join(a, f.name), path.join(b, f.name)); } };
  if (fs.existsSync(src)) cp(src, dst); }
GENERATED.push('assets/site.css', 'assets/chat.css', 'assets/chat.js', 'assets/music.js', 'assets/install.js');
{
  const order = ranked(BARS);
  const data = { base: BASE, hotline: CFG.hotline, demo: !!CFG.chatDemo && !(CFG.tawkPropertyId && CFG.tawkWidgetId), zalo: CFG.zalo || '', messenger: CFG.messenger || '', telegram: CFG.telegram || '',
    tawkPropertyId: CFG.tawkPropertyId || '', tawkWidgetId: CFG.tawkWidgetId || '',
    cities: CITIES.map(c => ({ id: c.id, name: c.name })),
    bars: BARS.map(b => ({ id: b.id, name: b.name, slug: b.slug, city: b.city, cityName: cityOf(b.city).name, type: b.type, rating: b.rating, partner: P(b), price: b.price, priceKnown: b.priceKnown !== false, hoursKnown: b.hoursKnown !== false, deal: b.deal, gpct: b.gpct, gLabel: b.gLabel, hours: b.hours, bonus: b.bonus, rank: order.indexOf(b) })) };
  fs.writeFileSync(path.join(OUT, 'assets/chat-data.js'), 'window.TC_CHAT=' + JSON.stringify(data) + ';\n');
}

const pages = [{ path: '', priority: '1.0' }, { path: 'kham-pha/', priority: '0.9' }, { path: 'thanh-vien/', priority: '0.4' }, { path: 'chu-bar/', priority: '0.3' }];
homePage();
for (const c of CITIES) { const r = cityPage(c); pages.push({ path: r.path, noindex: r.noindex, priority: '0.9' }); }
for (const L of Object.values(LAND)) { landingPage(L); pages.push({ path: L.path, priority: '0.8' }); }
for (const A of AREAS) { areaPage(A); pages.push({ path: A.path, priority: '0.8' }); }
{ const ni = eventsPage(); pages.push({ path: 'su-kien/', priority: '0.7', noindex: ni }); }
for (const b of BARS) { barPage(b); pages.push({ path: b.path, priority: '0.7' }); }
blogIndex(); pages.push({ path: 'blog/', priority: '0.8' });
POSTS.forEach((p, i) => { postPage(p, i); pages.push({ path: p.path, lastmod: p.updated, priority: '0.8' }); });
badgePage(); pages.push({ path: 'huy-hieu/', priority: '0.3' });
aboutPage(); pages.push({ path: 'gioi-thieu/', priority: '0.5' });
editorPage();
adminPage();
{ // trang so sánh mẫu bìa (nội bộ, noindex)
  const src = fs.readFileSync(path.join(ROOT, 'src/mau-bia.html'), 'utf8').replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '');
  const i = src.indexOf('</style>') + 8;
  write('mau-bia/index.html', '<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<link rel="icon" href="' + href('icon.svg') + '" type="image/svg+xml">\n' + src.slice(0, i) + '\n</head>\n<body>\n' + src.slice(i) + '\n</body>\n</html>\n');
}
misc(pages);
write('_headers', `/*
  Content-Security-Policy: ${CSP}; frame-ancestors 'none'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin

/assets/*
  Cache-Control: public, max-age=86400

/*.png
  Cache-Control: public, max-age=604800

/viet-bai/*
  X-Robots-Tag: noindex, nofollow

/quan-ly/*
  X-Robots-Tag: noindex, nofollow
  Cache-Control: no-store
`);
await minifyAll();
console.log(`Đã build: ${CITIES.length} trang thành phố, ${BARS.length} trang bar, ${POSTS.length} bài viết. Lập chỉ mục: ${INDEX ? 'BẬT' : 'TẮT (demo)'}.`);
