/* ============================================================

DIbu

   CAB DRIVER PROFILE — script.js
   Features: scroll reveal, arc counters, star ratings,
             copy UPI, tip amount buttons, working UPI pay,
             smooth scroll, progress bar
   ============================================================ */

/* ---------- SCROLL REVEAL ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ---------- ANIMATE NUMBER COUNTER ---------- */
function animateCounter(el) {
  const target   = parseFloat(el.dataset.target);
  const decimals = parseInt(el.dataset.decimals, 10) || 0;
  const duration = 1600;
  const start    = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    const value    = target * ease;
    if (decimals > 0) {
      el.textContent = value.toFixed(decimals);
    } else {
      const rounded = Math.round(value);
      el.textContent = rounded >= 1000 ? (Math.floor(rounded / 100) / 10) + 'K' : rounded;
    }
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------- ARC RING ANIMATION ---------- */
// SVG circle circumference at r=26: 2 * PI * 26 ≈ 163.36
const CIRCUMFERENCE = 2 * Math.PI * 26;

function animateArc(circle) {
  const targetOffset = parseFloat(circle.dataset.offset);
  // stroke-dashoffset starts at 163 (empty), animate to targetOffset
  setTimeout(() => {
    circle.style.strokeDashoffset = targetOffset;
  }, 200);
}

/* ---------- RENDER STARS ---------- */
function renderStars(container, rating) {
  const full    = Math.floor(rating);
  const hasHalf = (rating - full) >= 0.4;
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= full) {
      html += '<i class="fa-solid fa-star"></i>';
    } else if (i === full + 1 && hasHalf) {
      html += '<i class="fa-solid fa-star-half-stroke"></i>';
    } else {
      html += '<i class="fa-regular fa-star"></i>';
    }
  }
  container.innerHTML = html;
}

/* ---------- TRIGGER STAT ANIMATIONS ON SCROLL ---------- */
const statsSection = document.querySelector('.stats-grid');
if (statsSection) {
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Number counters
        entry.target.querySelectorAll('.stat-val[data-target]').forEach(animateCounter);
        // Arc rings
        entry.target.querySelectorAll('.arc-fill[data-offset]').forEach(animateArc);
        // Stars
        entry.target.querySelectorAll('.stat-stars[data-rating]').forEach(el => {
          renderStars(el, parseFloat(el.dataset.rating));
        });
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });
  statsObserver.observe(statsSection);
}

/* ---------- SCROLL PROGRESS BAR ---------- */
const progressBar = document.getElementById('progressBar');
function updateProgress() {
  const scrollTop  = window.scrollY;
  const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
  const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (progressBar) progressBar.style.width = pct + '%';
}
window.addEventListener('scroll', updateProgress, { passive: true });

/* ---------- SMOOTH SCROLL ---------- */
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

/* ---------- TOAST ---------- */
let toastTimer = null;
function showToast(msg, icon = '✅') {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toastMsg');
  if (!toast || !msgEl) return;
  msgEl.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ---------- COPY UPI ---------- */
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
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;width:1px;height:1px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast('UPI ID copied! 🎉'); }
  catch { showToast('Please copy manually: ' + text); }
  document.body.removeChild(ta);
}

/* ---------- WORKING UPI PAY BUTTON ---------- */
// How it works:
// 1. Try native upi:// deep link — opens installed UPI apps (PhonePe, GPay, Paytm etc.)
// 2. If browser blocks it, try intent:// for Android Chrome
// 3. If still nothing, show a helpful hint with manual instructions
window.openUPI = function (btn) {
  const upiId   = btn.dataset.upi;
  const name    = btn.dataset.name || 'Driver';
  const hint    = document.getElementById('upiHint');
  const amount  = ''; // no amount preset — user chooses in their app

  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&cu=INR`;

  // For Android: intent:// gives better app chooser
  const intentUrl = `intent://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&cu=INR#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;

  const isAndroid = /android/i.test(navigator.userAgent);
  const isIOS     = /iphone|ipad|ipod/i.test(navigator.userAgent);

  showToast('Opening your UPI app…');

  if (isAndroid) {
    // Try upi:// first, fall back to intent://
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'display:none;width:0;height:0;border:0';
    document.body.appendChild(iframe);
    iframe.src = upiUrl;

    // If app didn't open after 1.5s, show hint
    let opened = false;
    const handleVisibility = () => { if (document.hidden) opened = true; };
    document.addEventListener('visibilitychange', handleVisibility, { once: true });

    setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.body.removeChild(iframe);
      if (!opened) {
        // Try intent:// as fallback
        window.location.href = intentUrl;
        if (hint) {
          hint.innerHTML = 'If no app opened, copy the UPI ID and paste it in your preferred app.';
          hint.classList.add('show');
        }
      }
    }, 1500);

  } else if (isIOS) {
    // iOS: direct upi:// link works if app is installed
    window.location.href = upiUrl;
    if (hint) {
      setTimeout(() => {
        hint.innerHTML = `If the app didn't open, open <strong>PhonePe / GPay / Paytm</strong> manually and pay to: <a href="javascript:void(0)" onclick="copyUPI()">${upiId}</a>`;
        hint.classList.add('show');
      }, 1800);
    }

  } else {
    // Desktop browser — UPI deep links don't work, show QR hint
    window.location.href = upiUrl; // still try
    if (hint) {
      hint.innerHTML = `On desktop, use your phone to scan the QR code above, or open your UPI app and pay to: <strong>${upiId}</strong>`;
      hint.classList.add('show');
    }
  }
};

/* ---------- TIP AMOUNT BUTTONS ---------- */
document.querySelectorAll('.tip-amount').forEach(btn => {
  btn.addEventListener('click', () => {
    const upi    = btn.dataset.upi;
    const name   = btn.dataset.name || 'Driver';
    const amount = btn.dataset.amount;
    if (!upi || !amount) return;

    const upiUrl    = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(decodeURIComponent(name))}&am=${amount}&cu=INR`;
    const intentUrl = `intent://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(decodeURIComponent(name))}&am=${amount}&cu=INR#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
    const hint      = document.getElementById('upiHint');

    // Highlight selected amount
    document.querySelectorAll('.tip-amount').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    showToast(`Opening UPI for ₹${amount} tip…`);

    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'display:none;width:0;height:0;border:0';
      document.body.appendChild(iframe);
      iframe.src = upiUrl;
      let opened = false;
      const handleVis = () => { if (document.hidden) opened = true; };
      document.addEventListener('visibilitychange', handleVis, { once: true });
      setTimeout(() => {
        document.removeEventListener('visibilitychange', handleVis);
        document.body.removeChild(iframe);
        if (!opened) window.location.href = intentUrl;
      }, 1500);
    } else {
      window.location.href = upiUrl;
      if (hint) {
        setTimeout(() => {
          hint.innerHTML = `If no app opened, copy UPI ID <strong>${upi}</strong> and pay ₹${amount} manually.`;
          hint.classList.add('show');
        }, 1800);
      }
    }
  });
});

/* ---------- FLOATING BUTTONS FADE ON SCROLL ---------- */
let lastScroll = 0;
const fabs = document.querySelectorAll('.fab');
window.addEventListener('scroll', () => {
  const current = window.scrollY;
  fabs.forEach(f => {
    f.style.opacity = (current > lastScroll && current > 200) ? '0.45' : '1';
    f.style.transition = 'opacity 0.3s';
  });
  lastScroll = current;
}, { passive: true });