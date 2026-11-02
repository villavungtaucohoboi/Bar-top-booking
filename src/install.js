/* TopChill – cài app & toàn màn hình.
 * Tab trình duyệt thường không cho web vẽ đè thanh trạng thái/thanh địa chỉ, nên tràn viền thật cần:
 *  - Android Chrome: cài app (beforeinstallprompt) → mở fullscreen; hoặc Fullscreen API ngay trong tab.
 *  - iPhone Safari: Thêm vào Màn hình chính → mở standalone, nội dung tràn dưới thanh trạng thái.
 * Thanh gợi ý chỉ hiện khi đang xem trong trình duyệt, ẩn được và nhớ lựa chọn 7 ngày. */
(function () {
  if (window.TCInstall) return;
  var KEY = 'topchill-install-hide';
  var inApp = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(function () {});
  if (inApp) { document.documentElement.classList.add('in-app'); window.TCInstall = {}; return; }
  var ua = navigator.userAgent, isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isMobile = /Android|iPhone|iPad|iPod/.test(ua) || isIOS;
  var canFull = !isIOS && document.documentElement.requestFullscreen;
  var deferred = null;

  var css = document.createElement('style');
  css.textContent =
    '.tci{position:fixed;left:max(12px,env(safe-area-inset-left,0px));right:max(12px,env(safe-area-inset-right,0px));top:calc(env(safe-area-inset-top,0px) + 74px);z-index:95;display:flex;align-items:center;gap:10px;padding:10px 10px 10px 12px;border-radius:18px;background:rgba(18,10,26,.92);border:1px solid rgba(255,63,174,.5);box-shadow:0 14px 40px rgba(0,0,0,.5),0 0 20px rgba(255,63,174,.25);color:#fff;font:14px/1.35 "Be Vietnam Pro",system-ui,sans-serif;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);animation:tciIn .35s ease-out;max-width:560px;margin:0 auto}' +
    '.tci[hidden]{display:none}' +
    '@keyframes tciIn{from{opacity:0;transform:translateY(-10px)}}' +
    '.tci img{width:42px;height:42px;border-radius:11px;flex:none}' +
    '.tci .t{flex:1;min-width:0}.tci .t b{display:block;font-size:14.5px}.tci .t small{color:#cfc4e0;font-size:12.5px}' +
    '.tci button{all:unset;cursor:pointer;flex:none;min-height:40px;padding:0 14px;border-radius:12px;font-weight:700;font-size:13.5px;display:grid;place-items:center;box-sizing:border-box}' +
    '.tci .go{background:linear-gradient(135deg,#ff6fb5,#ff3f8e);color:#fff;box-shadow:0 0 14px rgba(255,63,142,.5)}' +
    '.tci .fs{border:1px solid rgba(255,255,255,.25)}' +
    '.tci .x{width:32px;min-height:32px;padding:0;color:#bdb2cf;font-size:18px}' +
    '.tci button:focus-visible{outline:2px solid #45d5ff;outline-offset:2px}' +
    '.tcs{position:fixed;inset:0;z-index:130;background:rgba(5,3,10,.7);display:flex;align-items:flex-end;justify-content:center}' +
    '.tcs[hidden]{display:none}' +
    '.tcs > div{width:100%;max-width:480px;background:#140c1e;color:#fff;border-radius:24px 24px 0 0;padding:22px 20px calc(22px + env(safe-area-inset-bottom,0px));font:15px/1.5 "Be Vietnam Pro",system-ui,sans-serif;border:1px solid rgba(255,255,255,.12)}' +
    '.tcs h3{margin:0 0 12px;font-size:20px}.tcs ol{margin:0 0 16px;padding-left:22px;display:flex;flex-direction:column;gap:10px}.tcs b.k{display:inline-grid;place-items:center;min-width:28px;height:28px;padding:0 6px;border-radius:8px;background:#2a2038;margin:0 3px}' +
    '.tcs button{all:unset;cursor:pointer;display:block;width:100%;box-sizing:border-box;text-align:center;min-height:50px;line-height:50px;border-radius:14px;background:linear-gradient(135deg,#ff6fb5,#ff3f8e);font-weight:700}' +
    'html.is-full .tci{display:none}';
  document.head.appendChild(css);

  var bar = document.createElement('div'); bar.className = 'tci'; bar.hidden = true; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Cài app TopChill');
  bar.innerHTML = '<img src="/icon-192.png" alt=""><span class="t"><b>Mở TopChill toàn màn hình</b><small></small></span>' +
    '<button type="button" class="fs" hidden>⛶ Toàn màn hình</button><button type="button" class="go">Cài app</button><button type="button" class="x" aria-label="Ẩn gợi ý">✕</button>';
  var sheet = document.createElement('div'); sheet.className = 'tcs'; sheet.hidden = true;
  sheet.innerHTML = '<div role="dialog" aria-label="Cài TopChill trên iPhone"><h3>Cài TopChill lên màn hình chính</h3><ol>' +
    '<li>Bấm nút <b class="k">⬆︎</b> Chia sẻ ở thanh dưới của Safari.</li>' +
    '<li>Kéo xuống, chọn <b>Thêm vào MH chính</b>.</li>' +
    '<li>Bấm <b>Thêm</b>. Mở TopChill từ biểu tượng mới để xem toàn màn hình.</li></ol><button type="button">Đã hiểu</button></div>';
  var small = bar.querySelector('small'), go = bar.querySelector('.go'), fs = bar.querySelector('.fs');

  function hidden() { try { return +localStorage.getItem(KEY) > Date.now(); } catch (e) { return false; } }
  function hide() { bar.hidden = true; try { localStorage.setItem(KEY, Date.now() + 7 * 864e5); } catch (e) {} }
  function show() {
    if (hidden() || !isMobile) return;
    if (deferred) { small.textContent = 'Cài app 1 chạm, ẩn thanh địa chỉ, tràn viền'; go.hidden = false; }
    else if (isIOS) { small.textContent = 'Thêm vào màn hình chính để tràn viền như app'; go.textContent = 'Cách cài'; go.hidden = false; }
    else { small.textContent = 'Ẩn thanh địa chỉ và thanh trạng thái'; go.hidden = true; }
    fs.hidden = !canFull;
    if (go.hidden && fs.hidden) return;
    bar.hidden = false;
  }
  function attach() { document.body.appendChild(bar); document.body.appendChild(sheet); setTimeout(show, 2500); }
  if (document.body) attach(); else document.addEventListener('DOMContentLoaded', attach);

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; if (!bar.hidden || document.body.contains(bar)) show(); });
  window.addEventListener('appinstalled', function () { bar.hidden = true; deferred = null; });
  go.addEventListener('click', function () {
    if (deferred) { deferred.prompt(); deferred.userChoice.then(function (r) { if (r.outcome === 'accepted') bar.hidden = true; deferred = null; }); }
    else if (isIOS) sheet.hidden = false;
  });
  fs.addEventListener('click', function () {
    var el = document.documentElement;
    (el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : Promise.reject()).catch(function () {});
  });
  document.addEventListener('fullscreenchange', function () { document.documentElement.classList.toggle('is-full', !!document.fullscreenElement); });
  bar.querySelector('.x').addEventListener('click', hide);
  sheet.addEventListener('click', function (e) { if (e.target === sheet || e.target.tagName === 'BUTTON') { sheet.hidden = true; hide(); } });
  window.TCInstall = { show: show };
})();
