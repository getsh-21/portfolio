/* ═══════════════════════════════════════════════════════════════
   GOITOM GEBRESLASSIE PORTFOLIO — main.js
═══════════════════════════════════════════════════════════════ */

/* ── THEME TOGGLE ─────────────────────────────────────────────── */
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
const html        = document.documentElement;

function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});

/* ── NAVBAR SCROLL ───────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

/* ── HAMBURGER ───────────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
  });
});

/* ── TYPEWRITER ──────────────────────────────────────────────── */
const titles = [
  'Founder of Gemed Solutions',
  'Full Stack Developer',
  'AI & Machine Learning Enthusiast',
  'Project Manager',
  'MIT Student',
];
const typedEl = document.getElementById('typedTitle');
let tIdx = 0, cIdx = 0, deleting = false;

function typeLoop() {
  const current = titles[tIdx];
  if (!deleting) {
    cIdx++;
    typedEl.innerHTML = current.slice(0, cIdx) + '<span class="cursor"></span>';
    if (cIdx === current.length) {
      deleting = true;
      setTimeout(typeLoop, 1800);
      return;
    }
    setTimeout(typeLoop, 65);
  } else {
    cIdx--;
    typedEl.innerHTML = current.slice(0, cIdx) + '<span class="cursor"></span>';
    if (cIdx === 0) {
      deleting = false;
      tIdx = (tIdx + 1) % titles.length;
      setTimeout(typeLoop, 400);
      return;
    }
    setTimeout(typeLoop, 35);
  }
}
typeLoop();

/* ── INTERSECTION OBSERVER (AOS) ────────────────────────────── */
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const delay = e.target.getAttribute('data-aos-delay') || 0;
        setTimeout(() => e.target.classList.add('aos-animate'), Number(delay));
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));

/* ── ACTIVE NAV HIGHLIGHT ─────────────────────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navItems  = document.querySelectorAll('.nav-links a');

function highlightNav() {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
  });
  navItems.forEach(a => {
    a.style.color = a.getAttribute('href') === '#' + current
      ? 'var(--accent)' : '';
  });
}
window.addEventListener('scroll', highlightNav);

/* ── SMOOTH SCROLL (with offset for fixed nav) ─────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});