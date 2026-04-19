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

      // Build size buttons from API data
      const sizes = Array.isArray(product.sizes) ? product.sizes : [];
      const sizeBtns = sizes.map(size => `
        <button class="size-option" data-size="${size}">${size}</button>
      `).join("");

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

          <!-- Size picker — hidden until user clicks Add to Cart -->
          <div class="size-picker" aria-hidden="true">
            <p class="size-picker-label">Select a size</p>
            <div class="size-options">${sizeBtns}</div>
            <p class="size-error" aria-live="polite"></p>
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

    // ── Event delegation on grid ──────────────────────────────────
    grid.addEventListener("click", e => {

      // 1. Size option selected
      const sizeBtn = e.target.closest(".size-option");
      if (sizeBtn) {
        const picker = sizeBtn.closest(".size-picker");
        picker.querySelectorAll(".size-option").forEach(b => b.classList.remove("selected"));
        sizeBtn.classList.add("selected");
        picker.querySelector(".size-error").textContent = "";
        return;
      }

      // 2. Add to Cart clicked
      const cartBtn = e.target.closest(".btn-cart");
      if (!cartBtn) return;

      const card = cartBtn.closest(".product-card");
      const picker = card.querySelector(".size-picker");
      const selectedSize = picker.querySelector(".size-option.selected");

      // If picker not open yet — open it
      if (!picker.classList.contains("open")) {
        picker.classList.add("open");
        picker.setAttribute("aria-hidden", "false");
        cartBtn.textContent = "Confirm";
        return;
      }

      // Picker open but no size chosen
      if (!selectedSize) {
        picker.querySelector(".size-error").textContent = "Please select a size";
        return;
      }

      // All good — add to cart
addToCart({
  id:    `${cartBtn.dataset.productId}-${selectedSize.dataset.size}`,
  name:  `${cartBtn.dataset.productName} — ${selectedSize.dataset.size}`,
  price: parseFloat(cartBtn.dataset.productPrice),
  size:  selectedSize.dataset.size,
  image: cartBtn.dataset.productImage,
});

      // Reset card state
      picker.classList.remove("open");
      picker.setAttribute("aria-hidden", "true");
      picker.querySelectorAll(".size-option").forEach(b => b.classList.remove("selected"));
      picker.querySelector(".size-error").textContent = "";
      cartBtn.textContent = "Add to cart";
    });

  } catch (err) {
    console.error("[Home] Failed to load products:", err);
  }
}