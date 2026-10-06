(() => {
  // ---------- predetermined result (from the server in production) ----------
  const WINNERS = [
    { no: '4827', name: 'Maria Sjöberg', store: 'Stockholm' },
    { no: '0391', name: 'Johan Ek',      store: 'Göteborg' },
    { no: '7714', name: 'Sara Holm',     store: 'Malmö' },
    { no: '2265', name: 'Erik Nyberg',   store: 'Uppsala' },
  ];
  // decorative numbers drifting in the background
  const POOL = Array.from({ length: 60 }, () => String(Math.floor(Math.random() * 10000)).padStart(4, '0'));

  // ---------- timeline (ms) ----------
  const T = {
    rush: 2600,    // bokeh and numbers speed up, iris still open
    stops: 4800,   // iris closes in f-stop clicks; blurred numbers flicker in the centre
    hunt: 3400,    // focus hunts back and forth on the winning number
    lock: 600,     // AF locks (red), then the name appears
  };
  const TOTAL = T.rush + T.stops + T.hunt + T.lock;
  const FSTOPS = ['1.4', '2', '2.8', '4', '5.6', '8'];

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const FONT = '"Fjalla One", "Arial Narrow", sans-serif';

  const cv = document.getElementById('view');
  const drawBtn = document.getElementById('drawBtn'), resetBtn = document.getElementById('resetBtn'), fsBtn = document.getElementById('fsBtn');
  const capEl = document.getElementById('caption'), idleEl = document.getElementById('idle'), band = document.getElementById('band');
  let idx = 0, busy = false;

  // ---------- winners band ----------
  function renderBand(fresh) {
    band.innerHTML = WINNERS.map((w, i) => {
      const on = i < idx;
      return `<div class="w ${on ? 'on' : ''} ${fresh === i ? 'new' : ''}"><span class="lbl">Winner ${i + 1}</span><span class="n">${on ? w.no : '····'}</span><span class="nm">${on ? w.name : '—'}</span><span class="st">${on ? 'Scandinavian Photo ' + w.store : ' '}</span></div>`;
    }).join('');
    drawBtn.textContent = idx < 4 ? `Dra vinnare ${idx + 1} av 4` : 'Alla fyra dragna';
    drawBtn.disabled = busy || idx >= 4;
    resetBtn.disabled = busy;
  }

  // ---------- fireworks ----------
  const fx = document.getElementById('fx'), fctx = fx.getContext('2d');
  let parts = [], fraf = 0;
  const COLORS = ['#fb0020', '#ffffff', '#ffcf5a', '#7cc7ff', '#ff8a3d'];
  function burst(x, y, n, sp) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = sp * (0.35 + Math.random() * 0.65);
      parts.push({ k: 's', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, d: .010 + Math.random() * .012, r: 1.8 + Math.random() * 2.6, c: COLORS[i % COLORS.length] });
    }
  }
  function confetti(n) {
    for (let i = 0; i < n; i++) parts.push({ k: 'c', x: Math.random() * innerWidth, y: -20 - Math.random() * 260, vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 3, a: Math.random() * 6, va: (Math.random() - .5) * .3, s: 7 + Math.random() * 8, life: 1, d: .0035 + Math.random() * .004, c: COLORS[i % COLORS.length] });
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
  function celebrate(cx, cy) {
    if (reduced) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    fx.width = innerWidth * dpr; fx.height = innerHeight * dpr;
    burst(cx, cy, 120, 13);
    setTimeout(() => burst(innerWidth * .2, cy - 60, 70, 10), 200);
    setTimeout(() => burst(innerWidth * .8, cy - 30, 70, 10), 380);
    setTimeout(() => burst(innerWidth * .35, cy - 140, 50, 8), 620);
    setTimeout(() => burst(innerWidth * .65, cy - 120, 50, 8), 820);
    confetti(160);
    cancelAnimationFrame(fraf); fxLoop();
  }

  // ---------- scene ----------
  let floaters = [], bokeh = [], twist = 0, last = 0, anim = null, shown = null, flick = { no: '0000', next: 0 };
  function seed() {
    floaters = POOL.slice(0, 30).map(no => ({ no, x: Math.random(), y: Math.random() * .9, s: .6 + Math.random() * .9, v: (.2 + Math.random() * .6) * (Math.random() < .5 ? -1 : 1) }));
    const hues = ['255,176,80', '255,214,150', '251,0,32', '120,200,255', '255,255,255', '255,120,60'];
    bokeh = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), r: .02 + Math.random() * .06, c: hues[Math.floor(Math.random() * hues.length)], a: .12 + Math.random() * .25, v: (Math.random() - .5) * .3 }));
  }

  // Iris with curved blades. Each blade covers everything outside one offset disc (its curved cutting edge),
  // clipped to a blade-shaped region whose sides follow a spiral. The opening is the intersection of the discs,
  // which gives the rounded polygon of a real lens; the spiral sides give the overlapping-blade look.
  function iris(ctx, W, H, cx, cy, r, rot) {
    const N = 9, curve = .55, spiral = .62, far = Math.hypot(W, H) * 1.1, light = -2.3;
    const pt = (a0, rho) => { const a = a0 + spiral * Math.log(rho / r); return [cx + Math.cos(a) * rho, cy + Math.sin(a) * rho]; };
    const radii = []; for (let s = 0; s <= 14; s++) radii.push(r * .92 * Math.pow(far / (r * .92), s / 14));
    function bladePath(a0, a1) {
      ctx.beginPath();
      radii.forEach((rho, k) => { const [x, y] = pt(a0, rho); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      const e0 = a0 + spiral * Math.log(far / r), e1 = a1 + spiral * Math.log(far / r);
      ctx.arc(cx, cy, far, e0, e1);
      for (let k = radii.length - 1; k >= 0; k--) { const [x, y] = pt(a1, radii[k]); ctx.lineTo(x, y); }
      ctx.arc(cx, cy, r * .92, a1 + spiral * Math.log(.92), a0 + spiral * Math.log(.92), true);
      ctx.closePath();
    }
    function edgePath(a0) { ctx.beginPath(); radii.forEach((rho, k) => { const [x, y] = pt(a0, rho); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); }
    function outsideDisc(ox, oy, rad) { ctx.beginPath(); ctx.rect(-far, -far, W + far * 2, H + far * 2); ctx.arc(ox, oy, rad, 0, Math.PI * 2, true); }
    for (let i = 0; i < N; i++) {
      const a = rot + i * Math.PI * 2 / N;
      const ox = cx - Math.cos(a) * r * curve, oy = cy - Math.sin(a) * r * curve, rad = r * (1 + curve);
      const a0 = a - Math.PI / N * 1.04, a1 = a + Math.PI / N + .5;
      ctx.save();
      outsideDisc(ox, oy, rad); ctx.clip('evenodd');
      // soft shadow this blade throws onto the blade beneath, along its leading edge
      [[22, .12], [13, .18], [6, .28]].forEach(([lw, al]) => { ctx.strokeStyle = `rgba(0,0,0,${al})`; ctx.lineWidth = lw; edgePath(a0); ctx.stroke(); });
      // blade body
      bladePath(a0, a1); ctx.save(); ctx.clip();
      const lit = .5 + .5 * Math.cos(a - light);
      const tone = v => Math.round(16 + v * 30);
      const inner = `rgb(${tone(lit)},${tone(lit)},${tone(lit) + 3})`, outer = `rgb(${tone(lit * .3)},${tone(lit * .3)},${tone(lit * .3) + 2})`;
      const g = ctx.createRadialGradient(cx, cy, r, cx, cy, Math.max(r * 3, far * .55));
      g.addColorStop(0, inner); g.addColorStop(1, outer);
      ctx.fillStyle = g; ctx.fillRect(-far, -far, W + far * 2, H + far * 2);
      // satin sheen
      const sx = cx + Math.cos(a + .5) * r * 1.5, sy = cy + Math.sin(a + .5) * r * 1.5;
      const sh = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 1.3);
      sh.addColorStop(0, `rgba(255,255,255,${.04 + lit * .06})`); sh.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sh; ctx.fillRect(-far, -far, W + far * 2, H + far * 2);
      // bevel on the curved cutting edge, only where it actually borders the opening (between the two corners)
      ctx.save();
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a - Math.PI / N) * far, cy + Math.sin(a - Math.PI / N) * far);
      ctx.lineTo(cx + Math.cos(a) * far * 1.5, cy + Math.sin(a) * far * 1.5);
      ctx.lineTo(cx + Math.cos(a + Math.PI / N) * far, cy + Math.sin(a + Math.PI / N) * far);
      ctx.closePath(); ctx.clip();
      ctx.strokeStyle = `rgba(210,210,215,${.18 + lit * .35})`; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(ox, oy, rad + .8, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      ctx.restore();
      // highlight on the leading spiral edge
      ctx.strokeStyle = `rgba(255,255,255,${.06 + lit * .14})`; ctx.lineWidth = 1.2; edgePath(a0); ctx.stroke();
      ctx.restore();
    }
    // barrel vignette
    const vg = ctx.createRadialGradient(cx, cy, Math.min(W, H) * .45, cx, cy, Math.hypot(W, H) * .6);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.75)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  // Safari ignores ctx.filter silently, so test it once and fall back to a shadow blur (works everywhere)
  const FILTER_OK = (() => {
    try {
      const t = document.createElement('canvas'); t.width = t.height = 9;
      const x = t.getContext('2d'); x.filter = 'blur(2px)'; x.fillStyle = '#fff'; x.fillRect(4, 4, 1, 1);
      return x.getImageData(1, 4, 1, 1).data[3] > 0;
    } catch (e) { return false; }
  })();
  if (/[?&]nofilter\b/.test(location.search)) window.__forceNoFilter = true;
  // text with gaussian blur sigma (in canvas pixels): filter where supported, otherwise the text is drawn
  // off to the left and only its blurred shadow is shifted back into place
  function blurText(x, txt, tx, ty, sigma, dpr) {
    if (sigma <= .25) { x.fillText(txt, tx, ty); return; }
    if (FILTER_OK && !window.__forceNoFilter) {
      x.filter = `blur(${sigma.toFixed(1)}px)`; x.fillText(txt, tx, ty); x.filter = 'none'; return;
    }
    const off = 100000;
    x.save();
    x.shadowColor = x.fillStyle; x.shadowBlur = sigma * 2; x.shadowOffsetX = off * dpr; x.shadowOffsetY = 0;
    x.fillText(txt, tx - off, ty);
    x.restore();
  }

  // pre-blurred number sprites, so the background costs one drawImage per number per frame
  const sprites = new Map();
  function sprite(no, px) {
    const key = no + '@' + px;
    let c = sprites.get(key);
    if (!c) {
      if (sprites.size > 400) sprites.clear();
      const pad = 16; c = document.createElement('canvas');
      const x = c.getContext('2d'); x.font = `${px}px ${FONT}`;
      c.width = Math.ceil(x.measureText(no).width) + pad * 2; c.height = Math.ceil(px * 1.3) + pad * 2;
      const y = c.getContext('2d'); y.font = `${px}px ${FONT}`; y.textAlign = 'center'; y.textBaseline = 'middle';
      y.fillStyle = '#fff'; blurText(y, no, c.width / 2, c.height / 2, 6, 1);
      sprites.set(key, c);
    }
    return c;
  }

  function frame(t) {
    const r0 = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    const W = r0.width, H = r0.height;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dt = Math.min(40, t - (last || t)) / 16.7; last = t;
    const cx = W / 2, cy = H * .47, m = Math.min(W, H);
    const rOpen = Math.hypot(W, H) * .75;
    const radii = [rOpen, m * .48, m * .40, m * .34, m * .29, m * .25];   // f/1.4 … f/8

    // --- timeline state ---
    let r = rOpen, speed = 1, blur = 18, numAlpha = 0, centerNo = null, fstop = null, afColor = null, rotExtra = 0;
    const w = anim ? anim.w : shown;
    if (anim) {
      const e = t - anim.t0;
      if (e < T.rush) {
        speed = 1 + easeOut(e / T.rush) * 7;
      } else if (e < T.rush + T.stops) {
        const p = (e - T.rush) / T.stops;
        speed = 8 - p * 5;
        // stepped closing: each f-stop clicks in fast, then holds
        const seg = p * (FSTOPS.length - 1), k = Math.floor(seg), f = seg - k;
        const click = easeOut(clamp(f / .28, 0, 1));
        const a = radii[Math.min(k, radii.length - 1)], b = radii[Math.min(k + 1, radii.length - 1)];
        r = a + (b - a) * click;
        fstop = FSTOPS[Math.min(k + (click > .5 ? 1 : 0), FSTOPS.length - 1)];
        rotExtra = (k + click) * .09;
        // flicker: random numbers, slowing down, final one is the winner (still blurred)
        numAlpha = clamp(p * 3, 0, 1);
        if (t >= flick.next) {
          const interval = 60 + Math.pow(p, 2.2) * 420;
          flick.no = p > .93 ? w.no : POOL[Math.floor(Math.random() * POOL.length)];
          flick.next = t + interval;
        }
        centerNo = flick.no; blur = 16;
      } else if (e < T.rush + T.stops + T.hunt) {
        const p = (e - T.rush - T.stops) / T.hunt;
        r = radii[radii.length - 1]; fstop = FSTOPS[FSTOPS.length - 1]; rotExtra = (FSTOPS.length - 1) * .09;
        speed = 3 - p * 2.4;
        // focus hunting: sharp-ish, overshoot, back, settle
        const keys = [20, 12, 17, 9, 14, 6, 10, 0];
        const s = p * (keys.length - 1), k = Math.floor(s), f = ease(s - k);
        blur = keys[k] + (keys[Math.min(k + 1, keys.length - 1)] - keys[k]) * f;
        centerNo = w.no; numAlpha = 1;
        afColor = (Math.floor(e / 180) % 2) ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.35)';
      } else {
        r = radii[radii.length - 1]; fstop = FSTOPS[FSTOPS.length - 1]; rotExtra = (FSTOPS.length - 1) * .09;
        speed = .6; blur = 0; centerNo = w.no; numAlpha = 1; afColor = '#fb0020'; fstop = null;
        if (!anim.fired && e >= TOTAL) { anim.fired = true; anim.cb(cx, cy); }
      }
    } else if (shown) {
      r = radii[radii.length - 1]; fstop = FSTOPS[FSTOPS.length - 1]; rotExtra = (FSTOPS.length - 1) * .09;
      speed = .6; blur = 0; centerNo = shown.no; numAlpha = 1; afColor = '#fb0020'; fstop = null;
    }
    twist += .0016 * speed * dt;

    // --- background: night bokeh + blurred numbers ---
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * .75);
    g.addColorStop(0, '#11263a'); g.addColorStop(1, '#03060a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const b of bokeh) {
      b.x = (b.x + b.v * .0012 * speed * dt + 1) % 1;
      const x = b.x * W, y = b.y * H, rr = b.r * Math.max(W, H) * .7;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, rr);
      rg.addColorStop(0, `rgba(${b.c},${b.a * .5})`); rg.addColorStop(.82, `rgba(${b.c},${b.a})`); rg.addColorStop(1, `rgba(${b.c},0)`);
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill();
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const f of floaters) {
      f.x = (f.x + f.v * .0009 * speed * dt + 1) % 1;
      const spr = sprite(f.no, Math.round(m * .09 * f.s));
      ctx.globalAlpha = .34 * (1 - numAlpha * .85) + .04;
      ctx.drawImage(spr, f.x * W - spr.width / 2, f.y * H - spr.height / 2);
    }
    ctx.globalAlpha = 1;

    // --- centre number ---
    if (centerNo && numAlpha > 0) {
      ctx.globalAlpha = numAlpha;
      ctx.fillStyle = '#ffffff'; ctx.font = `${Math.round(m * .2)}px ${FONT}`;
      blurText(ctx, centerNo, cx, cy + m * .01, blur, dpr);
      ctx.globalAlpha = 1;
    }

    // --- iris ---
    if (r < rOpen * .99) iris(ctx, W, H, cx, cy, r, twist + rotExtra);

    // --- f-stop readout under the opening ---
    if (fstop) {
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = `${Math.round(m * .034)}px ${FONT}`;
      ctx.fillText('f/' + fstop, cx, cy + r + m * .05);
    }

    // --- AF brackets ---
    if (afColor) {
      const bw = m * .26, bh = m * .15, L = m * .045;
      ctx.strokeStyle = afColor; ctx.lineWidth = Math.max(2, m * .005);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
        const x = cx + sx * bw, y = cy + sy * bh;
        ctx.beginPath(); ctx.moveTo(x - sx * L, y); ctx.lineTo(x, y); ctx.lineTo(x, y - sy * L); ctx.stroke();
      });
    }
    requestAnimationFrame(frame);
  }

  // ---------- caption ----------
  function showCaption(w, i) {
    capEl.querySelector('.tag').textContent = `WINNER ${i + 1} · TICKET ${w.no}`;
    capEl.querySelector('.who').textContent = w.name;
    capEl.querySelector('.where').textContent = `Scandinavian Photo ${w.store}`;
    capEl.classList.add('show');
  }

  // ---------- controls ----------
  function reset() { anim = null; shown = null; idx = 0; busy = false; capEl.classList.remove('show'); idleEl.hidden = false; renderBand(); }
  drawBtn.addEventListener('click', () => {
    if (busy || idx >= 4) return;
    busy = true; idleEl.hidden = true; capEl.classList.remove('show'); shown = null; renderBand();
    const i = idx, w = WINNERS[i];
    const done = (cx, cy) => {
      shown = w; anim = null; idx = i + 1; busy = false;
      showCaption(w, i); renderBand(i);
      const rect = cv.getBoundingClientRect();
      celebrate(rect.left + (cx ?? rect.width / 2), rect.top + (cy ?? rect.height / 2));
    };
    anim = { w, t0: performance.now() - (reduced ? TOTAL : 0), fired: false, cb: done };
    // safety net: finish even if frames were dropped
    setTimeout(() => { if (anim && anim.w === w && !anim.fired) { anim.fired = true; done(); } }, (reduced ? 0 : TOTAL) + 400);
  });
  resetBtn.addEventListener('click', () => { if (!busy) reset(); });

  if (document.documentElement.requestFullscreen) {
    fsBtn.addEventListener('click', () => {
      const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
      if (p && p.catch) p.catch(() => { fsBtn.hidden = true; });
    });
    document.addEventListener('fullscreenchange', () => { fsBtn.textContent = document.fullscreenElement ? 'Avsluta helskärm' : 'Helskärm'; });
  } else fsBtn.hidden = true;

  seed(); reset();
  const boot = () => requestAnimationFrame(frame);
  (document.fonts && document.fonts.load)
    ? Promise.all([document.fonts.load('40px "Fjalla One"'), document.fonts.load('16px "Noto Sans"')]).then(boot, boot)
    : boot();
})();
