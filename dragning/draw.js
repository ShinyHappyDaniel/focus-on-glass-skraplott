(() => {
  // ---------- predetermined result (from the server in production) ----------
  const WINNERS = [
    { no: '4827', name: 'Maria Sjöberg', store: 'Stockholm' },
    { no: '0391', name: 'Johan Ek',     store: 'Göteborg' },
    { no: '7714', name: 'Sara Holm',    store: 'Malmö' },
    { no: '2265', name: 'Erik Nyberg',  store: 'Uppsala' },
  ];
  const POOL = Array.from({ length: 60 }, () => String(Math.floor(Math.random() * 10000)).padStart(4, '0'));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const FONT = '"Fjalla One", "Arial Narrow", sans-serif';

  const stage = document.getElementById('stage');
  const drawBtn = document.getElementById('drawBtn');
  const resetBtn = document.getElementById('resetBtn');
  const winnersEl = document.getElementById('winners');
  let idx = 0, busy = false;

  // winners list
  function renderList() {
    winnersEl.innerHTML = WINNERS.map((w, i) => {
      const on = i < idx;
      return `<div class="w ${on ? 'on' : ''}"><span class="n">${on ? w.no : '····'}</span><span class="nm">${on ? w.name : 'Winner ' + (i + 1)}</span><span class="st">${on ? w.store : 'Not drawn yet'}</span></div>`;
    }).join('');
    drawBtn.textContent = idx < 4 ? `Dra vinnare ${idx + 1} av 4` : 'Alla fyra dragna';
    drawBtn.disabled = busy || idx >= 4;
  }

  // ---------- fireworks (shared) ----------
  const fx = document.getElementById('fx'), fctx = fx.getContext('2d');
  let parts = [], fraf = 0;
  const COLORS = ['#fb0020', '#ffffff', '#ffcf5a', '#7cc7ff', '#ff8a3d'];
  function burst(x, y, n, sp) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = sp * (0.35 + Math.random() * 0.65);
      parts.push({ k: 's', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, d: .012 + Math.random() * .014, r: 1.6 + Math.random() * 2.2, c: COLORS[i % COLORS.length] });
    }
  }
  function confetti(n) {
    for (let i = 0; i < n; i++) parts.push({ k: 'c', x: Math.random() * innerWidth, y: -20 - Math.random() * 200, vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 3, a: Math.random() * 6, va: (Math.random() - .5) * .3, s: 6 + Math.random() * 7, life: 1, d: .004 + Math.random() * .004, c: COLORS[i % COLORS.length] });
  }
  function fxLoop() {
    const k = fx.width / innerWidth;
    fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.clearRect(0, 0, fx.width, fx.height); fctx.scale(k, k);
    parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 40);
    for (const p of parts) {
      if (p.k === 's') { p.vx *= .965; p.vy = p.vy * .965 + .09; p.x += p.vx; p.y += p.vy; p.life -= p.d; fctx.globalAlpha = Math.max(p.life, 0); fctx.fillStyle = p.c; fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, 7); fctx.fill(); }
      else { p.vx += Math.sin(p.a) * .03; p.x += p.vx; p.y += p.vy; p.a += p.va; p.life -= p.d; fctx.globalAlpha = Math.min(1, p.life * 2); fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.a); fctx.scale(1, Math.cos(p.a * 2)); fctx.fillStyle = p.c; fctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); fctx.restore(); }
    }
    fctx.globalAlpha = 1;
    if (parts.length) fraf = requestAnimationFrame(fxLoop); else fctx.clearRect(0, 0, fx.width, fx.height);
  }
  function celebrate() {
    if (reduced) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    fx.width = innerWidth * dpr; fx.height = innerHeight * dpr;
    const r = stage.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * .45;
    burst(cx, cy, 90, 11);
    setTimeout(() => burst(r.left + r.width * .2, cy - 40, 55, 8), 180);
    setTimeout(() => burst(r.left + r.width * .8, cy - 20, 55, 8), 330);
    confetti(110);
    cancelAnimationFrame(fraf); fxLoop();
  }

  // ---------- canvas helper ----------
  function fit(cv) {
    const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W: r.width, H: r.height };
  }
  function showCaption(scene, w, i) {
    const c = scene.querySelector('.caption');
    c.querySelector('.tag').textContent = `WINNER ${i + 1} · TICKET ${w.no}`;
    c.querySelector('.who').textContent = w.name;
    c.querySelector('.where').textContent = `Scandinavian Photo ${w.store}`;
    c.classList.add('show');
    scene.querySelector('.idle').hidden = true;
  }
  function hideCaption(scene) { scene.querySelector('.caption').classList.remove('show'); }

  // =====================================================================
  // 2 · BLÄNDAREN — blurred numbers drift as bokeh; the iris closes and one number snaps into focus
  // =====================================================================
  const iris = (() => {
    const scene = document.getElementById('s-iris'), cv = document.getElementById('c-iris');
    let raf = 0, anim = null, shown = null, floaters = [], bokeh = [], last = 0, twist = 0;
    function seed() {
      floaters = POOL.slice(0, 26).map(no => ({ no, x: Math.random(), y: Math.random(), s: .6 + Math.random() * .9, v: (.2 + Math.random() * .6) * (Math.random() < .5 ? -1 : 1) }));
      const hues = ['255,176,80', '255,214,150', '251,0,32', '120,200,255', '255,255,255', '255,120,60'];
      bokeh = Array.from({ length: 34 }, () => ({ x: Math.random(), y: Math.random(), r: .02 + Math.random() * .06, c: hues[Math.floor(Math.random() * hues.length)], a: .12 + Math.random() * .25, v: (Math.random() - .5) * .3 }));
    }
    function blades(ctx, cx, cy, r, tw, N) {
      const BIG = 4000;
      for (let i = 0; i < N; i++) {
        const a = i * Math.PI * 2 / N + tw * .6;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.translate(r, 0); ctx.rotate(.55);
        ctx.fillStyle = i % 2 ? '#141414' : '#191919';
        ctx.fillRect(0, -BIG, BIG, BIG * 2);
        ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -BIG); ctx.lineTo(0, BIG); ctx.stroke();
        ctx.restore();
      }
    }
    function frame(t) {
      const { ctx, W, H } = fit(cv);
      const dt = Math.min(32, t - (last || t)) / 16.7; last = t;
      const cx = W / 2, cy = H * .42, rMin = Math.min(W, H) * .3, rMax = Math.hypot(W, H);
      let p = 0, focus = 0, speed = 1;
      if (anim) {
        const e = t - anim.t0;
        p = ease(clamp(e / 2200, 0, 1));                 // iris closing
        focus = easeOut(clamp((e - 1300) / 1300, 0, 1)); // number pulls into focus
        speed = 1 + Math.sin(clamp(e / 2200, 0, 1) * Math.PI) * 5;
        if (e > 2700 && !anim.fired) { anim.fired = true; shown = anim.w; anim.cb(); }
      } else if (shown) { p = 1; focus = 1; }
      twist += .002 * speed * dt;
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * .7);
      g.addColorStop(0, '#0f2233'); g.addColorStop(1, '#03060a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (const b of bokeh) {
        b.x = (b.x + b.v * .0012 * speed * dt + 1) % 1;
        const x = b.x * W, y = b.y * H, r = b.r * W;
        const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, `rgba(${b.c},${b.a * .5})`); rg.addColorStop(.82, `rgba(${b.c},${b.a})`); rg.addColorStop(1, `rgba(${b.c},0)`);
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const fade = 1 - focus;
      for (const f of floaters) {
        f.x = (f.x + f.v * .0009 * speed * dt + 1) % 1;
        ctx.globalAlpha = .38 * fade + .06;
        ctx.filter = 'blur(5px)';
        ctx.fillStyle = '#fff'; ctx.font = `${Math.round(H * .09 * f.s)}px ${FONT}`;
        ctx.fillText(f.no, f.x * W, f.y * H);
      }
      ctx.filter = 'none'; ctx.globalAlpha = 1;
      // winning number: from blurred to sharp
      const w = anim ? anim.w : shown;
      if (w && focus > 0) {
        const blur = (1 - focus) * 18;
        ctx.filter = blur > .3 ? `blur(${blur.toFixed(1)}px)` : 'none';
        ctx.globalAlpha = Math.min(1, focus * 1.6);
        ctx.fillStyle = '#ffffff'; ctx.font = `${Math.round(H * .17)}px ${FONT}`;
        ctx.fillText(w.no, cx, cy + H * .01);
        ctx.filter = 'none'; ctx.globalAlpha = 1;
      }
      // iris
      const r = rMax + (rMin - rMax) * p;
      if (r < rMax * .98) blades(ctx, cx, cy, r, twist + p * 1.2, 9);
      // AF brackets lock when sharp
      if (w && focus > .98) {
        const bw = rMin * .78, bh = rMin * .42, L = Math.min(W, H) * .045;
        ctx.strokeStyle = '#fb0020'; ctx.lineWidth = Math.max(2, W * .0035);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
          const x = cx + sx * bw, y = cy + sy * bh;
          ctx.beginPath(); ctx.moveTo(x - sx * L, y); ctx.lineTo(x, y); ctx.lineTo(x, y - sy * L); ctx.stroke();
        });
      }
      raf = requestAnimationFrame(frame);
    }
    return {
      start() { if (!floaters.length) seed(); last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); },
      stop() { cancelAnimationFrame(raf); },
      reset() { anim = null; shown = null; hideCaption(scene); scene.querySelector('.idle').hidden = false; seed(); },
      reveal(w, i, cb) {
        hideCaption(scene); shown = null; scene.querySelector('.idle').hidden = true;
        anim = { w, t0: performance.now() - (reduced ? 3000 : 0), cb: () => { showCaption(scene, w, i); cb(); } };
        setTimeout(() => { if (anim && anim.w === w) { if (!anim.fired) { anim.fired = true; anim.cb(); } shown = w; anim = null; } }, reduced ? 60 : 2800);
      }
    };
  })();


  // ---------- controls ----------
  function reset() { idx = 0; iris.reset(); renderList(); }
  drawBtn.addEventListener('click', () => {
    if (busy || idx >= 4) return;
    busy = true; renderList();
    const i = idx, w = WINNERS[i];
    iris.reveal(w, i, () => { idx = i + 1; busy = false; renderList(); celebrate(); });
  });
  resetBtn.addEventListener('click', () => { if (!busy) reset(); });

  const boot = () => { reset(); iris.start(); };
  (document.fonts && document.fonts.load)
    ? Promise.all([document.fonts.load('40px "Fjalla One"'), document.fonts.load('16px "Noto Sans"')]).then(boot, boot)
    : boot();
})();
