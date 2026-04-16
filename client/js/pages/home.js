import { getAllProducts, IMAGE_BASE_URL } from "../api/products.js";
import { addToCart } from "../components/cart.js";

export async function renderFeaturedProducts() {
  const grid = document.querySelector(".product-grid");
  if (!grid) return;

  try {
    const response = await getAllProducts();
    const featured = response.data.slice(0, 8);

    grid.innerHTML = "";

    featured.forEach(product => {
      const isNew = product.isNew ?? false;
      const rawImage = Array.isArray(product.images) ? product.images[0] : product.image ?? "";
      const imageSrc = rawImage ? `${IMAGE_BASE_URL}${rawImage}` : "";
      const price = typeof product.price === "number" ? product.price : parseFloat(product.price);
      const displayPrice = `R${price.toFixed(2)}`;

      grid.innerHTML += `
        <div class="product-card">
          <div class="product-image">
            ${isNew ? `<span class="product-badge sale">New</span>` : ""}
            <img src="${imageSrc}" alt="${product.name}" loading="lazy" />
          </div>
          <div class="product-info">
            <p class="product-name">${product.name}</p>
            <span class="product-price">${displayPrice}</span>
          </div>
          <button
            class="btn-cart"
            data-product-id="${product.id}"
            data-product-name="${product.name}"
            data-product-price="${price}"
            data-product-image="${imageSrc}"
          >
            Add to cart
          </button>
        </div>
      `;
    });

    // ── Single delegated listener on the grid ──
    grid.addEventListener('click', e => {
      const btn = e.target.closest('.btn-cart');
      if (!btn) return;

      addToCart({
        id:    btn.dataset.productId,
        name:  btn.dataset.productName,
        price: parseFloat(btn.dataset.productPrice),
        image: btn.dataset.productImage,
      });
    });

  } catch (err) {
    console.error("[Home] Failed to load products:", err);
  }
}