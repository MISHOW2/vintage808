// ─── Open / Close ─────────────────────────────────────────────

export function openDrawer() {
  document.getElementById('cart-drawer')?.classList.add('open');
  document.getElementById('cart-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeDrawer() {
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}


// ─── Bind Controls ───────────────────────────────────────────

function bindDrawerControls() {
  // Click overlay → close
  document.getElementById('cart-overlay')?.addEventListener('click', closeDrawer);

  // Click close button → close
  document.getElementById('cart-drawer-close')?.addEventListener('click', closeDrawer);

  // Press ESC → close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
}


// ─── Bind Cart Icon ──────────────────────────────────────────

function bindCartIcons() {
  document.querySelectorAll('[aria-label="Cart"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openDrawer();
    });
  });
}


// ─── Init ───────────────────────────────────────────────────

export function init() {
  bindDrawerControls();
  bindCartIcons();
}

export default { init, openDrawer, closeDrawer };