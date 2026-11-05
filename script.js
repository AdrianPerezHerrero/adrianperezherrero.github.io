'use strict';

const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

const toggle = document.getElementById('menu-toggle');
const nav = document.getElementById('primary-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Scroll reveal.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');
if (!reducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

// Animated signal field.
const canvas = document.getElementById('signal-field');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let scrollY = 0;
  let rafId = null;

  const lines = [
    { amp: 28, freq: 0.012, speed: 0.9, offset: 0.0, y: 0.22, color: 'rgba(120, 210, 193, 0.32)', width: 2.0 },
    { amp: 42, freq: 0.009, speed: 0.55, offset: 1.5, y: 0.34, color: 'rgba(255, 179, 106, 0.18)', width: 1.8 },
    { amp: 54, freq: 0.0065, speed: 0.34, offset: 2.3, y: 0.53, color: 'rgba(91, 169, 184, 0.18)', width: 1.6 },
    { amp: 36, freq: 0.0105, speed: 0.62, offset: 4.6, y: 0.68, color: 'rgba(126, 208, 193, 0.14)', width: 1.4 },
    { amp: 26, freq: 0.014, speed: 1.1, offset: 6.2, y: 0.81, color: 'rgba(255, 179, 106, 0.14)', width: 1.2 }
  ];

  const particles = Array.from({ length: 18 }, (_, i) => ({
    x: (i / 18) + Math.random() * 0.05,
    y: Math.random(),
    r: 1 + Math.random() * 2.2,
    drift: 0.05 + Math.random() * 0.1,
    phase: Math.random() * Math.PI * 2,
    alpha: 0.08 + Math.random() * 0.12
  }));

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawLine(line, t) {
    ctx.beginPath();
    const baseY = height * line.y + Math.sin(t * 0.00015 + line.offset) * 12 - Math.sin(scrollY * 0.00095 + line.offset) * height * 0.10;
    for (let x = -20; x <= width + 20; x += 4) {
      const wave = Math.sin(x * line.freq + t * 0.0011 * line.speed + line.offset + scrollY * (0.0005 + line.y * 0.0003)) * line.amp;
      const mod = Math.cos(x * line.freq * 0.45 - t * 0.00045 - line.offset) * line.amp * 0.34;
      const y = baseY + wave + mod;
      if (x === -20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = line.color;
    ctx.lineWidth = line.width;
    ctx.stroke();
  }

  function drawParticles(t) {
    particles.forEach((p) => {
      const x = ((p.x * width) + Math.sin(t * 0.00015 + p.phase) * 18 + scrollY * p.drift * 0.3) % (width + 40);
      const y = (p.y * height + Math.cos(t * 0.0002 + p.phase) * 22 - scrollY * p.drift) % (height + 60);
      ctx.beginPath();
      ctx.arc((x + width + 40) % (width + 40), (y + height + 60) % (height + 60), p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(205, 232, 241, ${p.alpha})`;
      ctx.fill();
    });
  }

  function render(t) {
    ctx.clearRect(0, 0, width, height);
    lines.forEach((line) => drawLine(line, t));
    drawParticles(t);
    if (!reducedMotion) rafId = requestAnimationFrame(render);
  }

  function updateScroll() {
    scrollY = window.scrollY || window.pageYOffset || 0;
  }

  resize();
  updateScroll();
  render(0);

  window.addEventListener('resize', () => {
    resize();
    if (reducedMotion) render(performance.now());
  });
  window.addEventListener('scroll', () => {
    updateScroll();
    if (reducedMotion) render(performance.now());
  }, { passive: true });

  if (!reducedMotion) {
    rafId = requestAnimationFrame(render);
  }

  window.addEventListener('beforeunload', () => {
    if (rafId) cancelAnimationFrame(rafId);
  });
}