import Cart from "./components/cart.js";
import { nav } from "./components/nav.js";
import { renderFeaturedProducts } from "./pages/home.js";

renderFeaturedProducts();
nav()
Cart.init();


// Boot shop filter only when on the shop page
if (document.querySelector('.filter-btn')) {
  import('./pages/shop.js').then(m => m.default.init());
}