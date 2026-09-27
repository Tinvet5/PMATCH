
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

const featuredPlugins = [
  { name: 'FRONTIER - D16 GROUP', meta: 'Limiter · Free', image: 'frontier.png', href: 'plugins.html?familia=limitadores' },
  { name: 'FET-76 - ARTURIA', meta: 'Compresor · FET', image: 'fet76-arturia.png', href: 'module.html?id=fet76-arturia' },
  { name: 'PULSAR SMASHER - PULSAR AUDIO', meta: 'Compresor · FET', image: 'pulsar-smasher.png', href: 'plugins.html?familia=compresores&subgrupo=FET' }
];

async function initHome() {
  const Catalog = window.PluginMatchPublicCatalog;
  const grid = $('#categoryGrid');
  if (!grid || !Catalog) return;

  const modules = await Catalog.getModules();
  let searchTerm = '';

  function cardMarkup(family) {
    return `
      <a class="category-card dynamic-category-card" href="plugins.html?familia=${encodeURIComponent(family.key)}" aria-label="Abrir ${family.label}">
        <img src="assets/${family.image}" alt="${family.label}" loading="lazy" />
        <span class="category-count">${family.count} módulos</span>
      </a>`;
  }

  function categoryColumnCount() {
    if (window.innerWidth <= 720) return 1;
    if (window.innerWidth <= 980) return 2;
    return 4;
  }

  function renderCategories() {
    const normalized = Catalog.normalize(searchTerm);
    let families = Catalog.familyStats(modules);
    if (normalized) {
      const matchingFamilyKeys = new Set(
        modules
          .filter(module => Catalog.searchText(module).includes(normalized))
          .map(Catalog.familyKey)
      );
      families = families.filter(
        family => matchingFamilyKeys.has(family.key) || Catalog.normalize(family.label).includes(normalized)
      );
    }

    const columns = Array.from({ length: categoryColumnCount() }, () => []);
    families.forEach((family, index) => columns[index % columns.length].push(family));
    grid.innerHTML = columns
      .filter(column => column.length)
      .map(column => `<div class="category-column">${column.map(cardMarkup).join('')}</div>`)
      .join('');
    $('#emptyState').hidden = families.length !== 0;
  }

  renderCategories();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderCategories, 120);
  });

  const search = $('#globalSearch');
  search?.addEventListener('input', event => {
    searchTerm = event.target.value;
    renderCategories();
  });

  let featuredIndex = 0;
  const card = $('#featuredCard');
  const stage = $('#featuredStage');
  const image = $('#featuredImage');
  const name = $('#featuredName');
  const meta = $('#featuredMeta');
  const pagination = $('#featuredPagination');

  function commitFeatured() {
    const plugin = featuredPlugins[featuredIndex];
    image.src = `assets/${plugin.image}`;
    image.alt = plugin.name;
    name.textContent = plugin.name;
    meta.textContent = plugin.meta;
    card.dataset.href = plugin.href;
    renderPagination();
  }

  function renderPagination() {
    if (!pagination) return;
    pagination.innerHTML = featuredPlugins.map((plugin, index) => `
      <button type="button"
        class="${index === featuredIndex ? 'active' : ''}"
        aria-label="Ver ${plugin.name}"
        aria-current="${index === featuredIndex ? 'true' : 'false'}"
        data-featured-index="${index}"></button>
    `).join('');
    $$('[data-featured-index]', pagination).forEach(button => {
      button.addEventListener('click', () => {
        featuredIndex = Number(button.dataset.featuredIndex);
        renderFeatured();
      });
    });
  }

  function renderFeatured() {
    card.classList.add('is-changing');
    setTimeout(() => {
      commitFeatured();
      requestAnimationFrame(() => card.classList.remove('is-changing'));
    }, 100);
  }

  function shiftFeatured(direction) {
    featuredIndex = (featuredIndex + direction + featuredPlugins.length) % featuredPlugins.length;
    renderFeatured();
  }

  $('#featuredPrev')?.addEventListener('click', () => shiftFeatured(-1));
  $('#featuredNext')?.addEventListener('click', () => shiftFeatured(1));

  let dragStartX = null;
  stage?.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragStartX = event.clientX;
  });
  stage?.addEventListener('pointerup', event => {
    if (dragStartX === null) return;
    const delta = event.clientX - dragStartX;
    dragStartX = null;
    if (Math.abs(delta) < 42) return;
    shiftFeatured(delta > 0 ? -1 : 1);
  });
  stage?.addEventListener('pointercancel', () => { dragStartX = null; });

  card?.addEventListener('click', () => {
    if (card.dataset.href) location.href = card.dataset.href;
  });
  card?.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && card.dataset.href) {
      event.preventDefault();
      location.href = card.dataset.href;
    }
  });

  commitFeatured();
}

if (document.body.dataset.page === 'home') {
  initHome().catch(error => {
    console.error(error);
    showToast('No se pudo cargar el catálogo público.');
  });
}
