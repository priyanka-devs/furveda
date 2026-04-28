document.addEventListener("DOMContentLoaded", () => {
    // 1. Text Splitter for Manifesto Lead
    const leadTxt = document.getElementById('manifesto-lead');
    const words = leadTxt.innerText.split(' ');
    leadTxt.innerHTML = '';
    words.forEach((word, idx) => {
      const spanOuter = document.createElement('span');
      spanOuter.className = 'reveal-word';
      if (idx !== words.length - 1) spanOuter.style.marginRight = '12px';
      
      const spanInner = document.createElement('span');
      spanInner.innerText = word;
      spanInner.style.transitionDelay = `${idx * 0.05}s`;
      
      spanOuter.appendChild(spanInner);
      leadTxt.appendChild(spanOuter);
    });

    // 2. Intersection Observers
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    observer.observe(leadTxt);

    const txtObs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if(entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
          }, i * 200);
          txtObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal-item').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(40px)';
      el.style.transition = 'all 1.2s cubic-bezier(.16, 1, .3, 1)';
      txtObs.observe(el);
    });



    // Cursor Expansion over big targets
    const hugeTexts = document.querySelectorAll('.about-title, .h-card-title, .manifesto-lead');
    hugeTexts.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
    });
  });