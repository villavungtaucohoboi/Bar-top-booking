/* TopChill – Ghép bàn trực tiếp.
 * Kênh: ntfy.sh (công khai, tin tự xoá sau 12h) – mọi thông tin riêng đều MÃ HOÁ đầu-cuối:
 *  - SĐT chủ bàn: chỉ admin đọc được; người xin vào chỉ thấy sau khi được duyệt.
 *  - SĐT người xin vào: chỉ chủ bàn và admin đọc được.
 *  - Chat trong bàn: khoá riêng của bàn, chỉ chủ bàn, người đã được duyệt và admin đọc được.
 * Chủ bàn/admin duyệt bằng chữ ký ECDSA. Trang quản trị dùng lại file này (GB_CFG.admin = true). */
(function () {
  var C = window.GB_CFG || {}, NT = C.nt || '', CN = C.cities || {}, B = C.bars || [], TEL = C.tel || '', HOT = C.hotline || '', AP = C.adminPub || null, ADMIN = !!C.admin;
  var $ = function (id) { return document.getElementById(id); };
  var list = $('gbList'), doneBox = $('gbDone'), doneSec = $('da-ghep'), f = $('gbForm'), m = $('gbMsg');
  if (!list) return;
  var SUB = window.crypto && crypto.subtle;
  function vn() { return new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); }
  function E(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function W(a, b) { a = +a || 0; b = +b || 0; return [a ? a + ' nam' : '', b ? b + ' nữ' : ''].filter(Boolean).join(' + ') || '—'; }
  function n20(v) { v = Math.floor(+v || 0); return v < 0 ? 0 : v > 20 ? 20 : v; }
  function rnd(n) { var s = ''; while (s.length < n) s += Math.random().toString(36).slice(2).toUpperCase(); return s.slice(0, n); }
  function ld(k, d) { try { return JSON.parse(localStorage.getItem(k) || 'null') || d; } catch (e) { return d; } }
  function sv(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function fmtPh(p) { p = String(p || ''); return p.replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3'); }
  var BAD = /(\d[\s.\-]?){8,}|https?:|zalo|facebook|fb\.|t\.me|@/i;
  var own = ld('tc-own2', {}), mine = ld('tc-join2', {}), AK = ADMIN ? ld('tc-admin', null) : null;
  var posts = {}, joins = {}, decs = {}, msgs = {}, hides = {}, cur = '';
  var okv = {}, jph = {}, myBox = {}, adm = {}, tkey = {}, plain = {}, hidden = {}, busy = {};

  /* ---------- mã hoá ---------- */
  var EC = { name: 'ECDSA', namedCurve: 'P-256' }, DH = { name: 'ECDH', namedCurve: 'P-256' }, SG = { name: 'ECDSA', hash: 'SHA-256' };
  function b64(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); }
  function ub64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function T(s) { return new TextEncoder().encode(s); }
  function pubOf(j) { return { x: j.x, y: j.y }; }
  function impPub(p, alg, use) { return SUB.importKey('jwk', { kty: 'EC', crv: 'P-256', x: p.x, y: p.y, ext: true }, alg, false, use); }
  function impPriv(j, alg, use) { var k = Object.assign({}, j); delete k.key_ops; return SUB.importKey('jwk', k, alg, false, use); }
  function shared(priv, pub) { return Promise.all([impPriv(priv, DH, ['deriveKey']), impPub(pub, DH, [])]).then(function (k) { return SUB.deriveKey({ name: 'ECDH', public: k[1] }, k[0], { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); }); }
  function enc(key, obj) { var iv = crypto.getRandomValues(new Uint8Array(12)); return SUB.encrypt({ name: 'AES-GCM', iv: iv }, key, T(JSON.stringify(obj))).then(function (c) { return { iv: b64(iv), ct: b64(c) }; }); }
  function dec(key, box) { return SUB.decrypt({ name: 'AES-GCM', iv: ub64(box.iv) }, key, ub64(box.ct)).then(function (b) { return JSON.parse(new TextDecoder().decode(b)); }); }
  function rawKey(s) { return SUB.importKey('raw', ub64(s), 'AES-GCM', false, ['encrypt', 'decrypt']); }
  function gen(alg, use) { return SUB.generateKey(alg, true, use).then(function (kp) { return Promise.all([SUB.exportKey('jwk', kp.publicKey), SUB.exportKey('jwk', kp.privateKey)]); }); }
  function sign(priv, s) { return impPriv(priv, EC, ['sign']).then(function (k) { return SUB.sign(SG, k, T(s)); }).then(b64); }
  function verify(pub, s, sig) { return impPub(pub, EC, ['verify']).then(function (k) { return SUB.verify(SG, k, ub64(sig), T(s)); }); }

  /* ---------- nhận tin ---------- */
  function validPost(g) {
    if (!g || !/^GB-[A-Z0-9]{4}$/.test(g.code) || !CN[g.city] || !/^\d{4}-\d{2}-\d{2}$/.test(g.date) || !/^\d{2}:\d{2}$/.test(g.time)) return false;
    ['haveNam', 'haveNu', 'needNam', 'needNu'].forEach(function (k) { g[k] = n20(g[k]); });
    g.note = String(g.note || '').slice(0, 140); g.age = String(g.age || '').slice(0, 20);
    return g.needNam + g.needNu > 0 && !BAD.test(g.note) && !BAD.test(g.age);
  }
  function ingest(o) {
    if (!o || typeof o !== 'object') return; var t = o.t || 'post', k;
    if (t === 'post') { if (validPost(o) && !posts[o.code]) posts[o.code] = o; }
    else if (t === 'join') {
      if (!/^GB-[A-Z0-9]{4}$/.test(o.code) || !/^J[A-Z0-9]{5}$/.test(o.jid)) return;
      o.nam = n20(o.nam); o.nu = n20(o.nu); if (!(o.nam + o.nu) || o.nam + o.nu > 10) return;
      var a = joins[o.code] = joins[o.code] || []; if (!a.some(function (j) { return j.jid === o.jid; })) a.push(o);
    } else if (t === 'dec') { k = o.code + '|' + o.jid; if (o.code && o.jid && typeof o.sig === 'string' && !decs[k]) decs[k] = o; }
    else if (t === 'msg') { if (o.code && o.mid && o.box && !(msgs[o.code] = msgs[o.code] || []).some(function (x) { return x.mid === o.mid; })) msgs[o.code].push(o); }
    else if (t === 'hide') { if (o.code && o.sig) hides[o.code] = o; }
  }
  (C.static || []).forEach(ingest);

  /* xử lý bất đồng bộ: kiểm chữ ký, giải mã những gì máy này được phép đọc */
  function process() {
    if (!SUB) return Promise.resolve();
    var jobs = [];
    Object.keys(hides).forEach(function (code) { if (hidden[code] === undefined && AP) jobs.push(verify(AP.s, 'hide|' + code, hides[code].sig).then(function (v) { hidden[code] = v; }).catch(function () { hidden[code] = false; })); });
    Object.keys(decs).forEach(function (k) {
      if (k in okv) return; var d = decs[k], p = posts[d.code]; if (!p) return;
      var pk = d.by === 'a' ? (AP && AP.s) : p.pk; if (!pk) return;
      jobs.push(verify(pk, d.code + '|' + d.jid + '|' + (d.ok ? 1 : 0), d.sig).then(function (v) { if (v) okv[k] = !!d.ok; }).catch(function () {}));
    });
    return Promise.all(jobs).then(function () {
      var j2 = [];
      Object.keys(own).forEach(function (code) { (joins[code] || []).forEach(function (j) { var k = code + '|' + j.jid; if (jph[k] || !j.dh || !j.own) return; j2.push(shared(own[code].d, j.dh).then(function (key) { return dec(key, j.own); }).then(function (o) { jph[k] = o.phone; }).catch(function () {})); }); if (own[code].k && !tkey[code]) j2.push(rawKey(own[code].k).then(function (kk) { tkey[code] = kk; })); });
      Object.keys(mine).forEach(function (jid) {
        var me = mine[jid], k = me.c + '|' + jid, d = decs[k], p = posts[me.c];
        if (myBox[jid] || !d || okv[k] !== true || !d.box || !p) return;
        var pub = d.by === 'a' ? (AP && AP.d) : p.dh; if (!pub) return;
        j2.push(shared(me.d, pub).then(function (key) { return dec(key, d.box); }).then(function (o) { myBox[jid] = o; return rawKey(o.k).then(function (kk) { tkey[me.c] = kk; }); }).catch(function () {}));
      });
      if (AK) {
        Object.keys(posts).forEach(function (code) { var p = posts[code]; if (adm[code] || !p.adm || !p.dh) return; j2.push(shared(AK.d, p.dh).then(function (key) { return dec(key, p.adm); }).then(function (o) { adm[code] = o; return o.k ? rawKey(o.k).then(function (kk) { tkey[code] = kk; }) : 0; }).catch(function () {})); });
        Object.keys(joins).forEach(function (code) { joins[code].forEach(function (j) { var k = code + '|' + j.jid; if (jph[k] || !j.adm || !j.dh) return; j2.push(shared(AK.d, j.dh).then(function (key) { return dec(key, j.adm); }).then(function (o) { jph[k] = o.phone; }).catch(function () {})); }); });
      }
      return Promise.all(j2);
    }).then(function () {
      var j3 = [];
      Object.keys(msgs).forEach(function (code) { if (!tkey[code]) return; msgs[code].forEach(function (x) { if (plain[x.mid]) return; j3.push(dec(tkey[code], x.box).then(function (o) { plain[x.mid] = o; }).catch(function () { plain[x.mid] = { bad: 1 }; })); }); });
      return Promise.all(j3);
    });
  }
  function stat(p) {
    var got = [0, 0], pend = [], acc = [];
    (joins[p.code] || []).forEach(function (j) { var a = okv[p.code + '|' + j.jid]; if (a === true) { got[0] += j.nam; got[1] += j.nu; acc.push(j); } else if (a === undefined) pend.push(j); });
    var ln = Math.max(0, p.needNam - got[0]), lu = Math.max(0, p.needNu - got[1]);
    return { ln: ln, lu: lu, full: !ln && !lu, pend: pend, acc: acc, got: got[0] + got[1], need: p.needNam + p.needNu };
  }
  function myJid(code) { return Object.keys(mine).filter(function (j) { return mine[j].c === code; })[0]; }
  function member(code) { return !!(own[code] || (AK && adm[code]) || (myJid(code) && okv[code + '|' + myJid(code)] === true)); }

  /* ---------- vẽ ---------- */
  function barOf(id) { return B.filter(function (x) { return x[0] === +id; })[0]; }
  function where(p) { var b = barOf(p.barId); return (b ? '<a href="' + b[3] + '">' + E(b[2]) + '</a> · ' : 'Chưa chọn quán · ') + E(CN[p.city] || ''); }
  function telA(ph) { return '<a class="gb-ph" href="tel:' + E(ph) + '">📞 ' + E(fmtPh(ph)) + '</a>'; }
  function who(code, from) { if (from === 'o') return 'Chủ bàn'; if (from === 'a') return 'Tổng đài'; var j = (joins[code] || []).filter(function (x) { return x.jid === from; })[0]; return j ? 'Nhóm ' + W(j.nam, j.nu) : 'Thành viên'; }
  function meId(code) { return own[code] ? 'o' : (AK && adm[code]) ? 'a' : myJid(code); }
  function chatLog(code) {
    var me = meId(code), L = (msgs[code] || []).slice().sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
    var out = L.map(function (x) { var o = plain[x.mid]; if (!o || o.bad) return ''; var mm = x.from === me; return '<div class="gb-m' + (mm ? ' me' : '') + '"><small>' + E(mm ? 'Bạn' : who(code, x.from)) + '</small>' + E(o.text) + '</div>'; }).join('');
    return out || '<p class="gb-meta">Chưa có tin nhắn. Hẹn giờ, chỗ gặp ở đây (chỉ người trong bàn thấy).</p>';
  }
  function card(p) {
    var s = stat(p), code = p.code, isOwn = !!own[code], jid = myJid(code), isAdm = !!(AK && ADMIN);
    var pct = s.need ? Math.min(100, Math.round(s.got / s.need * 100)) : 0, h = '';
    h += '<article class="gb-card' + (s.full ? ' done' : '') + (isOwn ? ' own' : '') + '" data-city="' + E(p.city) + '" data-code="' + E(code) + '">';
    h += '<div class="gb-top"><span class="gb-code">' + E(code) + (isOwn ? ' <span class="gb-mine">Bàn của bạn</span>' : '') + '</span><span class="gb-when">📅 ' + E(p.date.split('-').reverse().join('/')) + ' · ' + E(p.time) + '</span></div>';
    h += '<h3><span class="gb-have">Bàn ' + E(W(p.haveNam, p.haveNu)) + '</span> ' + (s.full ? '<span class="gb-okt">✅ ĐÃ ĐỦ NGƯỜI</span>' : '<span class="gb-need">đang thiếu ' + E(W(s.ln, s.lu)) + '</span>') + '</h3>';
    h += '<div class="gb-prog"><i style="width:' + pct + '%"></i></div>';
    h += '<p class="gb-where">📍 ' + where(p) + '</p>' + (p.age ? '<p class="gb-meta">Độ tuổi: ' + E(p.age) + '</p>' : '') + (p.note ? '<p class="gb-note">“' + E(p.note) + '”</p>' : '');
    if (isAdm) h += '<div class="gb-adm">🛡️ Chủ bàn: ' + (adm[code] && adm[code].phone ? telA(adm[code].phone) : '<i>không đọc được</i>') + ' <button type="button" class="gb-no" data-hide="1">Ẩn tin</button></div>';
    if (isOwn || isAdm) {
      h += '<div class="gb-own"><b>Yêu cầu xin vào bàn</b>';
      if (s.pend.length) h += s.pend.map(function (j) { var ph = jph[code + '|' + j.jid]; return '<div class="gb-req"><span>🙋 ' + E(W(j.nam, j.nu)) + (ph ? '<br>' + telA(ph) : '') + '</span><button type="button" class="gb-yes" data-dec="1" data-jid="' + E(j.jid) + '">Duyệt</button><button type="button" class="gb-no" data-dec="0" data-jid="' + E(j.jid) + '">Từ chối</button></div>'; }).join('');
      else h += '<p class="gb-meta">' + (s.full ? 'Bàn đã đủ người.' : 'Chưa có yêu cầu mới. Trang tự cập nhật.') + '</p>';
      if (s.acc.length) h += '<p class="gb-meta">Đã duyệt:</p>' + s.acc.map(function (j) { var ph = jph[code + '|' + j.jid]; return '<div class="gb-req"><span>✅ ' + E(W(j.nam, j.nu)) + (ph ? ' · ' + telA(ph) : '') + '</span></div>'; }).join('');
      h += '</div>';
    } else if (jid) {
      var a = okv[code + '|' + jid], bx = myBox[jid];
      h += '<div class="gb-st ' + (a === true ? 'y' : a === false ? 'n' : '') + '">' + (a === true ? '✅ Đã được duyệt vào bàn!' + (bx && bx.phone ? '<br>Liên hệ chủ bàn: ' + telA(bx.phone) : '') : a === false ? 'Chủ bàn chưa đồng ý lần này. Thử bàn khác nhé.' : '⏳ Đã gửi yêu cầu, đang chờ chủ bàn duyệt…') + '</div>';
    } else if (!s.full) {
      h += '<button type="button" class="gb-join" data-open="1">🙋 Xin vào bàn</button>';
      h += '<form class="gb-jf" hidden><div class="gb-g2"><label>Nam<input type="number" name="nam" min="0" max="10" value="' + Math.min(s.ln, 10) + '"></label><label>Nữ<input type="number" name="nu" min="0" max="10" value="' + Math.min(s.lu, 10) + '"></label></div>'
        + '<label>Số điện thoại <small>(chỉ chủ bàn và tổng đài thấy)</small><input name="phone" type="tel" inputmode="tel" maxlength="15" placeholder="09xx xxx xxx"></label>'
        + '<label class="gb-chk"><input type="checkbox" name="adult"> Đủ 18 tuổi, đồng ý quy định ghép bàn</label><button type="submit" class="gb-join">Gửi yêu cầu cho chủ bàn</button><p class="gb-msg"></p></form>';
    }
    if (member(code)) h += '<div class="gb-chat"><b>💬 Chat trong bàn</b><div class="gb-log">' + chatLog(code) + '</div><form class="gb-cf"><input name="t" maxlength="300" placeholder="Nhắn cho cả bàn…" autocomplete="off"><button type="submit">Gửi</button></form></div>';
    h += '<a class="gb-tel" href="tel:' + TEL + '">📞 Tổng đài ' + E(HOT) + '</a></article>';
    return h;
  }
  function typing() { var a = document.activeElement; return (a && list.contains(a) && /INPUT|TEXTAREA/.test(a.tagName)) || !!list.querySelector('.gb-jf:not([hidden])'); }
  function render(force) {
    if (!force && typing()) { [].forEach.call(list.querySelectorAll('.gb-card'), function (c) { var lg = c.querySelector('.gb-log'); if (lg) { lg.innerHTML = chatLog(c.dataset.code); lg.scrollTop = 1e6; } }); return; }
    var t = vn(), all = Object.keys(posts).map(function (k) { return posts[k]; }).filter(function (p) { return p.date >= t && !hidden[p.code]; })
      .sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
    var open = all.filter(function (p) { return ADMIN || !stat(p).full || own[p.code] || myJid(p.code); }), done = all.filter(function (p) { return stat(p).full; });
    var cities = {}; open.forEach(function (p) { cities[p.city] = 1; });
    var F = $('gbFilter'); if (F) F.innerHTML = '<button type="button" data-c=""' + (cur ? '' : ' class="on"') + '>Tất cả</button>' + Object.keys(CN).filter(function (k) { return cities[k]; }).map(function (k) { return '<button type="button" data-c="' + k + '"' + (cur === k ? ' class="on"' : '') + '>' + E(CN[k]) + '</button>'; }).join('');
    var mineFirst = function (p) { return own[p.code] || myJid(p.code) ? 0 : 1; };
    var shown = open.filter(function (p) { return !cur || p.city === cur; }).sort(function (a, b) { return mineFirst(a) - mineFirst(b); });
    list.innerHTML = shown.map(card).join('');
    [].forEach.call(list.querySelectorAll('.gb-log'), function (lg) { lg.scrollTop = 1e6; });
    var em = $('gbEmpty'); if (em) em.hidden = !!shown.length;
    if (doneBox) {
      var okl = (C.okList || []).concat(done.map(function (p) { var s = stat(p); return { summary: 'Bàn ' + W(p.haveNam, p.haveNu) + ' + ' + s.acc.map(function (j) { return W(j.nam, j.nu); }).join(' + '), where: where(p), date: p.date, time: p.time }; }));
      doneBox.innerHTML = okl.map(function (g) { return '<div class="gb-okc"><span class="gb-okb">✅ ĐÃ GHÉP</span><b>' + E(g.summary) + '</b><span>📍 ' + (g.where || E(g.place || '')) + ' · ' + E(g.date.split('-').reverse().join('/')) + (g.time ? ' · ' + E(g.time) : '') + '</span></div>'; }).join('');
      doneSec.hidden = !okl.length; var c = $('gbDoneN'); if (c) c.textContent = okl.length + ' lượt';
    }
    var st = $('gbAdmStat'); if (st) st.textContent = all.length + ' bàn đang mở · ' + Object.keys(joins).reduce(function (n, k) { return n + joins[k].length; }, 0) + ' yêu cầu xin vào · ' + done.length + ' bàn đủ người';
  }

  /* ---------- mạng ---------- */
  function pub(o, title) { if (!NT) return Promise.reject(0); o.ts = Date.now(); var q = title ? '?title=' + encodeURIComponent(title) + '&tags=beers' : ''; return fetch('https://ntfy.sh/' + NT + q, { method: 'POST', body: JSON.stringify(o) }).then(function (r) { if (!r.ok) throw 0; ingest(o); return 1; }); }
  function pull() {
    if (!NT) { render(); return Promise.resolve(); }
    return fetch('https://ntfy.sh/' + NT + '/json?poll=1&since=12h').then(function (r) { return r.text(); }).then(function (t) {
      t.split('\n').forEach(function (l) { try { var o = JSON.parse(l); if (o.event === 'message') { var x = JSON.parse(o.message); if (!x.ts) x.ts = o.time * 1000; ingest(x); } } catch (e) {} });
      return process();
    }).then(function () { render(); }).catch(function () { render(); });
  }
  pull(); setInterval(function () { if (document.visibilityState !== 'hidden') pull(); }, 10000);
  window.GBPull = pull;

  /* ---------- tương tác ---------- */
  if ($('gbFilter')) $('gbFilter').onclick = function (e) { var b = e.target.closest('[data-c]'); if (!b) return; cur = b.dataset.c; render(true); };
  list.addEventListener('click', function (e) {
    var cardEl = e.target.closest('.gb-card'); if (!cardEl) return; var code = cardEl.dataset.code;
    var op = e.target.closest('[data-open]'); if (op) { cardEl.querySelector('.gb-jf').hidden = false; op.hidden = true; return; }
    var d = e.target.closest('[data-dec]'); if (d) return decide(code, d.dataset.jid, d.dataset.dec === '1', d);
    if (e.target.closest('[data-hide]') && AK && confirm('Ẩn tin ' + code + ' khỏi bảng ghép bàn?')) sign(AK.s, 'hide|' + code).then(function (sig) { return pub({ t: 'hide', code: code, sig: sig }); }).then(function () { hidden[code] = true; render(true); }).catch(function () { alert('Chưa ẩn được, thử lại.'); });
  });
  list.addEventListener('submit', function (e) {
    e.preventDefault();
    var cf = e.target.closest('.gb-cf'); if (cf) return sendChat(cf);
    var jf = e.target.closest('.gb-jf'); if (jf) return sendJoin(jf);
  });
  function sendChat(cf) {
    var code = cf.closest('.gb-card').dataset.code, text = cf.t.value.trim().slice(0, 300); if (!text || !tkey[code] || busy.chat) return;
    busy.chat = 1; var mid = 'M' + rnd(8), from = meId(code);
    enc(tkey[code], { text: text }).then(function (box) { plain[mid] = { text: text }; return pub({ t: 'msg', code: code, mid: mid, from: from, box: box }, 'Tin nhắn bàn ' + code); })
      .then(function () { cf.t.value = ''; busy.chat = 0; render(true); var i = list.querySelector('[data-code="' + code + '"] .gb-cf input'); if (i) i.focus(); })
      .catch(function () { busy.chat = 0; alert('Chưa gửi được tin nhắn, thử lại.'); });
  }
  function sendJoin(jf) {
    var code = jf.closest('.gb-card').dataset.code, p = posts[code], msg = jf.querySelector('.gb-msg');
    function bad(s) { msg.textContent = s; msg.className = 'gb-msg bad'; }
    var nam = n20(jf.nam.value), nu = n20(jf.nu.value), ph = jf.phone.value.replace(/\D/g, '');
    if (!(nam + nu) || nam + nu > 10) return bad('Chọn số người nhóm bạn (1–10).');
    if (!/^(0|84)\d{9}$/.test(ph)) return bad('Nhập số điện thoại hợp lệ.');
    if (!jf.adult.checked) return bad('Vui lòng xác nhận đủ 18 tuổi.');
    if (!SUB || !p.dh) return bad('Trình duyệt chưa hỗ trợ. Gọi ' + HOT + ' và đọc mã ' + code + '.');
    var R = ld('tc-jn', {}), day = vn(); if ((R[day] || 0) >= 5) return bad('Mỗi máy gửi tối đa 5 yêu cầu/ngày.');
    msg.textContent = 'Đang gửi…'; msg.className = 'gb-msg';
    var jid = 'J' + rnd(5);
    gen(DH, ['deriveKey']).then(function (kp) {
      return Promise.all([shared(kp[1], p.dh).then(function (k) { return enc(k, { phone: ph }); }), AP ? shared(kp[1], AP.d).then(function (k) { return enc(k, { phone: ph }); }) : null]).then(function (bx) {
        var o = { t: 'join', code: code, jid: jid, nam: nam, nu: nu, dh: pubOf(kp[0]), own: bx[0] }; if (bx[1]) o.adm = bx[1];
        return pub(o, 'Xin vào bàn ' + code + ': ' + W(nam, nu)).then(function () { mine[jid] = { c: code, d: kp[1] }; sv('tc-join2', mine); R[day] = (R[day] || 0) + 1; sv('tc-jn', R); render(true); try { window.tcConv && tcConv('form'); gtag('event', 'generate_lead', { method: 'ghep_ban_join' }); } catch (er) {} });
      });
    }).catch(function () { bad('Chưa gửi được. Gọi ' + HOT + ' và đọc mã ' + code + '.'); });
  }
  function decide(code, jid, yes, btn) {
    var p = posts[code], asAdm = !own[code] && AK && ADMIN, j = (joins[code] || []).filter(function (x) { return x.jid === jid; })[0];
    if (!p || !j || !SUB || (!own[code] && !asAdm)) return; btn.disabled = true;
    var sPriv = asAdm ? AK.s : own[code].s, dPriv = asAdm ? AK.d : own[code].d;
    var info = asAdm ? adm[code] : { phone: own[code].ph, k: own[code].k };
    var boxP = yes && j.dh && info && info.k ? shared(dPriv, j.dh).then(function (k) { return enc(k, { phone: info.phone || '', k: info.k }); }) : Promise.resolve(null);
    Promise.all([sign(sPriv, code + '|' + jid + '|' + (yes ? 1 : 0)), boxP]).then(function (r) {
      var d = { t: 'dec', code: code, jid: jid, ok: yes ? 1 : 0, sig: r[0] }; if (asAdm) d.by = 'a'; if (r[1]) d.box = r[1];
      return pub(d, (yes ? '✅ Duyệt' : 'Từ chối') + ' vào bàn ' + code).then(function () { okv[code + '|' + jid] = yes; render(true); });
    }).catch(function () { btn.disabled = false; alert('Chưa gửi được, thử lại.'); });
  }

  /* ---------- đăng bàn ---------- */
  if (!f) return;
  var cs = f.city, bs = f.bar, t0 = vn();
  function fill() { bs.innerHTML = '<option value="">Chưa chọn, nhờ tổng đài gợi ý</option>' + B.filter(function (x) { return x[1] === cs.value; }).map(function (x) { return '<option value="' + x[0] + '">' + E(x[2]) + '</option>'; }).join(''); }
  fill(); cs.onchange = fill; f.date.value = t0; f.date.min = t0;
  var q = $('gbQuick'); if (q) q.onclick = function (e) { var b = e.target.closest('[data-q]'); if (!b) return; var v = b.dataset.q.split(','); f.needNam.value = v[0]; f.needNu.value = v[1]; };
  f.onsubmit = function (e) {
    e.preventDefault(); if (f.botcheck.checked) return;
    function bad(s) { m.textContent = s; m.className = 'gb-msg bad'; }
    var ph = f.phone.value.replace(/\D/g, '');
    if (!/^(0|84)\d{9}$/.test(ph)) return bad('Nhập số điện thoại hợp lệ (chỉ hiện cho người được bạn duyệt).');
    if (!(+f.needNam.value || +f.needNu.value)) return bad('Chọn số người cần ghép thêm.');
    if (!f.adult.checked || !f.rules.checked) return bad('Vui lòng xác nhận đủ 18 tuổi và đồng ý quy định.');
    if (BAD.test(f.note.value) || BAD.test(f.age.value)) return bad('Ghi chú không được chứa số điện thoại, link hay tài khoản mạng xã hội.');
    if (!SUB) return bad('Trình duyệt chưa hỗ trợ. Gọi ' + HOT + ' để tổng đài đăng giúp.');
    var R = ld('tc-gb', {}), day = vn(); if ((R[day] || 0) >= 3) return bad('Mỗi máy đăng tối đa 3 bàn/ngày.');
    var code = 'GB-' + rnd(4), tk = b64(crypto.getRandomValues(new Uint8Array(32)));
    var p = { t: 'post', code: code, city: cs.value, barId: +bs.value || 0, date: f.date.value, time: f.time.value, age: f.age.value.trim().slice(0, 20), haveNam: n20(f.haveNam.value), haveNu: n20(f.haveNu.value), needNam: n20(f.needNam.value), needNu: n20(f.needNu.value), note: f.note.value.trim().slice(0, 140) };
    m.textContent = 'Đang đăng…'; m.className = 'gb-msg';
    Promise.all([gen(EC, ['sign', 'verify']), gen(DH, ['deriveKey'])]).then(function (k) {
      p.pk = pubOf(k[0][0]); p.dh = pubOf(k[1][0]);
      return (AP ? shared(k[1][1], AP.d).then(function (key) { return enc(key, { phone: ph, k: tk }); }) : Promise.resolve(null)).then(function (box) {
        if (box) p.adm = box;
        return pub(p, 'Bàn mới ' + code + ': ' + W(p.haveNam, p.haveNu) + ' cần ' + W(p.needNam, p.needNu) + ' · ' + p.time + ' ' + (CN[p.city] || '')).then(function () {
          own[code] = { s: k[0][1], d: k[1][1], k: tk, ph: ph }; sv('tc-own2', own); R[day] = (R[day] || 0) + 1; sv('tc-gb', R);
          m.innerHTML = '✅ Đã đăng bàn <b>' + code + '</b>! Thẻ bàn của bạn ở đầu danh sách: ai xin vào, bạn thấy số điện thoại của họ và bấm <b>Duyệt</b>. Số của bạn chỉ hiện cho người được duyệt. Hãy dùng đúng máy này.';
          m.className = 'gb-msg ok'; f.reset(); f.date.value = t0; fill(); cur = ''; return process().then(function () { render(true); var el = list.querySelector('[data-code="' + code + '"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
        });
      });
    }).then(function () { try { window.tcConv && tcConv('form'); gtag('event', 'generate_lead', { method: 'ghep_ban' }); } catch (er) {} })
      .catch(function () { bad('Chưa đăng được. Gọi ' + HOT + ' để tổng đài đăng giúp.'); });
  };
})();
