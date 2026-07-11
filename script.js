/* Siegward Games - main script */

document.addEventListener('DOMContentLoaded', () => {

  /* Copyright year */
  const yearEl = document.getElementById('copyrightYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }


  /* Sticky nav */
  const nav = document.getElementById('nav');

  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 50);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();


  /* Mobile menu */
  const hamburger  = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuClose  = document.getElementById('mobileMenuClose');

  function openMenu() {
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (hamburger)  hamburger.addEventListener('click', openMenu);
  if (menuClose)  menuClose.addEventListener('click', closeMenu);

  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('is-open')) {
      closeMenu();
    }
  });


  /* Smooth scroll with nav offset */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#') return;
      const target = document.querySelector(hash);
      if (!target) return;

      e.preventDefault();
      const navH   = nav ? nav.offsetHeight : 0;
      const offset = target.getBoundingClientRect().top + window.scrollY - navH - 12;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    });
  });


  /* Scroll reveal */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -36px 0px' }
    );

    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }


  /* Contact form (Web3Forms) */
  const contactForm  = document.getElementById('contactForm');
  const formFeedback = document.getElementById('formFeedback');
  const submitBtn    = document.getElementById('submitBtn');

  if (contactForm) {
    contactForm.addEventListener('submit', async e => {
      e.preventDefault();

      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');
      clearFeedback();

      try {
        const res  = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body:   new FormData(contactForm),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          showFeedback('is-success', 'Message sent. Thanks! I\'ll get back to you soon.');
          contactForm.reset();
        } else {
          throw new Error(data.message || 'Submission failed.');
        }
      } catch (err) {
        console.error('[ContactForm]', err);
        showFeedback('is-error', 'Something went wrong. Please try again in a moment.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
        formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  function showFeedback(type, message) {
    formFeedback.textContent = message;
    formFeedback.className   = `form-feedback is-visible ${type}`;
  }

  function clearFeedback() {
    formFeedback.textContent = '';
    formFeedback.className   = 'form-feedback';
  }


  /* Ball characters.
     Three canvas balls that follow the cursor, dart away when touched,
     and fall asleep at the bottom of the screen after 15-30s of no input. */
  const canvas = document.getElementById('ballCanvas');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0, DPR = 1;
    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const mouse = { x: W * 0.5, y: H * 0.35, seen: false };
    let lastActivity = performance.now();
    let sleepDelay   = 15000 + Math.random() * 15000;
    let asleep       = false;

    function registerActivity(x, y) {
      mouse.x = x;
      mouse.y = y;
      mouse.seen = true;
      lastActivity = performance.now();
      if (asleep) wakeUp();
    }

    window.addEventListener('pointermove', e => registerActivity(e.clientX, e.clientY), { passive: true });
    window.addEventListener('pointerdown', e => registerActivity(e.clientX, e.clientY), { passive: true });

    function wakeUp() {
      asleep = false;
      sleepDelay = 15000 + Math.random() * 15000;
      balls.forEach(b => {
        b.vy = -(4 + Math.random() * 3);
        b.vx = (Math.random() - 0.5) * 4;
        b.excitedUntil = performance.now() + 800;
        b.resting = false;
      });
    }

    function makeBall(cfg, i) {
      return {
        ...cfg,
        x: W * (0.25 + 0.25 * i),
        y: H * 0.3 + i * 40,
        vx: 0, vy: 0,
        phase: Math.random() * Math.PI * 2,
        scaredUntil: 0,
        excitedUntil: 0,
        resting: false,
        zTimer: 0,
        squash: 0,
      };
    }

    const balls = [
      makeBall({ r: 26, color: '#df574a', dark: '#8f2a20', blush: '#ff9a86', brow: 'angry',   mouth: 'stern'  }, 0),
      makeBall({ r: 22, color: '#4c86d9', dark: '#27508f', blush: '#a9cdf5', brow: 'raised',  mouth: 'smile'  }, 1),
      makeBall({ r: 19, color: '#55a868', dark: '#2b5e3b', blush: '#a4dfb6', brow: 'relaxed', mouth: 'smile'  }, 2),
    ];

    const zzz = [];

    const SEEK_ACCEL   = 0.045;
    const ARRIVE_DIST  = 110;
    const MAX_SPEED    = 3.0;
    const SCARE_SPEED  = 9;
    const SCARE_TIME   = 750;
    const GRAVITY      = 0.35;
    const FLOOR_BOUNCE = 0.45;
    const AIR_DRAG     = 0.985;

    function step(now, dt) {
      if (!asleep && mouse.seen && now - lastActivity > sleepDelay) {
        asleep = true;
        balls.forEach(b => { b.scaredUntil = 0; b.excitedUntil = 0; });
      }

      const floorY = H - 6;

      for (const b of balls) {
        if (!asleep) {
          b.resting = false;

          const scared = now < b.scaredUntil;
          const dxm = mouse.x - b.x;
          const dym = mouse.y - b.y;
          const distM = Math.hypot(dxm, dym) || 1;

          // cursor touched the ball: dart away
          if (mouse.seen && !scared && distM < b.r + 12) {
            const ang = Math.atan2(-dym, -dxm) + (Math.random() - 0.5) * 1.2;
            const burst = SCARE_SPEED + Math.random() * 4;
            b.vx = Math.cos(ang) * burst;
            b.vy = Math.sin(ang) * burst;
            b.scaredUntil  = now + SCARE_TIME;
            b.excitedUntil = now + SCARE_TIME + 400;
          }

          // drift toward the cursor, keep some distance
          if (mouse.seen && !scared && distM > ARRIVE_DIST) {
            b.vx += (dxm / distM) * SEEK_ACCEL * dt;
            b.vy += (dym / distM) * SEEK_ACCEL * dt;
          }

          b.vy += Math.sin(now * 0.0016 + b.phase) * 0.015 * dt;

          b.vx *= AIR_DRAG;
          b.vy *= AIR_DRAG;
          const cap = scared ? SCARE_SPEED + 4 : MAX_SPEED;
          const spd = Math.hypot(b.vx, b.vy);
          if (spd > cap) {
            b.vx = (b.vx / spd) * cap;
            b.vy = (b.vy / spd) * cap;
          }
        } else {
          // asleep: gravity pulls them down
          if (!b.resting) {
            b.vy += GRAVITY * dt;
            b.vx *= 0.99;
          }
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (b.x < b.r)      { b.x = b.r;      b.vx = Math.abs(b.vx) * 0.7; }
        if (b.x > W - b.r)  { b.x = W - b.r;  b.vx = -Math.abs(b.vx) * 0.7; }
        if (b.y < b.r + 70) { b.y = b.r + 70; b.vy = Math.abs(b.vy) * 0.7; }

        if (b.y > floorY - b.r) {
          b.y = floorY - b.r;
          if (asleep) {
            if (Math.abs(b.vy) > 0.8) {
              b.vy = -b.vy * FLOOR_BOUNCE;
              b.squash = 1;
            } else {
              b.vy = 0;
              b.vx *= 0.9;
              if (Math.abs(b.vx) < 0.05) { b.vx = 0; b.resting = true; }
            }
          } else {
            b.vy = -Math.abs(b.vy) * 0.7;
          }
        }

        // keep balls from overlapping
        for (const o of balls) {
          if (o === b) continue;
          const dx = o.x - b.x, dy = o.y - b.y;
          const d = Math.hypot(dx, dy) || 1;
          const minD = o.r + b.r + 4;
          if (d < minD) {
            const push = (minD - d) * 0.5;
            const nx = dx / d, ny = dy / d;
            b.x -= nx * push; b.y -= ny * push * (b.resting ? 0 : 1);
            o.x += nx * push; o.y += ny * push * (o.resting ? 0 : 1);
          }
        }

        b.squash = Math.max(0, b.squash - 0.06 * dt);

        if (b.resting) {
          b.zTimer -= dt * 16;
          if (b.zTimer <= 0) {
            b.zTimer = 1800 + Math.random() * 800;
            zzz.push({ x: b.x + b.r * 0.7, y: b.y - b.r, a: 1, s: 10 + Math.random() * 4 });
          }
        }
      }

      for (let i = zzz.length - 1; i >= 0; i--) {
        const z = zzz[i];
        z.y -= 0.35 * dt;
        z.x += 0.12 * dt;
        z.a -= 0.008 * dt;
        if (z.a <= 0) zzz.splice(i, 1);
      }
    }

    function drawBall(b, now) {
      const excited = now < b.excitedUntil;
      const sleeping = asleep;

      ctx.save();
      ctx.translate(b.x, b.y);

      let sx = 1, sy = 1;
      if (b.squash > 0) {
        sx = 1 + b.squash * 0.18;
        sy = 1 - b.squash * 0.18;
      } else if (b.resting) {
        const breathe = Math.sin(now * 0.002 + b.phase) * 0.025;
        sx = 1 + breathe;
        sy = 1 - breathe;
      }
      ctx.scale(sx, sy);

      if (b.resting) {
        ctx.fillStyle = 'rgba(58,47,40,0.13)';
        ctx.beginPath();
        ctx.ellipse(0, b.r * 0.95, b.r * 0.85, b.r * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const g = ctx.createRadialGradient(-b.r * 0.35, -b.r * 0.4, b.r * 0.1, 0, 0, b.r * 1.15);
      g.addColorStop(0, lighten(b.color, 0.28));
      g.addColorStop(0.55, b.color);
      g.addColorStop(1, b.dark);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath();
      ctx.ellipse(-b.r * 0.35, -b.r * 0.45, b.r * 0.32, b.r * 0.2, -0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = hexA(b.blush, 0.4);
      ctx.beginPath(); ctx.arc(-b.r * 0.55, b.r * 0.22, b.r * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc( b.r * 0.55, b.r * 0.22, b.r * 0.2, 0, Math.PI * 2); ctx.fill();

      const eyeOffX = b.r * 0.32;
      const eyeOffY = -b.r * 0.1;
      const eyeR = b.r * (excited ? 0.3 : 0.26);

      if (sleeping) {
        ctx.strokeStyle = b.dark;
        ctx.lineWidth = Math.max(2, b.r * 0.09);
        ctx.lineCap = 'round';
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(s * eyeOffX, eyeOffY + b.r * 0.05, b.r * 0.16, Math.PI * 0.15, Math.PI * 0.85);
          ctx.stroke();
        }
      } else {
        // pupils track the cursor
        const dxm = mouse.x - b.x;
        const dym = mouse.y - b.y;
        const dm  = Math.hypot(dxm, dym) || 1;
        const look = Math.min(1, dm / 200) * b.r * 0.09;
        const lx = (dxm / dm) * look;
        const ly = (dym / dm) * look;

        for (const s of [-1, 1]) {
          const ex = s * eyeOffX, ey = eyeOffY;
          ctx.fillStyle = '#fffdf6';
          ctx.beginPath(); ctx.arc(ex, ey, eyeR, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#2b1d16';
          ctx.beginPath(); ctx.arc(ex + lx, ey + ly, eyeR * (excited ? 0.66 : 0.58), 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(ex + lx + eyeR * 0.18, ey + ly - eyeR * 0.22, eyeR * 0.2, 0, Math.PI * 2); ctx.fill();
        }

        ctx.strokeStyle = b.dark;
        ctx.lineWidth = Math.max(2, b.r * 0.1);
        ctx.lineCap = 'round';
        const browY = eyeOffY - eyeR - b.r * 0.14;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          if (b.brow === 'angry') {
            ctx.moveTo(s * (eyeOffX + eyeR * 0.8), browY - b.r * 0.06);
            ctx.quadraticCurveTo(s * eyeOffX, browY - b.r * 0.02, s * (eyeOffX - eyeR * 0.65), browY + b.r * 0.16);
          } else if (b.brow === 'raised' || excited) {
            ctx.moveTo(s * (eyeOffX - eyeR * 0.7), browY - b.r * 0.02);
            ctx.quadraticCurveTo(s * eyeOffX, browY - b.r * 0.16, s * (eyeOffX + eyeR * 0.7), browY);
          } else {
            ctx.moveTo(s * (eyeOffX - eyeR * 0.6), browY + b.r * 0.04);
            ctx.quadraticCurveTo(s * eyeOffX, browY - b.r * 0.03, s * (eyeOffX + eyeR * 0.6), browY + b.r * 0.04);
          }
          ctx.stroke();
        }
      }

      ctx.strokeStyle = b.dark;
      ctx.fillStyle = b.dark;
      ctx.lineWidth = Math.max(2, b.r * 0.09);
      ctx.lineCap = 'round';
      const mouthY = b.r * 0.38;
      if (sleeping) {
        ctx.beginPath();
        ctx.arc(0, mouthY, b.r * 0.08, 0, Math.PI * 2);
        ctx.fill();
      } else if (excited) {
        ctx.beginPath();
        ctx.ellipse(0, mouthY, b.r * 0.22, b.r * 0.17, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.mouth === 'stern') {
        ctx.beginPath();
        ctx.arc(0, mouthY - b.r * 0.06, b.r * 0.18, Math.PI * 0.22, Math.PI * 0.78);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, mouthY - b.r * 0.12, b.r * 0.3, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
      }

      ctx.restore();
    }

    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      for (const b of balls) drawBall(b, now);

      ctx.fillStyle = 'rgba(58,47,40,0.5)';
      for (const z of zzz) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, z.a);
        ctx.font = `600 ${z.s}px Fredoka, sans-serif`;
        ctx.fillText('z', z.x, z.y);
        ctx.restore();
      }
    }

    function lighten(hex, amt) {
      const n = parseInt(hex.slice(1), 16);
      const r = Math.min(255, (n >> 16) + 255 * amt);
      const g = Math.min(255, ((n >> 8) & 255) + 255 * amt);
      const b2 = Math.min(255, (n & 255) + 255 * amt);
      return `rgb(${r | 0},${g | 0},${b2 | 0})`;
    }
    function hexA(hex, a) {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
    }

    let lastT = performance.now();
    function loop(now) {
      const dt = Math.min(3, (now - lastT) / 16.67);
      lastT = now;
      // some browsers load the page before the window has a size
      if (W !== window.innerWidth || H !== window.innerHeight) resize();
      step(now, dt);
      draw(now);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

});
