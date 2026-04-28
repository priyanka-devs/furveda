const products = window.djangoProducts || [
  { id:1, name:'Anti-Ageing Biscuits', cat:'biscuits', catLabel:'Ayurvedic Biscuits', price:24, badge:'bestseller', featured:true, img:'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=600' },
  { id:2, name:'Bone & Joint Support', cat:'biscuits', catLabel:'Ayurvedic Biscuits', price:22, badge:'', featured:false, img:'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600' },
  { id:3, name:'Shiny Skin & Coat', cat:'biscuits', catLabel:'Ayurvedic Biscuits', price:22, badge:'', featured:false, img:'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=600' },
  { id:4, name:'Gut Health Booster', cat:'biscuits', catLabel:'Ayurvedic Biscuits', price:25, badge:'', featured:false, img:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=600' },
  { id:5, name:'Chicken Softies', cat:'chews', catLabel:'Natural Chews', price:18.5, badge:'', featured:false, img:'https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?auto=format&fit=crop&q=80&w=600' },
  { id:6, name:'Basa Fish Softies — Carrot & Pumpkin', cat:'chews', catLabel:'Natural Chews', price:19.5, badge:'', featured:false, img:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=600' },
  { id:7, name:'Minty Dental Chews — Rosemary & Ashwagandha', cat:'chews', catLabel:'Natural Chews', price:20, badge:'', featured:true, img:'https://images.unsplash.com/photo-1583512603806-077998240c7a?auto=format&fit=crop&q=80&w=600' },
  { id:8, name:'Milky Dental Chews — With Seaweed', cat:'chews', catLabel:'Natural Chews', price:21, badge:'', featured:false, img:'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&q=80&w=600' },
  { id:9, name:'Chicken Liver Softies — With Brahmi', cat:'chews', catLabel:'Natural Chews', price:18, badge:'new', featured:true, img:'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=600' },
  { id:10, name:'Chicken Strips — Honey & Chamomile', cat:'herbal', catLabel:'Herbal Treats', price:22, badge:'', featured:false, img:'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600' },
  { id:11, name:'Chicken Strips — Pumpkin & Raspberry', cat:'herbal', catLabel:'Herbal Treats', price:22, badge:'', featured:false, img:'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=600' }
];

const hoverCarouselPool = {
  biscuits: [
    'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600'
  ],
  chews: [
    'https://images.unsplash.com/photo-1583512603806-077998240c7a?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&q=80&w=600'
  ],
  herbal: [
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=600'
  ]
};
 
let currentCat = 'all';
let currentSort = 'featured';
let cart = JSON.parse(localStorage.getItem('furveda_cart')) || [];
 
// Initialize cart UI on load if anything exists
document.addEventListener('DOMContentLoaded', () => {
  if (cart.length > 0) updateCartUI();
});
 
function getFiltered() {
  let list = currentCat === 'all' ? [...products] : products.filter(p => p.cat === currentCat);
  if(currentSort === 'price-asc') list.sort((a,b) => a.price - b.price);
  else if(currentSort === 'price-desc') list.sort((a,b) => b.price - a.price);
  else list.sort((a,b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  return list;
}
 
function stars(n) {
  let s = '';
  for(let i=1;i<=5;i++) s += `<span class="star${i>n?' empty':''}"></span>`;
  return s;
}

function getProductCarouselImages(product) {
  if (product.images && product.images.length > 1) {
    return product.images;
  }
  // Fallback to placeholder pool if the user hasn't uploaded extra images
  const pool = hoverCarouselPool[product.cat] || [];
  const combined = [product.img, ...pool.filter(src => src !== product.img)];
  return combined.slice(0, 3);
}
 
function renderProducts() {
  const grid = document.getElementById('product-grid');
  const filtered = getFiltered();
  document.getElementById('result-count').textContent = String(filtered.length).padStart(2,'0');
 
  if(!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><p>No products in this collection.</p></div>`;
    return;
  }
 
  grid.innerHTML = filtered.map((p, i) => {
    const badgeHtml = p.badge === 'bestseller'
      ? `<span class="product-badge badge-bestseller">Best Seller</span>`
      : p.badge === 'new'
      ? `<span class="product-badge badge-new">New</span>`
      : '';
    const carouselHtml = getProductCarouselImages(p)
      .map((src, idx) => `<img src="${src}" alt="${p.name}" loading="lazy"${idx === 0 ? ' class="active"' : ''}/>`)
      .join('');
 
    return `
      <div class="product-card" style="animation-delay:${i*0.07}s">
        <a href="/product/${p.id}/" style="display:block; text-decoration:none; color:inherit;">
          <div class="product-img-wrap">
            ${badgeHtml}
            <div class="product-carousel">
              ${carouselHtml}
            </div>
            <div class="product-overlay">
              <button class="product-add-btn" onclick="event.preventDefault(); addToCart(${p.id})">
                Add to Cart <span>+</span>
              </button>
            </div>
          </div>
          <div class="product-info">
            <p class="product-cat">${p.catLabel}</p>
            <h3 class="product-name">${p.name}</h3>
            <div class="product-footer">
              <span class="product-price">₹${p.price.toFixed(0)}</span>
              <div class="product-stars">${stars(4)}</div>
            </div>
          </div>
        </a>
      </div>
    `;
  }).join('');

  initProductHoverCarousels();
}

function initProductHoverCarousels() {
  document.querySelectorAll('.product-card').forEach(card => {
    const slides = card.querySelectorAll('.product-carousel img');
    if(slides.length < 2) return;

    let currentIndex = 0;
    let intervalId = null;

    const showSlide = nextIndex => {
      slides[currentIndex].classList.remove('active');
      currentIndex = nextIndex;
      slides[currentIndex].classList.add('active');
    };

    const start = () => {
      if(intervalId) return;
      intervalId = setInterval(() => {
        showSlide((currentIndex + 1) % slides.length);
      }, 2000);
    };

    const stop = () => {
      if(!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
      showSlide(0);
    };

    card.addEventListener('mouseenter', start);
    card.addEventListener('mouseleave', stop);
  });
}
 
function addToCart(id) {
  const p = products.find(x => x.id === id);
  const existing = cart.find(x => x.id === id);
  if(existing) existing.qty++;
  else cart.push({...p, qty: 1});
  updateCartUI();
  showToast(`${p.name} added`);
  openCart();
}
 
function updateQty(id, delta) {
  const idx = cart.findIndex(x => x.id === id);
  if(idx < 0) return;
  cart[idx].qty += delta;
  if(cart[idx].qty <= 0) cart.splice(idx, 1);
  updateCartUI();
}
 
function removeItem(id) {
  cart = cart.filter(x => x.id !== id);
  updateCartUI();
}
 
function updateCartUI() {
  // Save cart to persistence
  localStorage.setItem('furveda_cart', JSON.stringify(cart));

  const count = cart.reduce((a,x) => a + x.qty, 0);
  const total = cart.reduce((a,x) => a + x.price * x.qty, 0);
 
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
 
  document.getElementById('cart-total').textContent = `₹${total.toFixed(0)}`;
  document.getElementById('checkout-btn').disabled = count === 0;
 
  const wrap = document.getElementById('cart-items-wrap');
  const emptyEl = document.getElementById('empty-cart');
 
  if(cart.length === 0) {
    wrap.innerHTML = '';
    const ec = document.createElement('div');
    ec.id = 'empty-cart';
    ec.className = 'empty-cart';
    ec.innerHTML = `<div class="empty-cart-icon">∅</div><p>Your cart is empty</p>`;
    wrap.appendChild(ec);
    return;
  }
 
  wrap.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.img}" alt="${item.name}"/>
      <div class="cart-item-info">
        <p class="cart-item-cat">${item.catLabel}</p>
        <p class="cart-item-name">${item.name}</p>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
          <div class="qty-num">${item.qty}</div>
          <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
          <button class="cart-item-del" onclick="removeItem(${item.id})">Remove</button>
        </div>
      </div>
      <span class="cart-item-price">₹${(item.price * item.qty).toFixed(0)}</span>
    </div>
  `).join('');
}
 
function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
 
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}
 
function handleCheckout() {
  showToast('Opening Shopping Cart…');
  setTimeout(() => {
    window.location.href = '/cart/';
  }, 500);
}
 
// Filters
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCat = btn.dataset.cat;
    renderProducts();
  });
});
const sortSelect = document.getElementById('sort-select');
if (sortSelect) {
  sortSelect.addEventListener('change', e => {
    currentSort = e.target.value;
    renderProducts();
  });
}
 
