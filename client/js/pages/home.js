import { getAllProducts } from "../api/products.js";

// ✅ Asset base (NO /api here)
const ASSET_BASE_URL = "https://vintage808-api.vercel.app/";

export async function renderFeaturedProducts() {
  const grid = document.querySelector(".product-grid");
  if (!grid) return;

  try {
    const products = await getAllProducts();
    const featured = products.slice(0, 8);

    grid.innerHTML = "";

    featured.forEach(product => {
      const isNew = product.isNew ?? false;

      // ✅ Get raw path from API data
      const rawImage = Array.isArray(product.images)
        ? product.images[0]
        : product.image ?? "";

      // ✅ Build FULL image URL
      const imageSrc = rawImage
        ? `${ASSET_BASE_URL}${rawImage}`
        : "";

      const price =
        typeof product.price === "number"
          ? `R${product.price.toFixed(2)}`
          : product.price;

      grid.innerHTML += `
        <div class="product-card">
          <div class="product-image">
            ${isNew ? `<span class="product-badge sale">New</span>` : ""}
            <img src="${imageSrc}" alt="${product.name}" loading="lazy" />
          </div>
          <div class="product-info">
            <p class="product-name">${product.name}</p>
            <span class="product-price">${price}</span>
          </div>
          <button class="btn-cart" data-product-id="${product.id}">
            Add to cart
          </button>
        </div>
      `;
    });
  } catch (err) {
    console.error("[Home] Failed to load products:", err);
  }
}