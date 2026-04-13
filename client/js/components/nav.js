/* ============================================================
   Vintage808 — nav.js
   Save as ./js/nav.js
   Already linked in index.html as:
     <script src="./js/nav.js" defer></script>
   ============================================================ */

(function () {
  const burger = document.querySelector('.nav-burger');
  const drawer = document.querySelector('.nav-drawer');

  if (!burger || !drawer) return;

  function openMenu() {
    burger.classList.add('open');
    drawer.classList.add('open');
    document.body.classList.add('nav-open');
    burger.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    burger.classList.remove('open');
    drawer.classList.remove('open');
    document.body.classList.remove('nav-open');
    burger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
  }

  burger.addEventListener('click', function () {
    burger.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Close when a drawer link is tapped
  drawer.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  // Close if screen is resized back to desktop width
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) closeMenu();
  });
})();