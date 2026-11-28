/* TopChill – hàng thẻ cuộn ngang: kéo bằng chuột + nút ‹ › trên máy tính (điện thoại vẫn vuốt như cũ). */
(function () {
  var SEL = '.fs-row,.kvs-row,.fs-tabs,.kv-filter,.gb-filter,.mq-cities,.rk-tabs,#rankTabs,.citylinks';
  var fine = matchMedia('(pointer:fine)').matches;
  function drag(el) {
    if (el.__hs) return; el.__hs = 1;
    var down = false, x0 = 0, s0 = 0, moved = false;
    el.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moved = false; x0 = e.clientX; s0 = el.scrollLeft; });
    window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - x0; if (Math.abs(dx) > 5) { if (!moved) { moved = true; el.classList.add('hs-drag'); } el.scrollLeft = s0 - dx; e.preventDefault(); } });
    window.addEventListener('pointerup', function () { if (!down) return; down = false; setTimeout(function () { el.classList.remove('hs-drag'); }, 0); });
    el.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    el.addEventListener('dragstart', function (e) { e.preventDefault(); });
    el.addEventListener('wheel', function (e) { if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth + 4 && e.shiftKey) { el.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
  }
  function arrows(el) {
    if (el.__ha || !/fs-row|kvs-row/.test(el.className)) return; el.__ha = 1;
    var wrap = document.createElement('div'); wrap.className = 'hs-wrap'; el.parentNode.insertBefore(wrap, el); wrap.appendChild(el);
    ['prev', 'next'].forEach(function (d) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'hs-btn ' + d; b.setAttribute('aria-label', d === 'prev' ? 'Xem trước' : 'Xem tiếp'); b.textContent = d === 'prev' ? '‹' : '›';
      b.onclick = function () { var c = el.firstElementChild, w = c ? c.getBoundingClientRect().width + 12 : 300; el.scrollBy({ left: (d === 'prev' ? -1 : 1) * Math.max(w, el.clientWidth * .8), behavior: 'smooth' }); };
      wrap.appendChild(b);
    });
    function upd() { var max = el.scrollWidth - el.clientWidth - 4; wrap.classList.toggle('at-start', el.scrollLeft <= 4); wrap.classList.toggle('at-end', el.scrollLeft >= max); wrap.classList.toggle('no-scroll', max <= 0); }
    el.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); setTimeout(upd, 50); new MutationObserver(function () { setTimeout(upd, 50); }).observe(el, { childList: true });
  }
  function scan() { if (!fine) return; document.querySelectorAll(SEL).forEach(function (el) { drag(el); arrows(el); }); }
  var css = document.createElement('style');
  css.textContent = '@media (pointer:fine){' + SEL.split(',').map(function (s) { return s + '{cursor:grab}'; }).join('') +
    '.hs-drag{cursor:grabbing!important;scroll-snap-type:none!important;user-select:none}.hs-drag *{pointer-events:none}' +
    '.hs-wrap{position:relative}.hs-btn{position:absolute;top:50%;transform:translateY(-50%);z-index:5;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(10,6,16,.85);color:#fff;font-size:28px;line-height:1;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.5);display:grid;place-items:center;padding:0 0 4px}' +
    '.hs-btn:hover{background:#ff3f8e;border-color:#ff3f8e}.hs-btn.prev{left:-8px}.hs-btn.next{right:-8px}' +
    '.hs-wrap.at-start .hs-btn.prev,.hs-wrap.at-end .hs-btn.next,.hs-wrap.no-scroll .hs-btn{opacity:0;pointer-events:none}}';
  document.head.appendChild(css);
  scan(); new MutationObserver(function () { clearTimeout(scan.t); scan.t = setTimeout(scan, 150); }).observe(document.body, { childList: true, subtree: true });
})();
