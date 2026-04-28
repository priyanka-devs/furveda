(() => {
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (prefersReduced) return;

  // 1) Section reveal
  const revealEls = Array.from(document.querySelectorAll('.lux-reveal'));
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-inview');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-inview'));
  }

  // 2) Lightweight 3D tilt for any element with [data-tilt]
  // Also supports grouping: move within nearest [data-tilt-group].
  const tiltEls = Array.from(document.querySelectorAll('[data-tilt]'));
  const isFinePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)')?.matches;
  if (!tiltEls.length || !isFinePointer) return;

  const maxTilt = 10; // degrees
  const maxLift = 8;  // px

  const setTransform = (el, rx, ry, lift) => {
    el.style.transform = `translateY(${lift}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };

  const resetTransform = (el) => {
    el.style.transform = '';
  };

  // Map group -> its tilt children for efficient updates
  const groups = new Map();
  for (const el of tiltEls) {
    const group = el.closest('[data-tilt-group]') || el;
    const arr = groups.get(group) || [];
    arr.push(el);
    groups.set(group, arr);
  }

  for (const [groupEl, children] of groups.entries()) {
    let raf = 0;

    const onMove = (ev) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = groupEl.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width;   // 0..1
        const py = (ev.clientY - r.top) / r.height;   // 0..1
        const rxBase = (py - 0.5) * -maxTilt;
        const ryBase = (px - 0.5) * maxTilt;

        children.forEach((el, i) => {
          const depth = 1 + (i * 0.18);
          const rx = rxBase / depth;
          const ry = ryBase / depth;
          const lift = -maxLift / depth;
          setTransform(el, rx, ry, lift);
        });
      });
    };

    const onLeave = () => {
      children.forEach(resetTransform);
    };

    groupEl.addEventListener('mousemove', onMove, { passive: true });
    groupEl.addEventListener('mouseleave', onLeave);
  }

  // 3) Reference-style floating particles in hero
  const particlesHost = document.querySelector('.fh-particles');
  if (particlesHost && !particlesHost.dataset.ready) {
    particlesHost.dataset.ready = '1';

    const count = 16;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'fh-particle';

      const size = 8 + Math.random() * 14; // px
      const left = Math.random() * 100; // %
      const top = Math.random() * 100; // %
      const opacity = 0.25 + Math.random() * 0.45;
      const dur = 7 + Math.random() * 7; // s
      const dx = (Math.random() - 0.5) * 60; // px
      const dy = -(40 + Math.random() * 120); // px
      const delay = -(Math.random() * dur); // negative for natural staggering

      p.style.left = `${left}%`;
      p.style.top = `${top}%`;
      p.style.setProperty('--p-size', `${size}px`);
      p.style.setProperty('--p-opacity', `${opacity}`);
      p.style.setProperty('--p-dur', `${dur}s`);
      p.style.setProperty('--p-dx', `${dx}px`);
      p.style.setProperty('--p-dy', `${dy}`);
      p.style.animationDelay = `${delay}s`;

      particlesHost.appendChild(p);
    }
  }

  // 4) Subtle parallax for center hero object (mouse)
  const hero = document.querySelector('[data-hero]');
  const heroObj = document.querySelector('[data-hero-parallax]');
  if (hero && heroObj && isFinePointer) {
    let raf2 = 0;
    const max = 10; // px
    const onMove2 = (ev) => {
      if (raf2) cancelAnimationFrame(raf2);
      raf2 = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width;
        const py = (ev.clientY - r.top) / r.height;
        const tx = (px - 0.5) * max;
        const ty = (py - 0.5) * max * 0.8;
        heroObj.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    };
    const onLeave2 = () => {
      heroObj.style.transform = '';
    };
    hero.addEventListener('mousemove', onMove2, { passive: true });
    hero.addEventListener('mouseleave', onLeave2);
  }
})();

