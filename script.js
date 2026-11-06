'use strict';

// Decorative, continuously moving background signals. Not research data.
const canvas = document.getElementById('signal-background');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (canvas?.getContext) {
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let scroll = window.scrollY || 0;
  let frame = 0;
  let lastFrame = -Infinity;

  // Independent time-based phase, so waves move even while the page is still.
  const lines = [
    { y: 0.16, a: 22, k: 0.008, speed: 0.22, phase: 0.0, color: 'rgba(111, 163, 199, .19)' },
    { y: 0.39, a: 31, k: 0.006, speed: 0.17, phase: 2.1, color: 'rgba(232, 158, 103, .17)' },
    { y: 0.62, a: 29, k: 0.0095, speed: 0.19, phase: 4.5, color: 'rgba(101, 175, 206, .14)' },
    { y: 0.81, a: 21, k: 0.010, speed: 0.25, phase: 5.4, color: 'rgba(231, 164, 114, .11)' }
  ];

  // Sparse, low-opacity points move slowly near each signal trace.
  const particles = Array.from({ length: 32 }, (_, i) => ({
    line: i % lines.length,
    at: (i + Math.random()) / 32,
    speed: 0.001 + Math.random() * 0.0025,
    radius: 0.65 + Math.random() * 1.2,
    orbit: 4 + Math.random() * 12,
    drift: 0.25 + Math.random() * 0.45,
    phase: Math.random() * Math.PI * 2,
    opacity: 0.06 + Math.random() * 0.095
  }));

  function curveY(line, x, t) {
    const scrollPhase = scroll * 0.00085;
    const wavePhase = t * line.speed * 0.001;
    const drift = 10 * Math.sin(t * 0.00012 + line.phase)
      + 9 * Math.sin(scroll * 0.0012 + line.phase);
    const primary = Math.sin(x * line.k + line.phase + scrollPhase + wavePhase) * line.a;
    const secondary = Math.sin(x * line.k * 1.7 - line.phase - t * 0.00010) * line.a * 0.21;
    return line.y * height + drift + primary + secondary;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  }

  function draw(t) {
    ctx.clearRect(0, 0, width, height);
    for (const line of lines) {
      ctx.beginPath();
      for (let x = 0; x <= width + 6; x += 6) {
        const y = curveY(line, x, t);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    for (const point of particles) {
      const line = lines[point.line];
      const x = ((point.at + t * point.speed * 0.000001) % 1) * (width + 30) - 15;
      const orbitPhase = t * point.drift * 0.0008 + point.phase;
      const px = x + Math.cos(orbitPhase) * point.orbit * 0.5;
      const py = curveY(line, x, t) + Math.sin(orbitPhase) * point.orbit;
      const alpha = point.opacity * (0.82 + 0.18 * Math.sin(orbitPhase + point.phase));
      ctx.beginPath();
      ctx.arc(px, py, point.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(201, 225, 233, ' + alpha.toFixed(3) + ')';
      ctx.fill();
    }
  }

  function animate(t) {
    // ~30fps is enough for these slow signals and saves GPU work.
    if (t - lastFrame >= 32) {
      draw(t);
      lastFrame = t;
    }
    frame = requestAnimationFrame(animate);
  }

  function resume() {
    cancelAnimationFrame(frame);
    if (document.visibilityState === 'visible' && !prefersReducedMotion.matches) {
      lastFrame = -Infinity;
      frame = requestAnimationFrame(animate);
    } else {
      draw(performance.now());
    }
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', () => {
    scroll = window.scrollY || 0;
    if (prefersReducedMotion.matches) draw(performance.now());
  }, { passive: true });
  document.addEventListener('visibilitychange', resume);
  prefersReducedMotion.addEventListener('change', resume);
  resize();
  resume();
}

// Animate sections on entering the viewport. The text is always visible.
if (!prefersReducedMotion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.animate([
        { opacity: .70, transform: 'translateY(16px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 740, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'none' });
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -7% 0px', threshold: .08 });
  document.querySelectorAll('main section.reveal-block').forEach(el => observer.observe(el));
}