// Scroll nav
window.addEventListener('scroll', () => {
  document.getElementById('main-nav').classList.toggle('scrolled', scrollY > 20);
});
 
// Custom cursor
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
if (cursor && ring) {
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  function animCursor() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animCursor);
  }
  animCursor();
  document.querySelectorAll('a, button, [role="button"], select, input').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
  });
}
 
if (document.getElementById('product-grid')) {
  renderProducts();
}

// Product Detail Interactions
function initProductDetail() {
  const qtyMin = document.getElementById('pd-qty-min');
  const qtyPlus = document.getElementById('pd-qty-plus');
  const qtyVal = document.getElementById('pd-qty-val');
  const addBtn = document.getElementById('pd-add-btn');

  if (qtyMin && qtyPlus && qtyVal) {
    let currentQty = 1;
    qtyMin.addEventListener('click', () => {
      if(currentQty > 1) {
        currentQty--;
        qtyVal.textContent = currentQty;
      }
    });
    qtyPlus.addEventListener('click', () => {
      currentQty++;
      qtyVal.textContent = currentQty;
    });

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (!window.currentProduct) return;
        const p = window.currentProduct;
        
        const existing = cart.find(x => x.id === p.id);
        if(existing) existing.qty += currentQty;
        else cart.push({...p, qty: currentQty});
        
        updateCartUI();
        showToast(`${currentQty}x ${p.name} added`);
        openCart();
      });
    }
  }

  // Accordions
  const accBtns = document.querySelectorAll('.pd-acc-btn');
  accBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling;
      const isOpen = btn.classList.contains('active');

      if (isOpen) {
        btn.classList.remove('active');
        content.classList.remove('open');
      } else {
        btn.classList.add('active');
        content.classList.add('open');
      }
    });
  });

  // Gallery Thumbnails
  const mainImg = document.getElementById('pd-main-img');
  const thumbs = document.querySelectorAll('.pd-thumb');
  
  if (mainImg && thumbs.length > 0) {
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        // Deselect all
        thumbs.forEach(t => t.classList.remove('active'));
        // Select clicked
        thumb.classList.add('active');
        
        // Ensure image fades slightly on transition
        mainImg.style.opacity = '0.5';
        setTimeout(() => {
          mainImg.src = thumb.dataset.src || thumb.querySelector('img').src;
          mainImg.style.opacity = '1';
        }, 150);
      });
    });
  }
}

initProductDetail();

// Scroll Reveal Animation
document.addEventListener("DOMContentLoaded", () => {
    const revealElements = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        revealElements.forEach(el => el.classList.add('visible'));
    }
});
