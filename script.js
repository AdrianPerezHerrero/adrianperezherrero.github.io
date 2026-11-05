'use strict';

// Decorative, deliberately subdued signals. Nothing is measured or inferred here.
const canvas = document.getElementById('signal-background');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (canvas?.getContext) {
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, scroll = window.scrollY, lastFrame = -Infinity, frame = 0;
  const lines = [
    { y: 0.16, a: 24, k: 0.008, speed: 0.22, phase: 0.0, color: 'rgba(111, 163, 199, .18)' },
    { y: 0.39, a: 34, k: 0.006, speed: 0.16, phase: 2.1, color: 'rgba(232, 158, 103, .17)' },
    { y: 0.62, a: 31, k: 0.0095, speed: 0.20, phase: 4.5, color: 'rgba(101, 175, 206, .13)' },
    { y: 0.81, a: 22, k: 0.010, speed: 0.30, phase: 5.4, color: 'rgba(231, 164, 114, .10)' }
  ];
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(0);
  }
  function draw(t) {
    ctx.clearRect(0, 0, width, height);
    for (const line of lines) {
      ctx.beginPath();
      const scrollPhase = scroll * 0.00085;
      const verticalDrift = 20 * Math.sin(scroll * 0.0012 + line.phase);
      for (let x = 0; x <= width + 6; x += 6) {
        const wave = Math.sin(x * line.k + scrollPhase + line.phase + t * line.speed * .0002) * line.a;
        const detail = Math.sin(x * line.k * 1.7 - line.phase - t * .00008) * line.a * 0.21;
        const y = line.y * height + verticalDrift + wave + detail;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 1.25;
      ctx.stroke();
    }
  }
  function animate(t) {
    if (t - lastFrame > 40) { draw(t); lastFrame = t; }
    frame = requestAnimationFrame(animate);
  }
  function resume() {
    cancelAnimationFrame(frame);
    if (document.visibilityState === 'visible' && !prefersReducedMotion.matches) frame = requestAnimationFrame(animate);
    else draw(0);
  }
  window.addEventListener('resize', resize, { passive:true });
  window.addEventListener('scroll', () => { scroll = window.scrollY; if (prefersReducedMotion.matches) draw(0); }, { passive:true });
  document.addEventListener('visibilitychange', resume);
  prefersReducedMotion.addEventListener('change', resume);
  resize();
  resume();
}