// js/pages/home.js
import { getAllProducts, IMAGE_BASE_URL } from '../api/products.js';
import { addToCart } from '../components/cart.js';
import { showSkeletons } from '../utils/skeleton.js';

export async function renderFeaturedProducts() {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;

  // Show 8 skeletons while fetching
  showSkeletons(grid, 8);

  try {
    const response = await getAllProducts();
    const featured = (response.data || response).slice(0, 8);

    grid.innerHTML = '';

    featured.forEach(product => {
      const rawImage  = Array.isArray(product.images) ? product.images[0] : product.image ?? '';
      const imageSrc  = rawImage ? (rawImage.startsWith('http') ? rawImage : `${IMAGE_BASE_URL}${rawImage}`) : '';
      const price     = typeof product.price === 'number' ? product.price : parseFloat(product.price);
      const productId = product._id || product.id;

      const sizeBtns = (Array.isArray(product.sizes) ? product.sizes : [])
        .map(size => `<button class="size-option" data-size="${size}">${size}</button>`)
        .join('');

      grid.innerHTML += `
        <div class="product-card">
          <div class="product-image">
            ${product.isFeatured ? `<span class="product-badge sale">New</span>` : ''}
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
            <p class="size-error" aria-live="polite"></p>
          </div>

          <button class="btn-cart"
            data-product-id="${productId}"
            data-product-name="${product.name}"
            data-product-price="${price}"
            data-product-image="${imageSrc}">
            Add to cart
          </button>
        </div>
      `;
    });

    // ── Event delegation ──────────────────────────────────────
    grid.addEventListener('click', e => {
      const sizeBtn = e.target.closest('.size-option');
      if (sizeBtn) {
        const picker = sizeBtn.closest('.size-picker');
        picker.querySelectorAll('.size-option').forEach(b => b.classList.remove('selected'));
        sizeBtn.classList.add('selected');
        picker.querySelector('.size-error').textContent = '';
        return;
      }

      const cartBtn = e.target.closest('.btn-cart');
      if (!cartBtn) return;

      const card         = cartBtn.closest('.product-card');
      const picker       = card.querySelector('.size-picker');
      const selectedSize = picker?.querySelector('.size-option.selected');

      if (!picker.classList.contains('open')) {
        picker.classList.add('open');
        picker.setAttribute('aria-hidden', 'false');
        cartBtn.textContent = 'Confirm';
        return;
      }

      if (!selectedSize) {
        picker.querySelector('.size-error').textContent = 'Please select a size';
        return;
      }

      addToCart({
        id:    `${cartBtn.dataset.productId}-${selectedSize.dataset.size}`,
        name:  `${cartBtn.dataset.productName} — ${selectedSize.dataset.size}`,
        price: parseFloat(cartBtn.dataset.productPrice),
        size:  selectedSize.dataset.size,
        image: cartBtn.dataset.productImage,
      });

      picker.classList.remove('open');
      picker.setAttribute('aria-hidden', 'true');
      picker.querySelectorAll('.size-option').forEach(b => b.classList.remove('selected'));
      picker.querySelector('.size-error').textContent = '';
      cartBtn.textContent = 'Add to cart';
    });

  } catch (err) {
    grid.innerHTML = `<p class="products-error">Could not load products. Please try again.</p>`;
    console.error('[Home] Failed to load products:', err);
  }
}