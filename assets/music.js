/* TopChill – nhạc nền bật/tắt.
 * Nhạc house 124 BPM tạo trực tiếp bằng Web Audio: không tải file, không bản quyền, không làm nặng web.
 * Mặc định TẮT. Trình duyệt chỉ cho phát âm thanh sau khi người dùng chạm, nên nhạc bắt đầu khi bấm nút.
 * Đã bật lần trước thì lần sau tự phát lại ở lần chạm đầu tiên. */
(function () {
  if (window.TCMusic) return;
  var KEY = 'topchill-music', BPM = 124, SPB = 60 / BPM, STEP = SPB / 4; // 16 bước mỗi ô nhịp
  var ctx = null, master = null, comp = null, noiseBuf = null, timer = null, nextT = 0, step = 0, bar = 0, on = false;

  /* ---------- nút ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.tcm{position:fixed;left:max(18px,env(safe-area-inset-left,0px));bottom:calc(22px + env(safe-area-inset-bottom,0px));z-index:89;display:flex;align-items:center;gap:9px;height:48px;padding:0 16px 0 6px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(16,10,24,.78);color:#fff;font:600 14px "Be Vietnam Pro",system-ui,sans-serif;cursor:pointer;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 8px 24px rgba(0,0,0,.35)}' +
    '.tcm .ic{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.1);font-size:17px}' +
    '.tcm .bars{display:none;align-items:flex-end;gap:2px;height:16px}' +
    '.tcm .bars i{width:3px;border-radius:2px;background:linear-gradient(#ff8fd0,#b146ff);animation:tcmB .48s ease-in-out infinite alternate}' +
    '.tcm .bars i:nth-child(2){animation-delay:-.2s}.tcm .bars i:nth-child(3){animation-delay:-.35s}.tcm .bars i:nth-child(4){animation-delay:-.1s}' +
    '@keyframes tcmB{from{height:4px}to{height:16px}}' +
    '.tcm.on{border-color:rgba(255,63,174,.7);box-shadow:0 0 18px rgba(255,63,174,.45)}' +
    '.tcm.on .ic{background:linear-gradient(135deg,#ff6fb5,#b146ff)}' +
    '.tcm.on .bars{display:flex}' +
    'html.music-on .tc-eq i{animation-duration:' + (SPB).toFixed(3) + 's!important}' +
    '@media (max-width:1100px){.tcm{bottom:calc(88px + env(safe-area-inset-bottom,0px))}}' +
    '@media (max-width:720px){.tcm{height:46px;padding:0 6px}.tcm .lb{display:none}.tcm.on{padding-right:12px}}' +
    'body.tcc-open .tcm,body:has(.modal:not([hidden])) .tcm{display:none}' +
    '@media (prefers-reduced-motion:reduce){.tcm .bars i{animation:none;height:10px}}';
  document.head.appendChild(css);
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'tcm';
  btn.innerHTML = '<span class="ic" aria-hidden="true">🔇</span><span class="lb">Bật nhạc</span><span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
  function paint() {
    btn.classList.toggle('on', on);
    btn.querySelector('.ic').textContent = on ? '🔊' : '🔇';
    btn.querySelector('.lb').textContent = on ? 'Tắt nhạc' : 'Bật nhạc';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Tắt nhạc nền' : 'Bật nhạc nền');
    document.documentElement.classList.toggle('music-on', on);
  }
  function attach() { document.body.appendChild(btn); paint(); }
  if (document.body) attach(); else document.addEventListener('DOMContentLoaded', attach);

  /* ---------- âm thanh ---------- */
  function init() {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0;
    comp.connect(master); master.connect(ctx.destination);
    var len = ctx.sampleRate * 0.5; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0); for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function kick(t) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    env(g, t, 0.003, 1, 0.38); o.connect(g); g.connect(comp); o.start(t); o.stop(t + 0.45);
  }
  function noise(t, type, freq, peak, dec) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; env(g, t, 0.002, peak, dec);
    s.connect(f); f.connect(g); g.connect(comp); s.start(t); s.stop(t + dec + 0.05);
  }
  var mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  // Am – F – C – G
  var ROOT = [45, 41, 48, 43];
  var CHORD = [[57, 60, 64, 67], [53, 57, 60, 64], [55, 60, 64, 67], [55, 59, 62, 67]];
  function bass(t, note) {
    var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = mtof(note);
    f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(220, t + 0.18); f.Q.value = 6;
    env(g, t, 0.005, 0.32, 0.2); o.connect(f); f.connect(g); g.connect(comp); o.start(t); o.stop(t + 0.3);
  }
  function stab(t, notes) {
    var f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.25); f.Q.value = 3;
    env(g, t, 0.01, 0.09, 0.32); f.connect(g); g.connect(comp);
    notes.forEach(function (n, i) {
      var o = ctx.createOscillator(); o.type = i % 2 ? 'square' : 'sawtooth'; o.frequency.value = mtof(n); o.detune.value = (i - 1.5) * 6;
      o.connect(f); o.start(t); o.stop(t + 0.4);
    });
  }
  function pad(t, notes, dur) {
    var g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1200;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.035, t + 0.6); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    f.connect(g); g.connect(comp);
    notes.forEach(function (n) { var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(n + 12); o.connect(f); o.start(t); o.stop(t + dur + 0.05); });
  }
  function schedule(s, t) {
    var c = bar % 4, intro = bar < 2;
    if (s % 4 === 0) kick(t);                                   // trống bass mỗi phách
    if (s % 4 === 2) noise(t, 'highpass', 7500, 0.13, 0.05);    // hi-hat phách lẻ
    if (!intro && s % 2 === 1) noise(t, 'highpass', 9000, 0.04, 0.03);
    if (!intro && (s === 4 || s === 12)) noise(t, 'bandpass', 1500, 0.28, 0.16); // vỗ tay
    if (s % 4 === 2) bass(t, ROOT[c] + (s === 14 ? 7 : 0));      // bass phách lẻ
    if (!intro && (s === 6 || s === 14) && bar % 8 >= 4) stab(t, CHORD[c]);
    if (s === 0) pad(t, CHORD[c], SPB * 4);
  }
  function tick() {
    while (nextT < ctx.currentTime + 0.12) {
      schedule(step, nextT);
      nextT += STEP; step++; if (step === 16) { step = 0; bar++; }
    }
  }
  function start() {
    if (!ctx && !init()) return;
    ctx.resume();
    nextT = ctx.currentTime + 0.06; step = 0; bar = 0;
    if (!timer) timer = setInterval(tick, 25);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.38, ctx.currentTime + 1.5);
    on = true; paint();
  }
  function stop() {
    if (ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      setTimeout(function () { if (!on) { clearInterval(timer); timer = null; ctx.suspend(); } }, 450);
    }
    on = false; paint();
  }
  function save(v) { try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch (e) {} }
  btn.addEventListener('click', function () { if (on) { stop(); save(false); } else { start(); save(true); } });

  // Lần trước đã bật: phát lại ở lần chạm đầu tiên (trình duyệt cấm tự phát khi chưa chạm)
  var pref = null; try { pref = localStorage.getItem(KEY); } catch (e) {}
  if (pref === 'on') {
    var first = function (e) { if (e.target.closest && e.target.closest('.tcm')) return; document.removeEventListener('pointerdown', first, true); if (!on) start(); };
    document.addEventListener('pointerdown', first, true);
  }
  // Ẩn tab thì tạm dừng cho đỡ tốn pin
  document.addEventListener('visibilitychange', function () {
    if (!ctx || !on) return;
    if (document.hidden) { clearInterval(timer); timer = null; ctx.suspend(); }
    else { ctx.resume(); nextT = ctx.currentTime + 0.06; if (!timer) timer = setInterval(tick, 25); }
  });
  window.TCMusic = { start: start, stop: stop };
})();
