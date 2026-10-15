/* =====================================================================
   EcoDigital · il manifesto a schermate intere
   Sopra i 760 px ogni colpo di rotella, ogni freccia e ogni swipe porta
   esattamente alla schermata dopo o a quella prima, con un'animazione di
   700 ms. Sotto i 760 px si scorre a dito e ci pensa scroll-snap.
   Con prefers-reduced-motion il salto è immediato.
   Se questo file non parte, la pagina scorre normalmente.
   ===================================================================== */
(function () {
  'use strict';

  var screens = [].slice.call(document.querySelectorAll('.mscr'));
  if (screens.length < 2) return;

  var html = document.documentElement;
  var rmq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var wmq = window.matchMedia ? window.matchMedia('(min-width: 761px)') : null;
  function jackOn() { return wmq ? wmq.matches : window.innerWidth > 760; }
  function noMove() { return !!(rmq && rmq.matches); }

  var DUR = 700;
  var idx = 0, animating = false, raf = 0, safety = 0;
  var last = screens.length - 1;

  /* ---- easing cubic-bezier(.22,.72,.2,1) ----------------------------- */
  function bez(x1, y1, x2, y2) {
    function cx(t, a, b) { return ((1 - 3 * b + 3 * a) * t + (3 * b - 6 * a)) * t * t + 3 * a * t; }
    function dx(t, a, b) { return 3 * (1 - 3 * b + 3 * a) * t * t + 2 * (3 * b - 6 * a) * t + 3 * a; }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x, i, d;
      for (i = 0; i < 6; i++) {
        d = dx(t, x1, x2);
        if (Math.abs(d) < 1e-6) break;
        t -= (cx(t, x1, x2) - x) / d;
      }
      t = Math.max(0, Math.min(1, t));
      return cx(t, y1, y2);
    };
  }
  var ease = bez(0.22, 0.72, 0.2, 1);

  /* ---- i pallini a destra, col numero del punto ----------------------- */
  var dots = document.createElement('nav');
  dots.className = 'mdots';
  dots.setAttribute('aria-label', 'Schermate del manifesto');
  var btns = screens.map(function (sec, i) {
    var name = sec.getAttribute('data-name') || ('Schermata ' + (i + 1));
    var n = sec.getAttribute('data-n') || '';
    var b = document.createElement('button');
    b.type = 'button';
    b.title = name;
    b.setAttribute('aria-label', name);
    if (n) { b.className = 'num'; b.appendChild(document.createTextNode(n)); }
    b.addEventListener('click', function () { go(i); });
    dots.appendChild(b);
    return b;
  });
  document.body.appendChild(dots);

  function paint(i) {
    for (var k = 0; k < btns.length; k++) {
      if (k === i) btns[k].setAttribute('aria-current', 'true');
      else btns[k].removeAttribute('aria-current');
    }
    dots.classList.toggle('ondark', screens[i].classList.contains('dark'));
    for (var j = 0; j < screens.length; j++) screens[j].classList.toggle('on', j === i);
    var id = screens[i].getAttribute('id');
    if (id) { try { history.replaceState(null, '', '#' + id); } catch (e) {} }
  }

  /* ---- il salto da una schermata all'altra ---------------------------- */
  function topOf(i) {
    var y = window.pageYOffset || html.scrollTop || 0;
    return Math.round(screens[i].getBoundingClientRect().top + y);
  }

  function go(i, instant) {
    i = Math.max(0, Math.min(last, i));
    idx = i;
    paint(i);
    var from = window.pageYOffset || html.scrollTop || 0;
    var to = topOf(i);
    var d = to - from;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (safety) { clearTimeout(safety); safety = 0; }
    if (instant || noMove() || Math.abs(d) < 2) { window.scrollTo(0, to); animating = false; return; }
    animating = true;
    var t0 = 0;
    raf = requestAnimationFrame(function step(ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / DUR);
      window.scrollTo(0, from + d * ease(k));
      if (k < 1) raf = requestAnimationFrame(step);
      else { raf = 0; animating = false; window.scrollTo(0, topOf(i)); }
    });
    /* se requestAnimationFrame si ferma (scheda in secondo piano) la
       schermata arriva comunque a destinazione */
    safety = setTimeout(function () {
      if (animating) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0; animating = false;
        window.scrollTo(0, topOf(i));
      }
    }, DUR + 400);
  }

  /* ---- dove il dito e la rotella devono restare liberi ----------------- */
  /* il riquadro delle firme scorre per conto suo, e i campi che si aprono
     (elenchi a tendina, aree di testo) tengono il loro scorrimento. Quando
     il riquadro è arrivato in fondo la rotella torna a cambiare schermata */
  function freeArea(target, dy) {
    if (!target || !target.closest) return false;
    if (target.closest('textarea, select')) return true;
    var box = target.closest('.scrollarea');
    if (!box) return false;
    var room = box.scrollHeight - box.clientHeight;
    if (room < 4) return false;
    if (dy > 0) return box.scrollTop < room - 1;
    if (dy < 0) return box.scrollTop > 1;
    return true;
  }
  /* l'ultima schermata (firma e piede) può essere più alta della finestra:
     lì si scorre normalmente finché non si torna in cima */
  function tallLast() {
    return idx === last && screens[last].offsetHeight > window.innerHeight + 4;
  }

  /* ---- rotella e trackpad: un gesto, una schermata --------------------- */
  var acc = 0, accT = 0, locked = false, lockT = 0;
  function unlockLater() {
    clearTimeout(lockT);
    lockT = setTimeout(function () { locked = false; acc = 0; }, 170);
  }
  function onWheel(ev) {
    if (!jackOn()) return;
    if (freeArea(ev.target, ev.deltaY)) return;
    if (tallLast()) {
      var y = window.pageYOffset || html.scrollTop || 0;
      /* si torna alla schermata prima solo dalla cima dell'ultima */
      if (ev.deltaY > 0 || y > topOf(last) + 2) return;
    }
    ev.preventDefault();
    if (locked || animating) { unlockLater(); return; }
    var now = Date.now();
    if (now - accT > 220) acc = 0;
    accT = now;
    acc += ev.deltaY;
    if (Math.abs(acc) < 24) return;
    var dir = acc > 0 ? 1 : -1;
    acc = 0;
    locked = true;
    unlockLater();
    go(idx + dir);
  }
  window.addEventListener('wheel', onWheel, { passive: false });

  /* ---- tastiera -------------------------------------------------------- */
  window.addEventListener('keydown', function (ev) {
    if (!jackOn()) return;
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var t = ev.target;
    if (t && (/^(input|textarea|select|button|a)$/i.test(t.tagName) || t.isContentEditable)) {
      if (ev.key === ' ' || ev.key === 'Spacebar' || /^(input|textarea|select)$/i.test(t.tagName)) return;
    }
    var k = ev.key, n = null;
    if (k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Spacebar') n = idx + 1;
    else if (k === 'ArrowUp' || k === 'PageUp') n = idx - 1;
    else if (k === 'Home') n = 0;
    else if (k === 'End') n = last;
    if (n === null) return;
    ev.preventDefault();
    if (!animating) go(n);
  });

  /* ---- dito ------------------------------------------------------------ */
  var ty = null, tfree = false;
  window.addEventListener('touchstart', function (ev) {
    if (!jackOn()) return;
    tfree = freeArea(ev.target, 0);
    ty = ev.touches.length === 1 ? ev.touches[0].clientY : null;
  }, { passive: true });
  window.addEventListener('touchmove', function (ev) {
    if (!jackOn() || ty === null || tfree || tallLast()) return;
    ev.preventDefault();
  }, { passive: false });
  window.addEventListener('touchend', function (ev) {
    if (!jackOn() || ty === null) return;
    var dy = ev.changedTouches[0].clientY - ty;
    ty = null;
    if (tfree || animating || Math.abs(dy) < 40) return;
    go(idx + (dy < 0 ? 1 : -1));
  }, { passive: true });

  /* ---- i link interni: i bottoni dell'apertura e i pallini -------------- */
  document.addEventListener('click', function (ev) {
    if (!jackOn()) return;
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href');
    if (!id || id === '#') return;
    var dest = document.querySelector(id);
    if (!dest) return;
    var sec = dest.closest ? dest.closest('.mscr') : null;
    var i = screens.indexOf(sec || dest);
    if (i < 0) return;
    ev.preventDefault();
    go(i);
  });

  /* ---- la barra di scorrimento o un salto esterno: ci si riallinea ------ */
  var syncT = 0;
  window.addEventListener('scroll', function () {
    if (animating || !jackOn()) return;
    clearTimeout(syncT);
    syncT = setTimeout(function () {
      var y = window.pageYOffset || html.scrollTop || 0;
      var best = 0, bd = Infinity;
      for (var i = 0; i < screens.length; i++) {
        var d = Math.abs(topOf(i) - y);
        if (d < bd) { bd = d; best = i; }
      }
      if (best !== idx) { idx = best; paint(best); }
    }, 120);
  }, { passive: true });

  /* ---- avvio ----------------------------------------------------------- */
  function showAll() {
    html.classList.remove('jack');
    for (var i = 0; i < screens.length; i++) screens[i].classList.add('on');
  }

  function boot() {
    var start = 0;
    var h = window.location.hash || '';
    for (var i = 0; i < screens.length; i++) {
      if (h && '#' + screens[i].getAttribute('id') === h) { start = i; break; }
    }
    if (!jackOn()) { showAll(); return; }
    html.classList.add('jack');
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
    go(start, true);
  }

  var wasOn = null;
  function onResize() {
    var now = jackOn();
    if (now !== wasOn) {
      wasOn = now;
      if (now) { html.classList.add('jack'); go(idx, true); }
      else showAll();
      return;
    }
    if (now && !animating) window.scrollTo(0, topOf(idx));
  }
  window.addEventListener('resize', onResize);

  wasOn = jackOn();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
