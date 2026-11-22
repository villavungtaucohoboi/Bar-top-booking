/* TopChill – Ghép bàn: bảng tin trực tiếp (ntfy.sh, tự xoá sau 12h), xin vào bàn, chủ bàn duyệt (chữ ký ECDSA),
 * bàn đủ người tự vào mục "Bàn đã ghép". Cấu hình: window.GB_CFG (do build sinh). */
(function () {
  var C = window.GB_CFG || {}, NT = C.nt || '', K = C.w3f || '', CN = C.cities || {}, B = C.bars || [], TEL = C.tel || '', ZL = C.zalo || '', HOT = C.hotline || '';
  var $ = function (id) { return document.getElementById(id); };
  var list = $('gbList'), doneBox = $('gbDone'), doneSec = $('da-ghep'), f = $('gbForm'), m = $('gbMsg');
  if (!list) return;
  function vn() { return new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); }
  function E(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function W(a, b) { a = +a || 0; b = +b || 0; return [a ? a + ' nam' : '', b ? b + ' nữ' : ''].filter(Boolean).join(' + ') || '—'; }
  function n20(v) { v = Math.floor(+v || 0); return v < 0 ? 0 : v > 20 ? 20 : v; }
  function rnd(n) { var s = ''; while (s.length < n) s += Math.random().toString(36).slice(2).toUpperCase(); return s.slice(0, n); }
  function ld(k, d) { try { return JSON.parse(localStorage.getItem(k) || 'null') || d; } catch (e) { return d; } }
  function sv(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var BAD = /(\d[\s.\-]?){8,}|https?:|zalo|facebook|fb\.|t\.me|@/i;
  var own = ld('tc-own', {}), mine = ld('tc-join', {});
  var posts = {}, joins = {}, decs = {}, ok = {}, cur = '';

  function validPost(g) {
    if (!g || !/^GB-[A-Z0-9]{4}$/.test(g.code) || !CN[g.city] || !/^\d{4}-\d{2}-\d{2}$/.test(g.date) || !/^\d{2}:\d{2}$/.test(g.time)) return false;
    ['haveNam', 'haveNu', 'needNam', 'needNu'].forEach(function (k) { g[k] = n20(g[k]); });
    g.note = String(g.note || '').slice(0, 140); g.age = String(g.age || '').slice(0, 20);
    return g.needNam + g.needNu > 0 && !BAD.test(g.note) && !BAD.test(g.age);
  }
  function ingest(o) {
    if (!o || typeof o !== 'object') return;
    var t = o.t || 'post';
    if (t === 'post') { if (validPost(o) && !posts[o.code]) posts[o.code] = o; }
    else if (t === 'join') {
      if (!/^GB-[A-Z0-9]{4}$/.test(o.code) || !/^J[A-Z0-9]{5}$/.test(o.jid)) return;
      o.nam = n20(o.nam); o.nu = n20(o.nu); if (!(o.nam + o.nu) || o.nam + o.nu > 10) return;
      var a = joins[o.code] = joins[o.code] || []; if (!a.some(function (j) { return j.jid === o.jid; })) a.push(o);
    } else if (t === 'dec') { if (o.code && o.jid && typeof o.sig === 'string' && !decs[o.code + '|' + o.jid]) decs[o.code + '|' + o.jid] = o; }
  }
  (C.static || []).forEach(ingest);

  /* ---- chữ ký chủ bàn ---- */
  var SUB = window.crypto && crypto.subtle, KP = { name: 'ECDSA', namedCurve: 'P-256' }, SG = { name: 'ECDSA', hash: 'SHA-256' };
  function b64(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); }
  function ub64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function msgOf(code, jid, yes) { return new TextEncoder().encode(code + '|' + jid + '|' + (yes ? 1 : 0)); }
  function verifyAll() {
    if (!SUB) return Promise.resolve();
    return Promise.all(Object.keys(decs).map(function (k) {
      if (k in ok) return 0; var d = decs[k], p = posts[d.code]; if (!p || !p.pk) return 0;
      return SUB.importKey('jwk', { kty: 'EC', crv: 'P-256', x: p.pk.x, y: p.pk.y, ext: true }, KP, false, ['verify'])
        .then(function (key) { return SUB.verify(SG, key, ub64(d.sig), msgOf(d.code, d.jid, d.ok)); })
        .then(function (v) { if (v) ok[k] = !!d.ok; }).catch(function () {});
    }));
  }
  function stat(p) {
    var got = [0, 0], pend = [], acc = [];
    (joins[p.code] || []).forEach(function (j) { var a = ok[p.code + '|' + j.jid]; if (a === true) { got[0] += j.nam; got[1] += j.nu; acc.push(j); } else if (a === undefined) pend.push(j); });
    var ln = Math.max(0, p.needNam - got[0]), lu = Math.max(0, p.needNu - got[1]);
    return { ln: ln, lu: lu, full: !ln && !lu, pend: pend, acc: acc, got: got[0] + got[1], need: p.needNam + p.needNu };
  }

  /* ---- vẽ ---- */
  function barOf(id) { return B.filter(function (x) { return x[0] === +id; })[0]; }
  function where(p) { var b = barOf(p.barId); return (b ? '<a href="' + b[3] + '">' + E(b[2]) + '</a> · ' : 'Chưa chọn quán · ') + E(CN[p.city] || ''); }
  function card(p) {
    var s = stat(p), isOwn = !!own[p.code], myJ = Object.keys(mine).filter(function (j) { return mine[j] === p.code; })[0];
    var pct = s.need ? Math.min(100, Math.round(s.got / s.need * 100)) : 0, h = '';
    h += '<article class="gb-card' + (s.full ? ' done' : '') + (isOwn ? ' own' : '') + '" data-city="' + E(p.city) + '" data-code="' + E(p.code) + '">';
    h += '<div class="gb-top"><span class="gb-code">' + E(p.code) + (isOwn ? ' <span class="gb-mine">Bàn của bạn</span>' : '') + '</span><span class="gb-when">📅 ' + E(p.date.split('-').reverse().join('/')) + ' · ' + E(p.time) + '</span></div>';
    h += '<h3><span class="gb-have">Bàn ' + E(W(p.haveNam, p.haveNu)) + '</span> ' + (s.full ? '<span class="gb-okt">✅ ĐÃ ĐỦ NGƯỜI</span>' : '<span class="gb-need">đang thiếu ' + E(W(s.ln, s.lu)) + '</span>') + '</h3>';
    h += '<div class="gb-prog" title="Đã ghép ' + s.got + '/' + s.need + '"><i style="width:' + pct + '%"></i></div>';
    h += '<p class="gb-where">📍 ' + where(p) + '</p>' + (p.age ? '<p class="gb-meta">Độ tuổi: ' + E(p.age) + '</p>' : '') + (p.note ? '<p class="gb-note">“' + E(p.note) + '”</p>' : '');
    if (isOwn) {
      h += '<div class="gb-own"><b>Yêu cầu xin vào bàn</b>';
      if (s.pend.length) h += s.pend.map(function (j) { return '<div class="gb-req"><span>🙋 ' + E(W(j.nam, j.nu)) + ' <small>' + E(j.jid) + '</small></span><button type="button" class="gb-yes" data-dec="1" data-jid="' + E(j.jid) + '">Duyệt</button><button type="button" class="gb-no" data-dec="0" data-jid="' + E(j.jid) + '">Từ chối</button></div>'; }).join('');
      else h += '<p class="gb-meta">' + (s.full ? 'Bàn đã đủ người. Tổng đài sẽ gọi để chốt bàn chung.' : 'Chưa có yêu cầu mới. Trang tự cập nhật, bạn cứ để mở.') + '</p>';
      if (s.acc.length) h += '<p class="gb-meta">Đã duyệt: ' + s.acc.map(function (j) { return E(W(j.nam, j.nu)); }).join(', ') + '</p>';
      h += '</div>';
    } else if (myJ) {
      var a = ok[p.code + '|' + myJ];
      h += '<div class="gb-st ' + (a === true ? 'y' : a === false ? 'n' : '') + '">' + (a === true ? '✅ Chủ bàn đã duyệt! Tổng đài sẽ gọi bạn để ghép bàn.' : a === false ? 'Chủ bàn chưa đồng ý lần này. Thử bàn khác nhé.' : '⏳ Đã gửi yêu cầu, đang chờ chủ bàn duyệt…') + '</div>';
    } else if (!s.full) {
      h += '<button type="button" class="gb-join" data-open="1">🙋 Xin vào bàn</button>';
      h += '<form class="gb-jf" hidden><div class="gb-g2"><label>Nam<input type="number" name="nam" min="0" max="10" value="' + Math.min(s.ln, 10) + '"></label><label>Nữ<input type="number" name="nu" min="0" max="10" value="' + Math.min(s.lu, 10) + '"></label></div>'
        + '<label>Số điện thoại <small>(chỉ tổng đài thấy)</small><input name="phone" type="tel" inputmode="tel" maxlength="15" placeholder="09xx xxx xxx"></label>'
        + '<label class="gb-chk"><input type="checkbox" name="adult"> Đủ 18 tuổi, đồng ý quy định ghép bàn</label><button type="submit" class="gb-join">Gửi yêu cầu cho chủ bàn</button><p class="gb-msg"></p></form>';
    }
    h += '<a class="gb-tel" href="tel:' + TEL + '">📞 Gọi tổng đài ' + E(HOT) + '</a></article>';
    return h;
  }
  function render(force) {
    if (!force && list.querySelector('.gb-jf:not([hidden])')) return;
    var t = vn(), all = Object.keys(posts).map(function (k) { return posts[k]; }).filter(function (p) { return p.date >= t; })
      .sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
    var mj = {}; Object.keys(mine).forEach(function (j) { mj[mine[j]] = 1; });
    var open = all.filter(function (p) { return !stat(p).full || own[p.code] || mj[p.code]; }), done = all.filter(function (p) { return stat(p).full; });
    var cities = {}; open.forEach(function (p) { cities[p.city] = 1; });
    var F = $('gbFilter'); if (F) F.innerHTML = '<button type="button" data-c=""' + (cur ? '' : ' class="on"') + '>Tất cả</button>' + Object.keys(CN).filter(function (k) { return cities[k]; }).map(function (k) { return '<button type="button" data-c="' + k + '"' + (cur === k ? ' class="on"' : '') + '>' + E(CN[k]) + '</button>'; }).join('');
    var shown = open.filter(function (p) { return !cur || p.city === cur; });
    list.innerHTML = shown.map(card).join('');
    $('gbEmpty').hidden = !!shown.length;
    var okl = (C.okList || []).concat(done.map(function (p) { var s = stat(p); return { codes: [p.code], summary: 'Bàn ' + W(p.haveNam, p.haveNu) + ' + ' + s.acc.map(function (j) { return W(j.nam, j.nu); }).join(' + '), where: where(p), date: p.date, time: p.time }; }));
    if (doneBox) { doneBox.innerHTML = okl.map(function (g) { return '<div class="gb-okc"><span class="gb-okb">✅ ĐÃ GHÉP</span><b>' + E(g.summary) + '</b><span>📍 ' + (g.where || E(g.place || '')) + ' · ' + E(g.date.split('-').reverse().join('/')) + (g.time ? ' · ' + E(g.time) : '') + '</span><small>' + (g.codes || []).map(E).join(' + ') + '</small></div>'; }).join(''); doneSec.hidden = !okl.length; var c = $('gbDoneN'); if (c) c.textContent = okl.length + ' lượt'; }
  }

  /* ---- mạng ---- */
  function pub(o) { return NT ? fetch('https://ntfy.sh/' + NT, { method: 'POST', body: JSON.stringify(o) }).then(function (r) { if (!r.ok) throw 0; return 1; }) : Promise.reject(0); }
  function mail(subj, fields) { if (!K) return Promise.resolve(0); return fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.assign({ access_key: K, subject: subj, from_name: 'TopChill ghép bàn' }, fields)) }).then(function (r) { return r.json(); }).then(function (j) { return j.success !== false ? 1 : 0; }).catch(function () { return 0; }); }
  function pull() {
    if (!NT) { render(); return Promise.resolve(); }
    return fetch('https://ntfy.sh/' + NT + '/json?poll=1&since=12h').then(function (r) { return r.text(); }).then(function (t) {
      t.split('\n').forEach(function (l) { try { var o = JSON.parse(l); if (o.event === 'message') ingest(JSON.parse(o.message)); } catch (e) {} });
      return verifyAll();
    }).then(function () { render(); }).catch(function () { render(); });
  }
  pull(); setInterval(function () { if (document.visibilityState !== 'hidden') pull(); }, 20000);

  /* ---- tương tác trên thẻ ---- */
  if ($('gbFilter')) $('gbFilter').onclick = function (e) { var b = e.target.closest('[data-c]'); if (!b) return; cur = b.dataset.c; render(true); };
  list.addEventListener('click', function (e) {
    var cardEl = e.target.closest('.gb-card'); if (!cardEl) return; var code = cardEl.dataset.code;
    var op = e.target.closest('[data-open]'); if (op) { cardEl.querySelector('.gb-jf').hidden = false; op.hidden = true; return; }
    var d = e.target.closest('[data-dec]'); if (d) decide(code, d.dataset.jid, d.dataset.dec === '1', d);
  });
  list.addEventListener('submit', function (e) {
    var jf = e.target.closest('.gb-jf'); if (!jf) return; e.preventDefault();
    var code = jf.closest('.gb-card').dataset.code, p = posts[code], msg = jf.querySelector('.gb-msg');
    var nam = n20(jf.nam.value), nu = n20(jf.nu.value), ph = jf.phone.value.replace(/\D/g, '');
    if (!(nam + nu) || nam + nu > 10) { msg.textContent = 'Chọn số người nhóm bạn (1–10).'; msg.className = 'gb-msg bad'; return; }
    if (!/^(0|84)\d{9}$/.test(ph)) { msg.textContent = 'Nhập số điện thoại hợp lệ để tổng đài gọi.'; msg.className = 'gb-msg bad'; return; }
    if (!jf.adult.checked) { msg.textContent = 'Vui lòng xác nhận đủ 18 tuổi.'; msg.className = 'gb-msg bad'; return; }
    var R = ld('tc-jn', {}), day = vn(); if ((R[day] || 0) >= 5) { msg.textContent = 'Mỗi máy gửi tối đa 5 yêu cầu/ngày.'; msg.className = 'gb-msg bad'; return; }
    var jid = 'J' + rnd(5), o = { t: 'join', code: code, jid: jid, nam: nam, nu: nu };
    msg.textContent = 'Đang gửi…'; msg.className = 'gb-msg';
    Promise.all([pub(o).catch(function () { return 0; }), mail('Xin vào bàn ' + code + ': ' + W(nam, nu) + ' · ' + ph, { 'Mã bàn': code, 'Mã yêu cầu': jid, 'SĐT người xin vào': ph, 'Nhóm': W(nam, nu), 'Bàn': p ? 'Bàn ' + W(p.haveNam, p.haveNu) + ' cần ' + W(p.needNam, p.needNu) + ' · ' + p.time + ' ' + p.date : '', 'Ghi chú': 'Chủ bàn duyệt trên web; email báo khi được duyệt.' })])
      .then(function (x) { if (!x[0] && !x[1]) throw 0; ingest(o); mine[jid] = code; sv('tc-join', mine); R[day] = (R[day] || 0) + 1; sv('tc-jn', R); render(true); try { window.tcConv && tcConv('form'); gtag('event', 'generate_lead', { method: 'ghep_ban_join' }); } catch (er) {} })
      .catch(function () { msg.innerHTML = 'Chưa gửi được. Gọi <a href="tel:' + TEL + '">' + E(HOT) + '</a> và đọc mã ' + E(code) + '.'; msg.className = 'gb-msg bad'; });
  });
  function decide(code, jid, yes, btn) {
    var jwk = own[code]; if (!jwk || !SUB) return; btn.disabled = true;
    var j = (joins[code] || []).filter(function (x) { return x.jid === jid; })[0], p = posts[code];
    SUB.importKey('jwk', jwk, KP, false, ['sign']).then(function (k) { return SUB.sign(SG, k, msgOf(code, jid, yes)); }).then(function (sig) {
      var d = { t: 'dec', code: code, jid: jid, ok: yes ? 1 : 0, sig: b64(sig) };
      return pub(d).then(function () {
        decs[code + '|' + jid] = d; ok[code + '|' + jid] = yes; render(true);
        if (yes) { var s = stat(p); mail('✅ Chủ bàn ' + code + ' đã duyệt ' + jid + (s.full ? ' · BÀN ĐỦ NGƯỜI' : ''), { 'Mã bàn': code, 'Mã yêu cầu được duyệt': jid, 'Nhóm vào bàn': j ? W(j.nam, j.nu) : '', 'Bàn': 'Bàn ' + W(p.haveNam, p.haveNu) + ' · ' + p.time + ' ' + p.date, 'Trạng thái': s.full ? 'Đủ người, gọi 2 bên chốt bàn chung' : 'Còn thiếu ' + W(s.ln, s.lu), 'Việc cần làm': 'Gọi chủ bàn (SĐT trong email đăng ' + code + ') và người xin vào (SĐT trong email ' + jid + ') để chốt.' }); }
      });
    }).catch(function () { btn.disabled = false; alert('Chưa gửi được, thử lại.'); });
  }

  /* ---- đăng bàn ---- */
  if (!f) return;
  var cs = f.city, bs = f.bar, t0 = vn();
  function fill() { bs.innerHTML = '<option value="">Chưa chọn, nhờ tổng đài gợi ý</option>' + B.filter(function (x) { return x[1] === cs.value; }).map(function (x) { return '<option value="' + x[0] + '">' + E(x[2]) + '</option>'; }).join(''); }
  fill(); cs.onchange = fill; f.date.value = t0; f.date.min = t0;
  var q = $('gbQuick'); if (q) q.onclick = function (e) { var b = e.target.closest('[data-q]'); if (!b) return; var v = b.dataset.q.split(','); f.needNam.value = v[0]; f.needNu.value = v[1]; };
  f.onsubmit = function (e) {
    e.preventDefault(); if (f.botcheck.checked) return;
    var ph = f.phone.value.replace(/\D/g, '');
    function bad(s) { m.textContent = s; m.className = 'gb-msg bad'; }
    if (!/^(0|84)\d{9}$/.test(ph)) return bad('Nhập số điện thoại hợp lệ để tổng đài gọi lại.');
    if (!(+f.needNam.value || +f.needNu.value)) return bad('Chọn số người cần ghép thêm.');
    if (!f.adult.checked || !f.rules.checked) return bad('Vui lòng xác nhận đủ 18 tuổi và đồng ý quy định.');
    if (BAD.test(f.note.value) || BAD.test(f.age.value)) return bad('Ghi chú không được chứa số điện thoại, link hay tài khoản mạng xã hội.');
    var R = ld('tc-gb', {}), day = vn(); if ((R[day] || 0) >= 3) return bad('Mỗi máy đăng tối đa 3 bàn/ngày. Gọi tổng đài nếu cần thêm.');
    var code = 'GB-' + rnd(4), bar = bs.value ? bs.options[bs.selectedIndex].text : 'Chưa chọn', d = f.date.value.split('-').reverse().join('/');
    var p = { t: 'post', code: code, city: cs.value, barId: +bs.value || 0, date: f.date.value, time: f.time.value, age: f.age.value.trim().slice(0, 20), haveNam: n20(f.haveNam.value), haveNu: n20(f.haveNu.value), needNam: n20(f.needNam.value), needNu: n20(f.needNu.value), note: f.note.value.trim().slice(0, 140) };
    m.textContent = 'Đang đăng…'; m.className = 'gb-msg';
    var keys = SUB ? SUB.generateKey(KP, true, ['sign', 'verify']).then(function (kp) { return Promise.all([SUB.exportKey('jwk', kp.publicKey), SUB.exportKey('jwk', kp.privateKey)]); }).catch(function () { return null; }) : Promise.resolve(null);
    keys.then(function (k) {
      if (k) p.pk = { x: k[0].x, y: k[0].y };
      var live = pub(p).then(function () { return 1; }).catch(function () { return 0; });
      var em = mail('Ghép bàn ' + code + ': ' + W(p.haveNam, p.haveNu) + ' cần ' + W(p.needNam, p.needNu) + ' · ' + bar + ' · ' + p.time + ' ' + d + ' · ' + ph, { 'Mã ghép bàn': code, 'SĐT chủ bàn': ph, 'Tên': f.name.value || '(không để tên)', 'Thành phố': CN[p.city], 'Quán': bar, 'Ngày': d, 'Giờ': p.time, 'Bàn đang có': W(p.haveNam, p.haveNu), 'Cần thêm': W(p.needNam, p.needNu), 'Độ tuổi': p.age, 'Ghi chú (công khai)': p.note, 'Đủ 18 tuổi': 'Có', 'Ghi chú': 'Tin đã tự hiện trên topchill.vn/ghep-ban/, chủ bàn tự duyệt người xin vào. Email báo khi có người được duyệt.' });
      return Promise.all([live, em]).then(function (x) {
        if (!x[0] && !x[1]) throw 0;
        if (x[0]) { ingest(p); if (k) { own[code] = k[1]; sv('tc-own', own); } }
        R[day] = (R[day] || 0) + 1; sv('tc-gb', R);
        m.innerHTML = '✅ ' + (x[0] ? 'Đã đăng! Bàn của bạn (mã <b>' + code + '</b>) đang hiện trên bảng. Ai xin vào, bạn bấm <b>Duyệt</b> ngay trên thẻ bàn ở trên (dùng đúng máy này).' : 'Đã gửi! Mã của bạn: <b>' + code + '</b>. Tổng đài sẽ gọi lại trong vài phút.');
        m.className = 'gb-msg ok'; f.reset(); f.date.value = t0; fill(); cur = ''; render(true);
        var el = list.querySelector('[data-code="' + code + '"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        try { window.tcConv && tcConv('form'); gtag('event', 'generate_lead', { method: 'ghep_ban' }); } catch (er) {}
      });
    }).catch(function () { m.innerHTML = 'Chưa gửi được. Gọi <a href="tel:' + TEL + '">' + E(HOT) + '</a> hoặc nhắn Zalo, đọc mã <b>' + code + '</b>.'; m.className = 'gb-msg bad'; });
  };
})();
