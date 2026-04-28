function renderFullCart() {
    let currentCart = JSON.parse(localStorage.getItem('furveda_cart')) || [];
    const fullCartContainer = document.getElementById('full-cart-container');
    const emptyCartContainer = document.getElementById('empty-cart-container');
    const list = document.getElementById('cart-list');
    
    if (currentCart.length === 0) {
      fullCartContainer.style.display = 'none';
      emptyCartContainer.style.display = 'block';
      return;
    }
    
    fullCartContainer.style.display = 'block';
    emptyCartContainer.style.display = 'none';
    
    let subtotal = 0;
    let html = '';
    
    currentCart.forEach(item => {
      const itemSub = item.price * item.qty;
      subtotal += itemSub;
      
      html += `
        <div class="cart-item-card">
          <button class="remove-item-btn" onclick="removeCartPageItem(${item.id})" aria-label="Remove item">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          
          <div class="cart-item-img-wrap">
            <img src="${item.img}" alt="${item.name}">
          </div>
          
          <div class="cart-item-details">
            <div class="cart-item-cat">${item.catLabel || 'Ayurvedic Supplement'}</div>
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
          </div>
          
          <div class="cart-controls">
            <div class="modern-qty-box">
              <button class="modern-qty-btn" onclick="updateCartPageQty(${item.id}, ${item.qty - 1})">−</button>
              <span class="modern-qty-val">${item.qty}</span>
              <button class="modern-qty-btn" onclick="updateCartPageQty(${item.id}, ${item.qty + 1})">+</button>
            </div>
            
            <div class="cart-item-subtotal">₹${itemSub.toFixed(2)}</div>
          </div>
        </div>
      `;
    });
    
    list.innerHTML = html;
    
    const shipping = 10.00;
    const total = subtotal + shipping;
    
    document.getElementById('summ-subtotal').textContent = '₹' + subtotal.toFixed(2);
    document.getElementById('summ-total').textContent = '₹' + total.toFixed(2);
    
    if(typeof updateCartUI === 'function') updateCartUI();
  }
  
  function removeCartPageItem(id) {
    let currentCart = JSON.parse(localStorage.getItem('furveda_cart')) || [];
    currentCart = currentCart.filter(x => x.id !== id);
    localStorage.setItem('furveda_cart', JSON.stringify(currentCart));
    renderFullCart();
  }
  
  function updateCartPageQty(id, newQty) {
    let qty = parseInt(newQty);
    if(isNaN(qty) || qty < 1) {
      if(qty === 0) removeCartPageItem(id);
      return;
    }
    
    let currentCart = JSON.parse(localStorage.getItem('furveda_cart')) || [];
    const idx = currentCart.findIndex(x => x.id === id);
    if(idx > -1) {
      currentCart[idx].qty = qty;
      localStorage.setItem('furveda_cart', JSON.stringify(currentCart));
      renderFullCart();
    }
  }
  
  function proceedToCheckoutAction() {
    window.location.href = '/checkout/';
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderFullCart();
  });