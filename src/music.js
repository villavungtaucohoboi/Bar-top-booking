/* TopChill – nhạc nền bật/tắt, 3 bài EDM gốc tạo bằng Web Audio.
 * Không tải file nhạc, không bản quyền, ~15KB code. Mặc định TẮT; trình duyệt chỉ cho phát sau khi người dùng chạm.
 * Bài: Neon Rush (EDM 128 BPM, có build-up và drop) · Quẩy Tới Sáng (house 126 BPM) · Chill Đêm (melodic house 112 BPM). */
(function () {
  if (window.TCMusic) return;
  var KEY = 'topchill-music', TKEY = 'topchill-track';

  /* ---------- 3 bài ---------- */
  var _ = 0;
  var TRACKS = [
    { name: 'Neon Rush', bpm: 128, loop: 24,
      roots: [41, 37, 44, 39],                                   // Fm – Db – Ab – Eb
      chords: [[65, 68, 72], [61, 65, 68], [63, 68, 72], [63, 67, 70]],
      lead: [
        [72,_,72,_,75,_,72,_,_,70,_,68,_,70,_,_],
        [68,_,68,_,72,_,68,_,_,65,_,68,_,70,_,_],
        [72,_,72,_,75,_,77,_,_,75,_,72,_,70,_,_],
        [70,_,70,_,67,_,70,_,72,_,70,_,67,_,63,_]],
      bassSteps: [2, 6, 10, 14], bassOct: 0,
      sec: function (b) {
        if (b < 4) return { pad: 1, pluck: 1, hat: b >= 2 };                              // mở bài
        if (b < 8) return { pad: 1, pluck: 1, kick: 1, hat: 1, roll: b - 4, riser: b >= 6, cut: b === 7 }; // dồn nhịp
        return { kick: 1, clap: 1, hat: 1, ohat: 1, bass: 1, saw: 1, pad: 1, crash: b === 8 || b === 16 }; // drop
      } },
    { name: 'Quẩy Tới Sáng', bpm: 126, loop: 16,
      roots: [38, 46, 41, 36],                                   // Dm – Bb – F – C
      chords: [[62, 65, 69, 72], [62, 65, 70, 74], [60, 65, 69, 72], [60, 64, 67, 72]],
      lead: [
        [_,_,74,_,_,_,77,_,_,_,76,_,74,_,_,_],
        [_,_,74,_,_,_,72,_,_,_,70,_,72,_,_,_],
        [_,_,69,_,_,_,72,_,_,_,74,_,77,_,76,_],
        [_,_,72,_,_,_,74,_,_,_,72,_,67,_,_,_]],
      bassSteps: [0, 3, 6, 8, 11, 14], bassOct: 12, stabSteps: [3, 6, 11, 14],
      sec: function (b) {
        if (b < 2) return { kick: 1, hat: 1 };
        if (b < 4) return { kick: 1, hat: 1, bass: 1, stab: 1 };
        if (b < 12) return { kick: 1, clap: 1, hat: 1, ohat: 1, bass: 1, stab: 1, pluck: b >= 8, crash: b === 4 };
        return { pad: 1, stab: 1, hat: 1, roll: b - 12, riser: b >= 14, cut: b === 15 };
      } },
    { name: 'Chill Đêm', bpm: 112, loop: 16,
      roots: [45, 41, 48, 43],                                   // Am – F – C – G
      chords: [[60, 64, 69], [60, 65, 69], [60, 64, 67], [59, 62, 67]],
      lead: [
        [76,_,_,72,_,_,74,_,76,_,_,79,_,76,_,_],
        [77,_,_,72,_,_,74,_,72,_,_,69,_,72,_,_],
        [76,_,_,72,_,_,79,_,76,_,_,74,_,72,_,_],
        [74,_,_,71,_,_,74,_,79,_,_,76,_,74,_,_]],
      bassSteps: [0, 7, 10], bassOct: 0, soft: 1,
      sec: function (b) {
        if (b < 4) return { pad: 1, pluck: 1, shaker: 1 };
        return { kick: 1, clap: 1, shaker: 1, bass: 1, pad: 1, pluck: 1 };
      } }
  ];
  var ti = 0; try { ti = Math.min(TRACKS.length - 1, Math.max(0, +localStorage.getItem(TKEY) || 0)); } catch (e) {}

  /* ---------- nút ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.tcm{position:fixed;left:max(18px,env(safe-area-inset-left,0px));bottom:calc(22px + env(safe-area-inset-bottom,0px));z-index:89;display:flex;align-items:center;height:48px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(16,10,24,.8);color:#fff;font:600 14px "Be Vietnam Pro",system-ui,sans-serif;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 8px 24px rgba(0,0,0,.35);overflow:hidden}' +
    '.tcm button{all:unset;cursor:pointer;display:flex;align-items:center;gap:9px;height:48px;box-sizing:border-box}' +
    '.tcm button:focus-visible{outline:2px solid #45d5ff;outline-offset:-3px;border-radius:999px}' +
    '.tcm .tg{padding:0 14px 0 6px}' +
    '.tcm .ic{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.1);font-size:17px;flex:none}' +
    '.tcm .tx{display:flex;flex-direction:column;line-height:1.15}' +
    '.tcm .tx small{font-size:11px;font-weight:500;color:#c9bfdc}' +
    '.tcm .nx{display:none;padding:0 14px 0 10px;border-left:1px solid rgba(255,255,255,.14);font-size:16px}' +
    '.tcm .bars{display:none;align-items:flex-end;gap:2px;height:16px}' +
    '.tcm .bars i{width:3px;border-radius:2px;background:linear-gradient(#ff8fd0,#b146ff);animation:tcmB var(--sp,.47s) ease-in-out infinite alternate}' +
    '.tcm .bars i:nth-child(2){animation-delay:-.2s}.tcm .bars i:nth-child(3){animation-delay:-.35s}.tcm .bars i:nth-child(4){animation-delay:-.1s}' +
    '@keyframes tcmB{from{height:4px}to{height:16px}}' +
    '.tcm.on{border-color:rgba(255,63,174,.7);box-shadow:0 0 18px rgba(255,63,174,.45)}' +
    '.tcm.on .ic{background:linear-gradient(135deg,#ff6fb5,#b146ff)}' +
    '.tcm.on .bars,.tcm.on .nx{display:flex}' +
    'html.music-on .tc-eq i{animation-duration:var(--tc-beat,.47s)!important}' +
    '@media (max-width:1100px){.tcm{bottom:calc(88px + env(safe-area-inset-bottom,0px))}}' +
    '@media (max-width:720px){.tcm{height:46px}.tcm button{height:46px}.tcm .tx{display:none}.tcm .tg{padding:0 6px}.tcm.on .tg{padding-right:10px}}' +
    'body.tcc-open .tcm,body:has(.modal:not([hidden])) .tcm{display:none}' +
    '@media (prefers-reduced-motion:reduce){.tcm .bars i{animation:none;height:10px}}';
  document.head.appendChild(css);
  var box = document.createElement('div'); box.className = 'tcm';
  box.innerHTML = '<button type="button" class="tg"><span class="ic" aria-hidden="true">🔇</span><span class="tx"><b>Bật nhạc</b><small></small></span><span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>' +
    '<button type="button" class="nx" aria-label="Chuyển bài">⏭</button>';
  var tg = box.querySelector('.tg'), nx = box.querySelector('.nx');
  var on = false;
  function paint() {
    var T = TRACKS[ti], beat = (60 / T.bpm).toFixed(3) + 's';
    box.classList.toggle('on', on);
    box.querySelector('.ic').textContent = on ? '🔊' : '🔇';
    box.querySelector('.tx b').textContent = on ? 'Tắt nhạc' : 'Bật nhạc';
    box.querySelector('.tx small').textContent = '♪ ' + T.name;
    box.style.setProperty('--sp', beat);
    document.documentElement.style.setProperty('--tc-beat', beat);
    tg.setAttribute('aria-pressed', on ? 'true' : 'false');
    tg.setAttribute('aria-label', (on ? 'Tắt' : 'Bật') + ' nhạc nền, bài ' + T.name);
    nx.setAttribute('aria-label', 'Chuyển bài, đang phát ' + T.name);
    document.documentElement.classList.toggle('music-on', on);
  }
  function attach() { document.body.appendChild(box); paint(); }
  if (document.body) attach(); else document.addEventListener('DOMContentLoaded', attach);

  /* ---------- bộ máy âm thanh ---------- */
  var ctx, comp, master, padBus, fxIn, noiseBuf, timer = null, nextT = 0, step = 0, bar = 0;
  function init() {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = .004; comp.release.value = .15;
    master = ctx.createGain(); master.gain.value = 0;
    comp.connect(master); master.connect(ctx.destination);
    padBus = ctx.createGain(); padBus.connect(comp);                       // bus bị "nén nhịp" theo trống
    var dl = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain();
    fxIn = ctx.createGain(); fb.gain.value = .32; wet.gain.value = .28;
    fxIn.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(comp);
    fxIn._delay = dl;
    var len = ctx.sampleRate; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0); for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  var mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + dec); }
  function kick(t, soft) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(soft ? 120 : 160, t); o.frequency.exponentialRampToValueAtTime(44, t + .11);
    env(g, t, .002, soft ? .75 : 1, .36); o.connect(g); g.connect(comp); o.start(t); o.stop(t + .42);
    var c = ctx.createOscillator(), cg = ctx.createGain(); c.type = 'square'; c.frequency.value = 1800;   // tiếng "click" đầu trống
    env(cg, t, .001, soft ? .02 : .06, .012); c.connect(cg); cg.connect(comp); c.start(t); c.stop(t + .03);
    padBus.gain.cancelScheduledValues(t); padBus.gain.setValueAtTime(.22, t); padBus.gain.linearRampToValueAtTime(1, t + .26);
  }
  function noise(t, type, freq, peak, dec, q) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; if (q) f.Q.value = q; env(g, t, .002, peak, dec);
    s.connect(f); f.connect(g); g.connect(comp); s.start(t, Math.random() * .4); s.stop(t + dec + .05);
  }
  function clap(t, soft) { var v = soft ? .16 : .3; noise(t, 'bandpass', 1400, v, .03, 1.2); noise(t + .012, 'bandpass', 1400, v, .03, 1.2); noise(t + .024, 'bandpass', 1300, v, .17, 1); }
  function riser(t, dur) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = 'bandpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(9000, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.22, t + dur);
    s.connect(f); f.connect(g); g.connect(comp); s.start(t); s.stop(t + dur);
  }
  function bass(t, note, len, soft) {
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = soft ? 'sine' : 'sawtooth'; o2.type = 'sine'; o.frequency.value = mtof(note); o2.frequency.value = mtof(note - 12);
    f.type = 'lowpass'; f.frequency.setValueAtTime(soft ? 600 : 1400, t); f.frequency.exponentialRampToValueAtTime(soft ? 300 : 260, t + len); f.Q.value = soft ? 1 : 7;
    env(g, t, .006, soft ? .4 : .3, len); o.connect(f); o2.connect(f); f.connect(g); g.connect(padBus);
    o.start(t); o2.start(t); o.stop(t + len + .05); o2.stop(t + len + .05);
  }
  function supersaw(t, note, len) {
    var f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.frequency.value = 4200; f.Q.value = 1;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .01); g.gain.setValueAtTime(.12, t + len * .7); g.gain.exponentialRampToValueAtTime(.0001, t + len);
    f.connect(g); g.connect(comp); g.connect(fxIn);
    [-16, -7, 0, 7, 16].forEach(function (dt) { [0, 12].forEach(function (oc) { var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(note + oc); o.detune.value = dt; o.connect(f); o.start(t); o.stop(t + len + .02); }); });
  }
  function pluck(t, note, vol) {
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'triangle'; o2.type = 'square'; o.frequency.value = mtof(note); o2.frequency.value = mtof(note + 12);
    f.type = 'lowpass'; f.frequency.setValueAtTime(5000, t); f.frequency.exponentialRampToValueAtTime(800, t + .25);
    var g2 = ctx.createGain(); g2.gain.value = .25; o2.connect(g2); g2.connect(f);
    env(g, t, .003, vol || .16, .32); o.connect(f); f.connect(g); g.connect(comp); g.connect(fxIn);
    o.start(t); o2.start(t); o.stop(t + .4); o2.stop(t + .4);
  }
  function stab(t, notes) {
    var f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(900, t + .2); f.Q.value = 2;
    env(g, t, .004, .11, .22); f.connect(g); g.connect(padBus); g.connect(fxIn);
    notes.forEach(function (n, i) { var o = ctx.createOscillator(); o.type = i % 2 ? 'square' : 'triangle'; o.frequency.value = mtof(n); o.start(t); o.stop(t + .3); o.connect(f); });
  }
  function pad(t, notes, dur, vol) {
    var g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1800;
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol || .045, t + .5); g.gain.linearRampToValueAtTime(.0001, t + dur);
    f.connect(g); g.connect(padBus);
    notes.forEach(function (n) { [-8, 8].forEach(function (dt) { var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(n); o.detune.value = dt; o.connect(f); o.start(t); o.stop(t + dur + .05); }); });
  }

  function schedule(s, t) {
    var T = TRACKS[ti], b = bar % T.loop, c = b % 4, S = T.sec(b), SPB = 60 / T.bpm, ST = SPB / 4;
    if (S.cut && s >= 12) return;                                                    // lặng một nhịp trước drop
    if (S.kick && s % 4 === 0) kick(t, T.soft);
    if (S.clap && (s === 4 || s === 12)) clap(t, T.soft);
    if (S.hat && s % 4 === 2) noise(t, 'highpass', 8000, T.soft ? .07 : .12, .045);
    if (S.ohat && s % 4 === 2) noise(t, 'highpass', 6500, .05, .2);
    if (S.shaker && s % 2 === 1) noise(t, 'highpass', 9500, .035, .03);
    if (S.roll !== undefined) { var every = S.roll >= 3 ? 1 : S.roll >= 2 ? 2 : 4; if (s % every === 0) noise(t, 'bandpass', 1800 + S.roll * 400, .1 + S.roll * .05, .07, 1); }
    if (S.riser && s === 0 && (b % 2 === 0)) riser(t, SPB * 8);
    if (S.crash && s === 0) noise(t, 'highpass', 5000, .22, 1.6);
    if (S.bass && T.bassSteps.indexOf(s) >= 0) bass(t, T.roots[c] + T.bassOct + (s === 14 && !T.soft ? 12 : 0), ST * (T.soft ? 3 : 1.6), T.soft);
    if (S.stab && T.stabSteps && T.stabSteps.indexOf(s) >= 0) stab(t, T.chords[c]);
    if (S.pad && s === 0) pad(t, T.chords[c], SPB * 4, T.soft ? .065 : .055);
    var n = T.lead[c][s];
    if (n) {
      if (S.saw) { var k = s + 1; while (k < 16 && !T.lead[c][k]) k++; supersaw(t, n, Math.min(k - s, 3) * ST); }
      else if (S.pluck) pluck(t, n, T.soft ? .24 : .2);
    }
  }
  function tick() {
    var ST = 60 / TRACKS[ti].bpm / 4, now = ctx.currentTime;
    if (nextT < now - .05) nextT = now + .05;              // máy bận làm trễ: bỏ nhịp đã lỡ, không dồn cục
    while (nextT < now + .2) { schedule(step, nextT); nextT += ST; step++; if (step === 16) { step = 0; bar++; } }
  }
  function fade(to, sec) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime); master.gain.linearRampToValueAtTime(to, ctx.currentTime + sec); }

  /* iPhone: Web Audio bị tắt theo nút gạt im lặng. Phát kèm một thẻ <audio> im lặng để chuyển sang chế độ phát nhạc. */
  var keep = null;
  function silentWav() {
    var n = 8000, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf), w = function (o, t) { for (var i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }
  function unlockIOS() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    try {
      if (!keep) { keep = document.createElement('audio'); keep.src = silentWav(); keep.loop = true; keep.setAttribute('playsinline', ''); keep.setAttribute('aria-hidden', 'true'); keep.volume = 0.01; }
      var p = keep.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }
  function running() { return ctx && ctx.state === 'running'; }
  function begin() {
    fxIn._delay.delayTime.value = 60 / TRACKS[ti].bpm * .75;
    nextT = ctx.currentTime + .08; step = 0; bar = 0;
    if (!timer) timer = setInterval(tick, 25);
    fade(.75, 1.2);
  }
  var hintEl = null;
  function hint(t) {
    if (!hintEl) { hintEl = document.createElement('div'); hintEl.style.cssText = 'position:fixed;left:50%;bottom:calc(150px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:200;background:rgba(20,12,28,.95);color:#fff;padding:10px 16px;border-radius:12px;font:600 14px "Be Vietnam Pro",system-ui,sans-serif;border:1px solid rgba(255,63,174,.5);max-width:calc(100% - 32px);text-align:center;transition:opacity .3s'; document.body.appendChild(hintEl); }
    hintEl.textContent = t; hintEl.style.opacity = '1'; clearTimeout(hintEl._t); hintEl._t = setTimeout(function () { hintEl.style.opacity = '0'; }, 2600);
  }
  function start(fromGesture) {
    if (!ctx && !init()) { hint('Trình duyệt này không hỗ trợ phát nhạc.'); return; }
    if (fromGesture) unlockIOS();
    on = true; paint();
    var p = ctx.resume();
    var after = function () {
      if (!on) return;
      if (running()) { begin(); }
      else { on = false; paint(); if (fromGesture) hint('Chưa bật được nhạc. Chạm nút nhạc lần nữa.'); }
    };
    if (p && p.then) p.then(after, after); else setTimeout(after, 60);
    // Trình duyệt có thể treo lệnh resume (không báo lỗi) khi chưa có thao tác chạm: sau 1 giây vẫn chưa chạy thì trả nút về
    setTimeout(function () { if (on && !running()) { on = false; paint(); if (fromGesture) hint('Chưa bật được nhạc. Chạm nút nhạc lần nữa.'); } }, 1000);
  }
  function stop() {
    on = false; paint();
    if (keep) try { keep.pause(); } catch (e) {}
    if (ctx) { fade(0, .3); setTimeout(function () { if (!on) { clearInterval(timer); timer = null; ctx.suspend(); } }, 350); }
  }
  function next() {
    ti = (ti + 1) % TRACKS.length; try { localStorage.setItem(TKEY, ti); } catch (e) {}
    if (on && running()) { fade(0, .2); setTimeout(function () { if (!on) return; fxIn._delay.delayTime.value = 60 / TRACKS[ti].bpm * .75; nextT = ctx.currentTime + .05; step = 0; bar = 0; fade(.75, .6); }, 220); }
    paint();
  }
  function save(v) { try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch (e) {} }
  // Bấm nút: nếu đang báo bật mà thực tế không phát (bị chặn, bị ngắt) thì coi là bật lại, không tắt
  tg.addEventListener('click', function () { if (on && running()) { stop(); save(false); } else { start(true); save(true); } });
  nx.addEventListener('click', next);

  // Đã bật lần trước: phát lại ở lần chạm đầu tiên. Chỉ "nhấc tay", "click", phím mới được trình duyệt cho phép phát.
  var pref = null; try { pref = localStorage.getItem(KEY); } catch (e) {}
  if (pref === 'on') {
    var EV = ['pointerup', 'touchend', 'click', 'keydown'];
    var first = function (e) {
      if (e.target && e.target.closest && e.target.closest('.tcm')) return;
      if (e.type === 'keydown' && e.key === 'Escape') return;
      EV.forEach(function (n) { document.removeEventListener(n, first, true); });
      if (!running()) start(true);
    };
    EV.forEach(function (n) { document.addEventListener(n, first, true); });
  }
  // Bị cuộc gọi / chuyển app ngắt: quay lại thì thử phát tiếp, không được thì đưa nút về "Bật nhạc"
  document.addEventListener('visibilitychange', function () {
    if (!ctx || !on) return;
    if (document.hidden) { clearInterval(timer); timer = null; ctx.suspend(); return; }
    var p = ctx.resume(), after = function () { if (!on) return; if (running()) { nextT = ctx.currentTime + .08; if (!timer) timer = setInterval(tick, 25); } else { on = false; paint(); } };
    if (p && p.then) p.then(after, after); else setTimeout(after, 60);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted && on && !running()) { on = false; paint(); } });
  function watchState() { if (!ctx || ctx._w) return; ctx._w = 1; ctx.addEventListener && ctx.addEventListener('statechange', function () { if (on && !document.hidden && ctx.state !== 'running' && ctx.state !== 'suspended') { on = false; paint(); } }); }
  var _init = init; init = function () { var r = _init(); if (r) watchState(); return r; };
  window.TCMusic = { start: start, stop: stop, next: next };
})();
