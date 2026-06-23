/* ============================================================
   CAB DRIVER PROFILE — script.js
   Features: scroll reveal, stat counters, progress bar,
             copy UPI, tip amount buttons, smooth scroll
   ============================================================ */

/* ---------- SCROLL REVEAL ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger delay for multiple elements appearing together
        const siblings = Array.from(
          entry.target.parentElement?.querySelectorAll('.reveal:not(.visible)') || []
        );
        const idx = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${Math.min(idx * 60, 200)}ms`;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ---------- ANIMATED STAT COUNTERS ---------- */
function animateCounter(el) {
  const target   = parseFloat(el.dataset.target);
  const decimals = parseInt(el.dataset.decimals, 10) || 0;
  const duration = 1600;
  const start    = performance.now();

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease     = 1 - Math.pow(1 - progress, 3);
    const value    = target * ease;

    if (decimals > 0) {
      el.textContent = value.toFixed(decimals);
    } else {
      // Show K for thousands
      const rounded = Math.round(value);
      el.textContent = rounded >= 1000 ? Math.floor(rounded / 100) / 10 + 'K' : rounded;
    }

    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// Start counters when stat cards come into view
const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.stat-val[data-target]').forEach(animateCounter);
        statObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

const statsSection = document.querySelector('.stats-grid');
if (statsSection) statObserver.observe(statsSection);

/* ---------- SCROLL PROGRESS BAR ---------- */
const progressBar = document.getElementById('progressBar');

function updateProgress() {
  const scrollTop  = window.scrollY;
  const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
  const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (progressBar) progressBar.style.width = pct + '%';
}

window.addEventListener('scroll', updateProgress, { passive: true });

/* ---------- SMOOTH SCROLL FOR ANCHOR LINKS ---------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const id = anchor.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ---------- TOAST NOTIFICATION ---------- */
let toastTimer = null;

function showToast(msg) {
  const toast   = document.getElementById('toast');
  const msgEl   = document.getElementById('toastMsg');
  if (!toast || !msgEl) return;
  msgEl.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ---------- COPY UPI ID ---------- */
// Called from onclick in HTML
window.copyUPI = function () {
  const upiEl = document.getElementById('upiId');
  if (!upiEl) return;
  const upi = upiEl.textContent.trim();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(upi)
      .then(() => showToast('UPI ID copied! 🎉'))
      .catch(() => fallbackCopy(upi));
  } else {
    fallbackCopy(upi);
  }
};

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('UPI ID copied! 🎉');
  } catch {
    showToast('Copy failed — please copy manually');
  }
  document.body.removeChild(ta);
}

/* ---------- TIP AMOUNT BUTTONS ---------- */
document.querySelectorAll('.tip-amount').forEach(btn => {
  btn.addEventListener('click', () => {
    const upi    = btn.dataset.upi;
    const name   = btn.dataset.name;
    const amount = btn.dataset.amount;
    if (!upi || !amount) return;

    const upiUrl = `upi://pay?pa=${upi}&pn=${name}&am=${amount}&cu=INR`;
    showToast(`Opening UPI for ₹${amount} tip…`);

    // Try deep link; fallback to intent: for Android
    const a = document.createElement('a');
    a.href = upiUrl;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
});

/* ---------- FLOATING BUTTONS HIDE ON SCROLL UP (mobile) ---------- */
let lastScroll = 0;
const fabs = document.querySelectorAll('.fab');

window.addEventListener('scroll', () => {
  const current = window.scrollY;
  if (current > lastScroll && current > 200) {
    // Scrolling down — hide fabs briefly
    fabs.forEach(f => f.style.opacity = '0.4');
  } else {
    fabs.forEach(f => f.style.opacity = '1');
  }
  lastScroll = current;
}, { passive: true });