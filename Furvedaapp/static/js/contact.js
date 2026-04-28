document.addEventListener('DOMContentLoaded', () => {
    // Expand textarea slightly
    const tx = document.getElementById('message');
    tx.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });

    // Magnetic Button Effect
    const magWrap = document.getElementById('magnetic-wrap');
    const magBtn = document.getElementById('submitBtn');
    
    magBtn.addEventListener('mousemove', (e) => {
      const rect = magBtn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      magBtn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      magBtn.style.transition = `none`;
    });
    
    magBtn.addEventListener('mouseleave', () => {
      magBtn.style.transform = `translate(0px, 0px)`;
      magBtn.style.transition = `transform 0.6s cubic-bezier(.16, 1, .3, 1)`;
    });

    // Custom Cursor expansion on huge title
    const title = document.querySelector('.contact-title');
    title.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    title.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
  });