// js/pages/home.js
import { getAllProducts, IMAGE_BASE_URL } from '../api/products.js';
import { addToCart } from '../components/cart.js';
import { showSkeletons } from '../utils/skeleton.js';

export async function renderFeaturedProducts() {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;

  showSkeletons(grid, 8);

  try {
    const response = await getAllProducts();
    const products = response.data || response;
    const featured = products.slice(0, 8);

    grid.innerHTML = '';

    featured.forEach(product => {
      const rawImage  = Array.isArray(product.images) ? product.images[0] : product.image ?? '';
      const imageSrc  = rawImage ? (rawImage.startsWith('http') ? rawImage : `${IMAGE_BASE_URL}${rawImage}`) : '';
      const price     = typeof product.price === 'number' ? product.price : parseFloat(product.price);
      const productId = product._id || product.id;
      const totalStock    = product.stock ?? 0;
      const threshold     = product.lowStockThreshold ?? 5;
      const hasSizeStock  = Array.isArray(product.sizeStock) && product.sizeStock.length > 0;
      const isOutOfStock  = totalStock === 0;

      // ── Size buttons with per-size stock ─────────────────────
      const sizeBtns = (Array.isArray(product.sizes) ? product.sizes : [])
        .map(size => {
          const sizeStock = hasSizeStock
            ? (product.sizeStock.find(s => s.size === size)?.stock ?? 0)
            : totalStock;
          const disabled = sizeStock === 0 ? 'disabled' : '';
          const outClass = sizeStock === 0 ? ' size-option--out' : '';
          const title    = sizeStock === 0 ? 'Out of stock' : `${sizeStock} in stock`;
          return `<button class="size-option${outClass}" data-size="${size}" data-stock="${sizeStock}" ${disabled} title="${title}">${size}</button>`;
        })
        .join('');

      // ── Stock badge on card ───────────────────────────────────
      let stockBadge = '';
      if (isOutOfStock) {
        stockBadge = `<span class="product-badge product-badge--out">Out of stock</span>`;
      } else if (!hasSizeStock && totalStock <= threshold) {
        stockBadge = `<span class="product-badge product-badge--low">${totalStock} left</span>`;
      }

      grid.innerHTML += `
        <div class="product-card"
          data-id="${productId}"
          data-name="${product.name}"
          data-price="${price}"
          data-stock="${totalStock}">
          <div class="product-image">
            ${product.isFeatured ? `<span class="product-badge sale">New</span>` : ''}
            ${stockBadge}
            ${imageSrc
              ? `<img src="${imageSrc}" alt="${product.name}" loading="lazy" />`
              : `<div style="width:100%;height:100%;background:var(--sand);display:flex;align-items:center;justify-content:center;">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                 </div>`
            }
          </div>
          <div class="product-info">
            <p class="product-name">${product.name}</p>
            <span class="product-price">R${price.toFixed(2)}</span>
          </div>

          <div class="size-picker" aria-hidden="true">
            <p class="size-picker-label">Select a size</p>
            <div class="size-options">${sizeBtns}</div>
            <div class="stock-indicator"></div>
            <p class="size-error" aria-live="polite"></p>
          </div>

          <button class="btn-cart"
            data-product-id="${productId}"
            data-product-name="${product.name}"
            data-product-price="${price}"
            data-product-image="${imageSrc}"
            ${isOutOfStock ? 'disabled' : ''}>
            ${isOutOfStock ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      `;
    });

    // ── Store product data for stock lookups ──────────────────
    window._v808_home_products = featured;

    // ── Event delegation ──────────────────────────────────────
    grid.addEventListener('click', e => {

      // Size selected → update stock indicator
      const sizeBtn = e.target.closest('.size-option');
      if (sizeBtn && !sizeBtn.disabled) {
        const picker  = sizeBtn.closest('.size-picker');
        const card    = sizeBtn.closest('.product-card');
        const cartBtn = card.querySelector('.btn-cart');

        picker.querySelectorAll('.size-option').forEach(b => b.classList.remove('selected'));
        sizeBtn.classList.add('selected');
        picker.querySelector('.size-error').textContent = '';

        // Update stock indicator
        const sizeStock = parseInt(sizeBtn.dataset.stock ?? '0');
        const threshold = 5;
        const indicator = picker.querySelector('.stock-indicator');
        if (indicator) {
          if (sizeStock === 0) {
            indicator.innerHTML = `<span class="stock-badge stock-badge--out">Out of stock</span>`;
          } else if (sizeStock <= threshold) {
            indicator.innerHTML = `<span class="stock-badge stock-badge--low">Only ${sizeStock} left</span>`;
          } else {
            indicator.innerHTML = `<span class="stock-badge stock-badge--ok">${sizeStock} in stock</span>`;
          }
        }

        // Disable confirm if this size is out of stock
        if (cartBtn) {
          cartBtn.disabled    = sizeStock === 0;
          cartBtn.textContent = sizeStock === 0 ? 'Out of stock' : 'Confirm';
        }
        return;
      }

      // Cart button
      const cartBtn = e.target.closest('.btn-cart');
      if (!cartBtn || cartBtn.disabled) return;

      const card   = cartBtn.closest('.product-card');
      const picker = card.querySelector('.size-picker');

      // Open size picker
      if (!picker.classList.contains('open')) {
        picker.classList.add('open');
        picker.setAttribute('aria-hidden', 'false');
        cartBtn.textContent = 'Confirm';
        return;
      }

      // Confirm size
      const selectedSize = picker.querySelector('.size-option.selected');
      if (!selectedSize) {
        picker.querySelector('.size-error').textContent = 'Please select a size';
        return;
      }

      const sizeStock = parseInt(selectedSize.dataset.stock ?? '0');

      // Out of stock guard
      if (sizeStock === 0) {
        picker.querySelector('.size-error').textContent = 'This size is out of stock.';
        return;
      }

      // Over-quantity guard
      const cart      = JSON.parse(localStorage.getItem('v808_cart') || '[]');
      const cartKey   = `${cartBtn.dataset.productId}-${selectedSize.dataset.size}`;
      const inCart    = cart.find(c => c.id === cartKey);
      const inCartQty = inCart?.qty ?? 0;

      if (inCartQty + 1 > sizeStock) {
        picker.querySelector('.size-error').textContent =
          `Only ${sizeStock} available in size ${selectedSize.dataset.size}. You have ${inCartQty} in your cart.`;
        return;
      }

      addToCart({
        id:    cartKey,
        name:  cartBtn.dataset.productName,
        price: parseFloat(cartBtn.dataset.productPrice),
        size:  selectedSize.dataset.size,
        image: cartBtn.dataset.productImage,
        stock: sizeStock,
      });

      // Reset picker
      picker.classList.remove('open');
      picker.setAttribute('aria-hidden', 'true');
      picker.querySelectorAll('.size-option').forEach(b => b.classList.remove('selected'));
      picker.querySelector('.size-error').textContent = '';
      picker.querySelector('.stock-indicator').innerHTML = '';
      cartBtn.textContent = 'Add to cart';
      cartBtn.disabled    = false;
    });

  } catch (err) {
    grid.innerHTML = `<p class="products-error">Could not load products. Please try again.</p>`;
    console.error('[Home] Failed to load products:', err);
  }
}