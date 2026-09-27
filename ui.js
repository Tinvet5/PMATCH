
(() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  function setMenu(open) {
    const panel = $('#mobileNavPanel');
    const button = $('#mobileMenuButton');
    if (!panel || !button) return;
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('mobile-nav-open', open);
    if (open) requestAnimationFrame(() => panel.querySelector('a,button,input')?.focus());
  }

  $('#mobileMenuButton')?.addEventListener('click', () => {
    setMenu($('#mobileMenuButton').getAttribute('aria-expanded') !== 'true');
  });
  $('#mobileNavClose')?.addEventListener('click', () => setMenu(false));
  $('#mobileNavPanel')?.addEventListener('click', event => {
    if (event.target.matches('[data-mobile-nav-dismiss]')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setMenu(false);
  });

  $$('[data-catalog-search]').forEach(input => {
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      const query = input.value.trim();
      if (!query || document.body.dataset.page === 'catalog') return;
      location.href = `plugins.html?q=${encodeURIComponent(query)}`;
    });
  });

  $$('[data-account-placeholder]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      const toast = $('#toast');
      if (!toast) return;
      toast.textContent = 'CUENTAS · PRÓXIMAMENTE';
      toast.classList.add('show');
      clearTimeout(window.__pmAccountToast);
      window.__pmAccountToast = setTimeout(() => toast.classList.remove('show'), 1800);
    });
  });
})();
