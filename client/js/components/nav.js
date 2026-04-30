// js/components/nav.js

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

  // ── Highlight active nav link ─────────────────────────────
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-drawer-links a').forEach(link => {
    const linkPage = link.getAttribute('href')?.split('/').pop();
    if (linkPage === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}



// js/nav.js
// Drop this script into every account page.
// On desktop (>860px): switches tabs in place.
// On mobile (≤860px): navigates to a separate HTML page.

const MOBILE_BREAKPOINT = 860;

const PAGE_MAP = {
  profile:     '/client/account.html',
  orders:      '/client/pages/account-page/orders.html',
  addresses:   '/client/pages/account-page/addresses.html',
  returns:     '/client/pages/account-page/returns.html',
  wishlist:    '/client/pages/account-page/wishlist.html',
  preferences: '/client/pages/account-page/preferences.html',
};

function isMobile() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

// Called by each nav button: data-tab="orders" etc.
function handleNav(tab) {
  if (isMobile() && tab !== 'profile') {
    window.location.href = PAGE_MAP[tab];
  } else {
    switchTab(tab);
  }
}

// Desktop tab switching (only runs on account.html)
function switchTab(tab) {
  // tabs use id="tab-orders" etc.
  document.querySelectorAll('.account-tab').forEach(el => {
    el.classList.toggle('active', el.id === 'tab-' + tab);
  });
  document.querySelectorAll('.account-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
}
// Wire up all nav buttons once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.account-nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => handleNav(btn.dataset.tab));
  });

  // On desktop account.html, activate the right tab from URL hash
  // e.g. /account.html#orders opens the orders tab automatically
  if (!isMobile()) {
    const hash = window.location.hash.replace('#', '');
    if (hash && PAGE_MAP[hash]) switchTab(hash);
  }

  // Mark the active nav item on standalone pages (mobile)
  // Each page sets <body data-page="orders"> etc.
  const currentPage = document.body.dataset.page;
  if (currentPage) {
    document.querySelectorAll('.account-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === currentPage);
    });
  }
});