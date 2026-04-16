export function nav() {
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

  // ✅ MAKE IT GLOBAL (this is the key)
  window.closeNavDrawer = closeMenu;

  burger.addEventListener('click', () => {
    burger.classList.contains('open') ? closeMenu() : openMenu();
  });

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });
}