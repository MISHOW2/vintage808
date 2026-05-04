// js/pages/home.js  (or wherever renderFeaturedProducts lives)
import { getAllProducts } from '../api/products.js';
import { showSkeletons } from '../utils/skeleton.js';
import { buildCard, initSlider, bindGridEvents } from '../components/productCard.js';

export async function renderFeaturedProducts() {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;

  showSkeletons(grid, 8);

  try {
    const response = await getAllProducts();
    const products = response.data || response;
    const featured = products.filter(p => p.isFeatured).slice(0, 8);
    // fallback: if no featured products just show first 8
    const items    = featured.length ? featured : products.slice(0, 8);

    grid.innerHTML = items.map(p => buildCard(p)).join('');

    // Clone to avoid stale listeners, then bind fresh
    const newGrid = grid.cloneNode(true);
    grid.parentNode.replaceChild(newGrid, grid);
    newGrid.querySelectorAll('.product-card').forEach(card => initSlider(card));

    // Keep a reference for stock lookups inside the event handler
    window._v808_home_products = items;
    bindGridEvents(newGrid, items);

  } catch (err) {
    grid.innerHTML = `<p class="products-error">Could not load products. Please try again.</p>`;
    console.error('[Home] Failed to load products:', err);
  }
}