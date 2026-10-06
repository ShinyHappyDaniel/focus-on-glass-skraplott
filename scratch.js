(() => {
  const ticket = document.getElementById('ticket');
  const cv = document.getElementById('scratch');
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const numEl = document.getElementById('number');
  const status = document.getElementById('status');
  const meter = document.getElementById('meter');
  const perf = document.querySelector('.perf');
  const placeHoles = () => ticket.style.setProperty('--perf-y', (perf.offsetTop + 1) + 'px');
  placeHoles();
  addEventListener('resize', placeHoles);
  if (document.fonts) document.fonts.ready.then(placeHoles);
  let done = false, drawing = false, last = null, moves = 0;

  for (let i = 0; i < 25; i++) {
    const b = document.createElement('i');
    if (i < 11) b.className = 'on';
    if (i === 11) b.className = 'new';
    meter.appendChild(b);
  }

  function randomNumber() {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return String(a[0] % 10000).padStart(4, '0');
  }

  function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

  function paintCover() {
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    const W = cv.width, H = cv.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0f2233'); g.addColorStop(1, '#05090e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const rand = rng(Math.floor(Math.random() * 1e9) + 1);
    const hues = ['255,176,80', '255,214,150', '251,0,32', '120,200,255', '255,255,255', '255,120,60'];
    for (let i = 0; i < 46; i++) {
      const x = rand() * W, y = H * (0.25 + rand() * 0.8);
      const rad = (8 + rand() * 34) * dpr;
      const c = hues[Math.floor(rand() * hues.length)];
      const a = 0.18 + rand() * 0.35;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, `rgba(${c},${a * 0.55})`);
      rg.addColorStop(0.82, `rgba(${c},${a})`);
      rg.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    }
    const img = ctx.getImageData(0, 0, W, H), d = img.data;
    for (let p = 0; p < d.length; p += 4) { const n = (rand() - 0.5) * 18; d[p] += n; d[p+1] += n; d[p+2] += n; }
    ctx.putImageData(img, 0, 0);

    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(H * 0.15)}px "Fjalla One", "Arial Narrow", sans-serif`;
    ctx.fillText('SCRATCH HERE', W / 2, H / 2 - H * 0.02);
    ctx.font = `${Math.round(H * 0.065)}px "Noto Sans", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.fillText('Your four-digit lottery number is underneath', W / 2, H / 2 + H * 0.12);
  }

  function scratchAt(x, y) {
    const r = cv.getBoundingClientRect();
    const sx = cv.width / r.width;
    const px = (x - r.left) * sx, py = (y - r.top) * sx;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = 34 * sx;
    ctx.beginPath();
    if (last) ctx.moveTo(last[0], last[1]); else ctx.moveTo(px, py);
    ctx.lineTo(px + 0.01, py);
    ctx.stroke();
    last = [px, py];
    if (++moves % 12 === 0) checkCleared();
  }

  function checkCleared() {
    const step = 8;
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let clear = 0, total = 0;
    for (let y = 0; y < cv.height; y += step) for (let x = 0; x < cv.width; x += step) {
      total++; if (d[(y * cv.width + x) * 4 + 3] < 40) clear++;
    }
    if (clear / total > 0.5) finish();
  }

  function finish() {
    if (done) return;
    done = true;
    cv.classList.add('gone');
    ticket.classList.add('done');
    status.innerHTML = `Ticket <strong>${numEl.textContent}</strong> is in the draw on 5 March 2027.`;
  }

  cv.addEventListener('pointerdown', e => { if (done) return; drawing = true; last = null; cv.setPointerCapture(e.pointerId); scratchAt(e.clientX, e.clientY); });
  cv.addEventListener('pointermove', e => { if (drawing && !done) scratchAt(e.clientX, e.clientY); });
  const stop = () => { drawing = false; last = null; if (!done) checkCleared(); };
  cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop);
  cv.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finish(); } });

  function newTicket() {
    done = false; moves = 0; last = null;
    // cover the field instantly (no fade) before the new number is set
    cv.classList.add('instant');
    cv.classList.remove('gone'); ticket.classList.remove('done');
    paintCover();
    void cv.offsetWidth;
    cv.classList.remove('instant');
    numEl.textContent = randomNumber();
    status.textContent = 'Drag across the field with your finger or mouse.';
    appear();
  }

  // ---- entrance effect: pop + fireworks + confetti ----
  const fx = document.getElementById('fx');
  const fctx = fx.getContext('2d');
  let parts = [], raf = 0;
  const COLORS = ['#fb0020', '#ffffff', '#ffcf5a', '#7cc7ff', '#ff8a3d'];

  function burst(x, y, n, speed) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.35 + Math.random() * 0.65);
      parts.push({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, decay: 0.012 + Math.random() * 0.014,
        r: 1.6 + Math.random() * 2.2, c: COLORS[Math.floor(Math.random() * COLORS.length)] });
    }
  }
  function confetti(n) {
    const W = innerWidth;
    for (let i = 0; i < n; i++) {
      parts.push({ k: 'conf', x: Math.random() * W, y: -20 - Math.random() * 200, vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 3,
        a: Math.random() * 6, va: (Math.random() - .5) * .3, s: 6 + Math.random() * 7, life: 1, decay: 0.004 + Math.random() * 0.004,
        c: COLORS[Math.floor(Math.random() * COLORS.length)] });
    }
  }
  function loop() {
    fctx.clearRect(0, 0, fx.width, fx.height);
    const d = fx.width / innerWidth;
    fctx.save(); fctx.scale(d, d);
    parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 40);
    for (const p of parts) {
      if (p.k === 'spark') {
        p.vx *= 0.965; p.vy = p.vy * 0.965 + 0.09; p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        fctx.globalAlpha = Math.max(p.life, 0);
        fctx.fillStyle = p.c; fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); fctx.fill();
      } else {
        p.vx += Math.sin(p.a) * 0.03; p.x += p.vx; p.y += p.vy; p.a += p.va; p.life -= p.decay;
        fctx.globalAlpha = Math.min(1, p.life * 2);
        fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.a); fctx.scale(1, Math.cos(p.a * 2));
        fctx.fillStyle = p.c; fctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); fctx.restore();
      }
    }
    fctx.restore(); fctx.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(loop); else fctx.clearRect(0, 0, fx.width, fx.height);
  }
  function appear() {
    ticket.classList.remove('enter'); void ticket.offsetWidth; ticket.classList.add('enter');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    fx.width = innerWidth * dpr; fx.height = innerHeight * dpr;
    const r = ticket.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = Math.min(r.top + r.height * 0.35, innerHeight * 0.45);
    parts = [];
    burst(cx, cy, 90, 11);
    setTimeout(() => burst(cx - r.width * 0.45, cy - 60, 55, 8), 180);
    setTimeout(() => burst(cx + r.width * 0.45, cy - 30, 55, 8), 330);
    confetti(110);
    cancelAnimationFrame(raf); loop();
  }
  document.getElementById('again').addEventListener('click', newTicket);

  let rt; window.addEventListener('resize', () => { if (done) return; clearTimeout(rt); rt = setTimeout(paintCover, 150); });

  const start = () => newTicket();
  (document.fonts && document.fonts.load)
    ? Promise.all([document.fonts.load('40px "Fjalla One"'), document.fonts.load('16px "Noto Sans"')]).then(start, start)
    : start();
})();
