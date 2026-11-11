/* TopChill – khung chat tổng đài trên web.
 * Dữ liệu: window.TC_CHAT (do build sinh ở assets/chat-data.js).
 * Tự trả lời theo dữ liệu bar (thành phố, giá, giờ vàng, điểm, cọc, dress code, tên bar).
 * Chuyển nhân viên: nếu cấu hình Tawk.to → mở Tawk; nếu không → chế độ demo mô phỏng nhân viên.
 * Gọi từ ngoài: TCChat.open(), TCChat.close(). */
(function () {
  var C = window.TC_CHAT; if (!C || window.TCChat) return;
  var B = C.base, KEY = 'topchill-chat';
  var norm = function (s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase(); };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var fmt = function (n) { return Number(n).toLocaleString('vi-VN'); };
  var st = { msgs: [], agent: false, miss: 0, seen: false };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv && sv.msgs) st = sv; } catch (e) {}
  var save = function () { try { st.msgs = st.msgs.slice(-60); localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
  var tawk = C.tawkPropertyId && C.tawkWidgetId;
  var AGENT = 'Linh';

  /* ---------- giao diện ---------- */
  var fab = document.createElement('button');
  fab.className = 'tcc-fab'; fab.type = 'button'; fab.setAttribute('aria-label', 'Chat với tổng đài TopChill');
  fab.innerHTML = '<span class="av">💬</span><span class="lb">Chat tổng đài</span><span class="badge"' + (st.seen ? ' hidden' : '') + '>1</span>';
  var box = document.createElement('section');
  box.className = 'tcc'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Chat với tổng đài TopChill');
  box.innerHTML =
    '<div class="tcc-h"><span class="av">T</span><span class="sp"><b>Tổng đài TopChill</b><small id="tccSt">Đang trực tuyến · trả lời trong 1 phút</small></span>' +
    '<a href="tel:' + C.hotline.replace(/\s/g, '') + '" aria-label="Gọi ' + esc(C.hotline) + '">📞</a><button type="button" class="tcc-x" aria-label="Đóng chat">✕</button></div>' +
    '<div class="tcc-m" aria-live="polite"></div>' +
    '<div class="tcc-q"></div>' +
    '<form class="tcc-f"><input type="text" placeholder="Nhắn cho tổng đài…" aria-label="Tin nhắn" autocomplete="off" enterkeyhint="send"><button type="submit" aria-label="Gửi">➤</button></form>' +
    (C.demo ? '<div class="tcc-note">Bản demo: trả lời tự động, nhân viên là mô phỏng.</div>' : '');
  /* Nút Tư vấn: bấm vào bung ngang 4 lựa chọn Gọi · Zalo · Telegram · Chat */
  var tel = C.hotline.replace(/\s/g, '');
  var wrap = document.createElement('div'); wrap.className = 'tcw';
  var menu = document.createElement('div'); menu.className = 'tcq'; menu.id = 'tcqMenu'; menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', 'Chọn cách liên hệ');
  var items = [
    '<a role="menuitem" class="q-call" href="tel:' + tel + '"><span class="ic">📞</span><span class="lb">Gọi ngay</span></a>',
    C.zalo ? '<a role="menuitem" class="q-zalo" href="https://zalo.me/' + esc(C.zalo) + '" target="_blank" rel="noopener"><span class="ic">Zalo</span><span class="lb">Zalo</span></a>' : '',
    C.telegram ? '<a role="menuitem" class="q-tg" href="https://t.me/' + esc(C.telegram) + '" target="_blank" rel="noopener"><span class="ic"><svg viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" aria-hidden=\"true\"><path fill=\"#fff\" d=\"M21.4 4.6 2.9 11.7c-1.3.5-1.2 1.3-.2 1.6l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.5-1.4Zm-3.3 3.6-8.6 7.8-.3 3.3-1.5-4.8 9.8-6.1c.5-.3.9 0 .6-.2Z\"/></svg></span><span class="lb">Telegram</span></a>' : '',
    '<button role="menuitem" type="button" class="q-chat"><span class="ic">💬</span><span class="lb">Chat</span></button>'
  ].filter(Boolean);
  menu.innerHTML = items.map(function (h, i) { return h.replace('class="q-', 'style="--i:' + i + '" class="q-'); }).join('');
  fab.setAttribute('aria-label', 'Tư vấn đặt bàn: gọi, Zalo, Telegram hoặc chat'); fab.setAttribute('aria-haspopup', 'menu'); fab.setAttribute('aria-expanded', 'false'); fab.setAttribute('aria-controls', 'tcqMenu');
  fab.querySelector('.lb').textContent = 'Tư vấn';
  fab.querySelector('.av').innerHTML = '<span class="i1">🎧</span><span class="i2">✕</span>';
  wrap.appendChild(fab); wrap.appendChild(menu);
  function menuOpen(v) {
    wrap.classList.toggle('open', v); fab.setAttribute('aria-expanded', v ? 'true' : 'false');
    if (v) { st.seen = true; fab.querySelector('.badge').hidden = true; save(); }
  }
  menu.addEventListener('click', function (e) {
    if (e.target.closest('.q-chat')) { menuOpen(false); open(); return; }
    if (e.target.closest('a')) setTimeout(function () { menuOpen(false); }, 300);
  });
  document.addEventListener('click', function (e) { if (wrap.classList.contains('open') && !wrap.contains(e.target)) menuOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && wrap.classList.contains('open')) { menuOpen(false); fab.focus(); } });
  document.body.appendChild(wrap); document.body.appendChild(box);

  var M = box.querySelector('.tcc-m'), Q = box.querySelector('.tcc-q'), IN = box.querySelector('input');

  function barCard(b) {
    return '<div class="tcc-card"><b>' + esc(b.name) + '</b><span class="mt">' + (b.rating ? '★ ' + b.rating + ' · ' : '') + esc(b.cityName) + ' · ' + esc(b.type) + (b.priceKnown === false ? '' : ' · ' + b.price[0] + 'k–' + b.price[1] + 'k/người') + '</span>' +
      (b.partner === false ? '<span class="dl">📞 Đặt bàn qua tổng đài</span>' : '<span class="dl">Giảm ' + b.deal + '% bill' + (b.gpct ? ' · <i>⚡ ' + b.gLabel + ' -' + b.gpct + '%</i>' : '') + '</span>') +
      '<span class="ac"><a class="go" href="' + B + '?dat=' + b.id + '" data-tcbook data-id="' + b.id + '">Đặt Bàn Ngay</a><a class="vw" href="' + B + 'bar/' + b.slug + '/">Xem bar</a></span></div>';
  }
  function contacts() {
    var h = '<div class="tcc-contacts">';
    h += '<a href="tel:' + C.hotline.replace(/\s/g, '') + '"><span>📞</span>Gọi tổng đài ' + esc(C.hotline) + '</a>';
    if (C.zalo) h += '<a href="https://zalo.me/' + esc(C.zalo) + '" target="_blank" rel="noopener"><span>💙</span>Chat qua Zalo</a>';
    if (C.telegram) h += '<a href="https://t.me/' + esc(C.telegram) + '" target="_blank" rel="noopener"><span>✈️</span>Nhắn qua Telegram</a>';
    if (C.messenger) h += '<a href="https://m.me/' + esc(C.messenger) + '" target="_blank" rel="noopener"><span>💬</span>Chat qua Messenger</a>';
    return h + '</div>';
  }
  function render() {
    M.innerHTML = st.msgs.map(function (m) {
      if (m.t === 'sys') return '<div class="tcc-sys">' + esc(m.x) + '</div>';
      if (m.t === 'cards') return '<div class="tcc-cards">' + m.ids.map(function (id) { var b = C.bars.filter(function (x) { return x.id === id; })[0]; return b ? barCard(b) : ''; }).join('') + '</div>';
      if (m.t === 'contacts') return contacts();
      var who = m.t === 'agent' ? '<span class="who">' + AGENT + ' · nhân viên tổng đài</span>' : m.t === 'bot' ? '<span class="who">Trợ lý TopChill</span>' : '';
      return '<div class="tcc-b ' + m.t + '">' + who + esc(m.x) + '</div>';
    }).join('');
    M.scrollTop = M.scrollHeight;
  }
  function chips(list) {
    Q.innerHTML = list.map(function (c) { return '<button type="button">' + esc(c) + '</button>'; }).join('');
  }
  function push(m) { st.msgs.push(m); save(); render(); }
  function typing(cb, ms) {
    var t = document.createElement('div'); t.className = 'tcc-typing'; t.innerHTML = '<i></i><i></i><i></i>';
    M.appendChild(t); M.scrollTop = M.scrollHeight;
    setTimeout(function () { t.remove(); cb(); }, ms || 700);
  }
  function say(list, nextChips) {
    var i = 0;
    (function step() {
      if (i >= list.length) { if (nextChips) chips(nextChips); return; }
      var m = list[i++];
      typing(function () { push(m); step(); }, m.t === 'cards' ? 400 : 650 + Math.min(900, (m.x || '').length * 8));
    })();
  }

  /* ---------- hiểu câu hỏi ---------- */
  var DEF_CHIPS = ['Hà Nội', 'Sài Gòn', 'Đà Nẵng', 'Giá bàn VIP', 'Giờ vàng là gì?', 'Gặp nhân viên'];
  var ALIAS = { hn: ['ha noi', 'hanoi', 'hn', 'tay ho', 'pho co'], sg: ['sai gon', 'saigon', 'sg', 'hcm', 'ho chi minh', 'quan 1', 'bui vien', 'thao dien'], dn: ['da nang', 'danang', 'my khe'], nt: ['nha trang'], pq: ['phu quoc'], dl: ['da lat', 'dalat'], hp: ['hai phong'], vt: ['vung tau', 'bai sau'], ql: ['ha long', 'bai chay', 'quang ninh'], ct: ['can tho'], hue: ['hue'], bd: ['binh duong'] };
  function findCity(t) {
    for (var id in ALIAS) for (var i = 0; i < ALIAS[id].length; i++) {
      var a = ALIAS[id][i]; if (new RegExp('(^|[^a-z])' + a + '([^a-z]|$)').test(t)) return id;
    }
    return null;
  }
  function findBar(t) {
    return C.bars.filter(function (b) { var n = norm(b.name); return t.indexOf(n) >= 0 || (n.split(' ').length > 1 && t.indexOf(n.split(' ').slice(0, 2).join(' ')) >= 0 && n.split(' ').slice(0, 2).join(' ').length > 6); })[0];
  }
  function cityName(id) { var c = C.cities.filter(function (x) { return x.id === id; })[0]; return c ? c.name : ''; }
  function topBars(city, n) {
    return C.bars.filter(function (b) { return !city || b.city === city; }).sort(function (a, b) { return a.rank - b.rank; }).slice(0, n || 3);
  }
  function answer(raw) {
    var t = norm(raw), out = [], nx = DEF_CHIPS;
    var phone = raw.replace(/[\s.]/g, '').match(/(\+84|0)\d{9}/);
    if (phone) {
      return { m: [{ t: st.agent ? 'agent' : 'bot', x: 'Đã ghi nhận số ' + phone[0] + '. Nhân viên tổng đài sẽ gọi lại cho bạn trong 5 phút để chốt bàn nhé.' }], c: ['Gợi ý bar tối nay', 'Giờ vàng là gì?'] };
    }
    var bar = findBar(t), city = findCity(t);
    if (/nhan vien|nguoi that|tu van|goi lai|tong dai|gap (ai|nguoi|nv)|ho tro|admin/.test(t)) return { agent: true };
    if (bar) {
      out.push({ t: 'bot', x: bar.partner === false ? bar.name + ' (' + bar.cityName + ')' + (bar.hoursKnown === false ? '' : ' mở ' + bar.hours) + '. Bar này chưa có ưu đãi qua TopChill, nhưng tổng đài vẫn giữ bàn giúp bạn.' : bar.name + ' (' + bar.cityName + ') mở ' + bar.hours + '. Đặt qua TopChill giảm ' + bar.deal + '% bill' + (bar.gpct ? ', đến trong giờ vàng ' + bar.gLabel + ' giảm thêm ' + bar.gpct + '%' : '') + '.' + (bar.bonus ? '\nƯu đãi: ' + bar.bonus + '.' : '') });
      out.push({ t: 'cards', ids: [bar.id] });
      return { m: out, c: ['Bàn VIP bao nhiêu?', 'Có cần cọc không?', 'Bar khác ở ' + bar.cityName] };
    }
    if (/gio vang|happy hour/.test(t)) {
      var g = C.bars.filter(function (b) { return b.gpct > 0; }).sort(function (a, b) { return b.gpct - a.gpct; }).slice(0, 2);
      out.push({ t: 'bot', x: 'Giờ vàng là 2 giờ đầu sau khi bar mở cửa. Đặt bàn và đến trong khung này được giảm thêm 10–20%, cộng dồn với ưu đãi của bar và hạng thành viên.\nĐang giảm sâu nhất:' });
      out.push({ t: 'cards', ids: g.map(function (b) { return b.id; }) });
      return { m: out, c: ['Hà Nội', 'Sài Gòn', 'Đặt bàn giúp mình'] };
    }
    if (/gia|bao nhieu|vip|sofa|toi thieu|tien|chi phi|bang gia/.test(t) && !/doi tien|diem/.test(t)) {
      out.push({ t: 'bot', x: 'Bảng giá bàn tham khảo:\n• Bàn thường: không yêu cầu chi tối thiểu\n• Bàn VIP: chi tối thiểu 5.000.000đ, thường được tặng rượu\n• Sofa nhóm 8–12 người: từ 8.000.000đ\n\nĐặt qua TopChill được giảm 10–25% bill, giờ vàng giảm thêm đến 20%.' });
      return { m: out, c: ['Gợi ý bar tối nay', 'Có cần cọc không?', 'Gặp nhân viên'] };
    }
    if (/coc|huy|hoan tien/.test(t)) {
      out.push({ t: 'bot', x: 'Đặt bàn qua TopChill không cần cọc, áp dụng cho mọi hạng thành viên. Tổng đài hỗ trợ 24/7.\nHuỷ miễn phí trước 18:00 ngày đặt.' });
      return { m: out, c: ['Gợi ý bar tối nay', 'Gặp nhân viên'] };
    }
    if (/diem|doi tien|thanh vien|hang|gold|vang|platinum|silver|newbie/.test(t)) {
      out.push({ t: 'bot', x: 'Hạng thành viên TopChill (theo tổng chi tiêu khi đặt qua TopChill):\n• Newbie: hỗ trợ 24/7, đặt bàn không cần cọc.\n• Silver (20 triệu): giảm 5% bill.\n• Vàng (80 triệu): giảm 8% bill + rượu quà sinh nhật.\n• Platinum (150 triệu): giảm 10% bill, tích điểm hàng tháng, chương trình tặng rượu tại bar.' });
      return { m: out, c: ['Gợi ý bar tối nay', 'Giờ vàng là gì?'] };
    }
    if (/mac gi|dress|trang phuc|dep le/.test(t)) {
      out.push({ t: 'bot', x: 'Đa số bar yêu cầu smart casual: nam áo có cổ, quần dài, giày kín. Không mặc quần đùi, dép lê. Beach club cho mặc đồ đi biển.' });
      return { m: out, c: ['Gợi ý bar tối nay'] };
    }
    if (city) {
      var tb = topBars(city, 3);
      if (!tb.length) return { m: [{ t: 'bot', x: 'TopChill đang cập nhật bar ở ' + cityName(city) + '. Bạn để lại số điện thoại, nhân viên sẽ tư vấn chỗ đi tối nay.' }], c: ['Gặp nhân viên'] };
      out.push({ t: 'bot', x: 'Bar nổi bật ở ' + cityName(city) + '. Bấm “Đặt bàn” là chọn giờ và gửi yêu cầu luôn:' });
      out.push({ t: 'cards', ids: tb.map(function (b) { return b.id; }) });
      return { m: out, c: ['Giá bàn VIP', 'Giờ vàng là gì?', 'Đặt giúp mình'] };
    }
    if (/^(hi|hello|chao|alo|xin chao|hey|e oi|ad oi)/.test(t)) {
      return { m: [{ t: 'bot', x: 'Chào bạn 👋 Tối nay bạn muốn đi bar ở thành phố nào?' }], c: DEF_CHIPS };
    }
    if (/dat ban|dat cho|book|giu ban|toi nay|di dau|goi y|quay|chill/.test(t)) {
      if (/dat giup|dat ho|giup minh/.test(t)) return { agent: true };
      return { m: [{ t: 'bot', x: 'Bạn muốn đi ở thành phố nào? Chọn nhanh bên dưới nhé.' }], c: ['Hà Nội', 'Sài Gòn', 'Đà Nẵng', 'Nha Trang', 'Phú Quốc', 'Vũng Tàu'] };
    }
    st.miss++;
    if (st.miss >= 2) { st.miss = 0; return { agent: true }; }
    return { m: [{ t: 'bot', x: 'Mình chưa hiểu ý bạn lắm. Bạn chọn nhanh bên dưới, hoặc bấm “Gặp nhân viên” để nói chuyện với tổng đài.' }], c: DEF_CHIPS };
  }

  /* ---------- nhân viên ---------- */
  function toAgent() {
    if (tawk && window.Tawk_API && Tawk_API.maximize) {
      push({ t: 'sys', x: 'Đang chuyển bạn tới nhân viên tổng đài…' });
      try { Tawk_API.showWidget(); Tawk_API.maximize(); } catch (e) {}
      close(); return;
    }
    if (st.agent) { say([{ t: 'agent', x: 'Mình vẫn đang ở đây. Bạn cần mình đặt bàn ở bar nào, mấy người, mấy giờ ạ?' }], ['Gửi số điện thoại', 'Gợi ý bar tối nay']); return; }
    st.agent = true; save();
    push({ t: 'sys', x: 'Đang kết nối nhân viên tổng đài…' });
    setTimeout(function () {
      push({ t: 'sys', x: AGENT + ' đã tham gia cuộc trò chuyện' });
      box.querySelector('#tccSt').textContent = AGENT + ' đang hỗ trợ bạn';
      say([
        { t: 'agent', x: 'Chào bạn, mình là ' + AGENT + ' bên tổng đài TopChill. Bạn cho mình xin: thành phố, số người và giờ đến. Mình giữ bàn đẹp và áp ưu đãi giúp bạn nhé.' },
        { t: 'agent', x: 'Hoặc để lại số điện thoại, mình gọi lại ngay. Bạn cũng có thể liên hệ trực tiếp:' },
        { t: 'contacts' },
      ], ['Gửi số điện thoại', 'Hà Nội, 4 người, 21h', 'Sài Gòn, 6 người, 22h']);
    }, 1400);
  }
  function agentReply(raw) {
    var r = answer(raw);
    if (r.agent) { toAgent(); return; }
    var t = norm(raw);
    if (/\d+\s*(nguoi|ng)\b/.test(t) || /\d{1,2}\s*(h|gio)/.test(t)) {
      var city = findCity(t), list = topBars(city, 2);
      say([{ t: 'agent', x: 'Dạ mình ghi nhận rồi ạ. ' + (city ? 'Ở ' + cityName(city) + ' tối nay còn bàn đẹp tại:' : 'Bạn chọn giúp mình bar nhé:') }, { t: 'cards', ids: list.map(function (b) { return b.id; }) }, { t: 'agent', x: 'Bạn bấm “Đặt bàn” để chốt, hoặc gửi số điện thoại để mình giữ bàn giúp.' }], ['Gửi số điện thoại']);
      return;
    }
    if (r.m) say(r.m.map(function (m) { return m.t === 'bot' ? { t: 'agent', x: m.x } : m; }), r.c);
  }

  /* ---------- sự kiện ---------- */
  function send(text) {
    text = String(text).trim(); if (!text) return;
    push({ t: 'me', x: text }); Q.innerHTML = '';
    if (text === 'Gặp nhân viên' || text === 'Đặt giúp mình' || text === 'Đặt bàn giúp mình') { toAgent(); return; }
    if (text === 'Gửi số điện thoại') { say([{ t: st.agent ? 'agent' : 'bot', x: 'Bạn nhập số điện thoại vào ô bên dưới nhé, ví dụ 0912345678.' }]); IN.setAttribute('inputmode', 'tel'); IN.focus(); return; }
    if (text === 'Gợi ý bar tối nay') { say([{ t: st.agent ? 'agent' : 'bot', x: 'Top bar được đặt nhiều nhất tối nay:' }, { t: 'cards', ids: topBars(null, 3).map(function (b) { return b.id; }) }], ['Hà Nội', 'Sài Gòn', 'Đà Nẵng']); return; }
    if (/^Bar khác ở /.test(text)) text = text.replace('Bar khác ở ', '');
    if (st.agent) { agentReply(text); return; }
    var r = answer(text);
    if (r.agent) toAgent(); else say(r.m, r.c);
  }
  function open() {
    box.hidden = false; document.body.classList.add('tcc-open');
    st.seen = true; fab.querySelector('.badge').hidden = true;
    if (!st.msgs.length) {
      say([{ t: 'bot', x: 'Chào bạn 👋 Mình là trợ lý tổng đài TopChill.\nTối nay bạn muốn đi bar ở đâu? Chọn nhanh bên dưới hoặc nhắn cho mình.' }], DEF_CHIPS);
    } else { render(); if (!Q.innerHTML) chips(st.agent ? ['Gửi số điện thoại', 'Gợi ý bar tối nay'] : DEF_CHIPS); }
    if (st.agent) box.querySelector('#tccSt').textContent = AGENT + ' đang hỗ trợ bạn';
    save();
    if (matchMedia('(min-width:721px)').matches) setTimeout(function () { IN.focus(); }, 300);
  }
  function close() { box.hidden = true; document.body.classList.remove('tcc-open'); }
  fab.addEventListener('click', function () { menuOpen(!wrap.classList.contains('open')); });
  box.querySelector('.tcc-x').addEventListener('click', close);
  box.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); send(IN.value); IN.value = ''; IN.removeAttribute('inputmode'); });
  Q.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) send(b.textContent); });
  M.addEventListener('click', function (e) { if (e.target.closest('[data-tcbook]') && matchMedia('(max-width:720px)').matches) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) close(); });

  /* Tawk.to (nhân viên thật) nếu đã cấu hình */
  if (tawk) {
    window.Tawk_API = window.Tawk_API || {}; window.Tawk_LoadStart = new Date();
    Tawk_API.onLoad = function () { try { Tawk_API.hideWidget(); } catch (e) {} };
    Tawk_API.onChatMinimized = function () { try { Tawk_API.hideWidget(); } catch (e) {} };
    var s = document.createElement('script'); s.async = true; s.src = 'https://embed.tawk.to/' + C.tawkPropertyId + '/' + C.tawkWidgetId; s.charset = 'UTF-8'; s.setAttribute('crossorigin', '*');
    document.head.appendChild(s);
  }
  window.TCChat = { open: open, close: close };
})();
