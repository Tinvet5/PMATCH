
(() => {
  const Catalog = window.PluginMatchPublicCatalog;
  const $ = selector => document.querySelector(selector);
  let modules = [];

  const state = {
    q: '',
    family: '',
    type: '',
    subgroup: '',
    developer: '',
    sort: 'name'
  };

  function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
  }

  function optionMarkup(value, label = value) {
    return `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`;
  }

  function hydrateFromURL() {
    const params = new URLSearchParams(location.search);
    state.q = params.get('q') || '';
    state.family = params.get('familia') || '';
    state.type = params.get('tipo') || '';
    state.subgroup = params.get('subgrupo') || '';
    state.developer = params.get('desarrollador') || '';
  }

  function syncURL() {
    const params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.family) params.set('familia', state.family);
    if (state.type) params.set('tipo', state.type);
    if (state.subgroup) params.set('subgrupo', state.subgroup);
    if (state.developer) params.set('desarrollador', state.developer);
    const query = params.toString();
    history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}`);
  }

  function populateFilters() {
    const familySelect = $('#familyFilter');
    familySelect.innerHTML = '<option value="">TODAS</option>' + Catalog.familyStats(modules)
      .map(item => optionMarkup(item.key, `${item.label} (${item.count})`)).join('');

    $('#typeFilter').innerHTML = '<option value="">TODOS</option>' + Catalog.uniqueValues(modules, 'type').map(optionMarkup).join('');
    $('#subgroupFilter').innerHTML = '<option value="">TODOS</option>' + Catalog.uniqueValues(modules, 'subgroup').map(optionMarkup).join('');
    $('#developerFilter').innerHTML = '<option value="">TODOS</option>' + Catalog.uniqueValues(modules, 'developer').map(optionMarkup).join('');

    $('#catalogSearch').value = state.q;
    $('#catalogHeaderSearch').value = state.q;
    familySelect.value = state.family;
    $('#typeFilter').value = state.type;
    $('#subgroupFilter').value = state.subgroup;
    $('#developerFilter').value = state.developer;
  }

  function filterModules() {
    const q = Catalog.normalize(state.q);
    return modules.filter(module => {
      if (state.family && Catalog.familyKey(module) !== state.family) return false;
      if (state.type && module.category !== state.type) return false;
      if (state.subgroup && module.subtype !== state.subgroup) return false;
      if (state.developer && module.developer !== state.developer) return false;
      if (q && !Catalog.searchText(module).includes(q)) return false;
      return true;
    });
  }

  function sortModules(list) {
    const copy = [...list];
    const collator = new Intl.Collator('es', { sensitivity: 'base' });
    if (state.sort === 'developer') {
      return copy.sort((a, b) => collator.compare(a.developer, b.developer) || collator.compare(a.name, b.name));
    }
    if (state.sort === 'type') {
      return copy.sort((a, b) => collator.compare(a.category, b.category) || collator.compare(a.name, b.name));
    }
    return copy.sort((a, b) => collator.compare(a.name, b.name));
  }

  function cardMarkup(module) {
    const family = Catalog.familyFor(module);
    const hasRealImage = Boolean(module.image?.src);
    const imageSrc = hasRealImage ? module.image.src : Catalog.fallbackImage(module);
    const meta = [module.category, module.subtype].filter(Boolean).join(' · ');
    const description = String(module.description || '').trim();
    return `
      <article class="plugin-catalog-card">
        <a class="plugin-card-visual" href="module.html?id=${encodeURIComponent(module.id)}" aria-label="Abrir ${escapeHTML(module.name)}">
          <img src="${escapeHTML(imageSrc)}" alt="${escapeHTML(hasRealImage ? `Interfaz de ${module.name}` : family.label)}" loading="lazy" />
          ${hasRealImage ? '' : '<span class="image-pending-badge">IMAGEN PENDIENTE</span>'}
        </a>
        <div class="plugin-card-copy">
          <div class="plugin-card-eyebrow">${escapeHTML(module.developer || 'DESARROLLADOR')}</div>
          <h2><a href="module.html?id=${encodeURIComponent(module.id)}">${escapeHTML(module.name)}</a></h2>
          <p class="plugin-card-meta">${escapeHTML(meta || family.label)}</p>
          <p class="plugin-card-description">${escapeHTML(description)}</p>
          <div class="plugin-card-footer">
            <span>${escapeHTML(family.label)}</span>
            <a href="module.html?id=${encodeURIComponent(module.id)}">VER MÓDULO →</a>
          </div>
        </div>
      </article>`;
  }

  function activeFilterEntries() {
    const family = Catalog.FAMILY_DEFINITIONS.find(item => item.key === state.family);
    return [
      state.q ? { key: 'q', label: `“${state.q}”` } : null,
      state.family ? { key: 'family', label: family?.label || state.family } : null,
      state.type ? { key: 'type', label: state.type } : null,
      state.subgroup ? { key: 'subgroup', label: state.subgroup } : null,
      state.developer ? { key: 'developer', label: state.developer } : null
    ].filter(Boolean);
  }

  function clearStateKey(key) {
    state[key] = '';
    if (key === 'q') {
      $('#catalogSearch').value = '';
      $('#catalogHeaderSearch').value = '';
    } else {
      const selectors = {
        family: '#familyFilter',
        type: '#typeFilter',
        subgroup: '#subgroupFilter',
        developer: '#developerFilter'
      };
      if (selectors[key]) $(selectors[key]).value = '';
    }
    render();
  }

  function renderActiveFilters() {
    const entries = activeFilterEntries();
    $('#mobileFilterCount').textContent = entries.length;
    const chips = $('#activeFilterChips');
    chips.innerHTML = entries.map(item => `
      <span class="active-filter-chip">
        ${escapeHTML(item.label)}
        <button type="button" data-clear-filter="${item.key}" aria-label="Quitar filtro ${escapeHTML(item.label)}">×</button>
      </span>
    `).join('');
    chips.querySelectorAll('[data-clear-filter]').forEach(button => {
      button.addEventListener('click', () => clearStateKey(button.dataset.clearFilter));
    });
  }

  function render() {
    const filtered = sortModules(filterModules());
    $('#catalogResultCount').textContent = filtered.length;
    $('#pluginCatalogGrid').innerHTML = filtered.map(cardMarkup).join('');
    $('#catalogEmpty').hidden = filtered.length !== 0;
    $('#catalogSummary').textContent = `${modules.length} módulos · ${Catalog.uniqueValues(modules, 'developer').length} desarrolladores · catálogo generado desde Excel`;
    renderActiveFilters();
    syncURL();
  }

  function setMobileFilters(open) {
    const sidebar = $('#catalogSidebar');
    const button = $('#openMobileFilters');
    sidebar.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('catalog-filters-open', open);
    if (open) requestAnimationFrame(() => $('#catalogSearch')?.focus());
  }

  function bind() {
    const pairedSearch = [$('#catalogSearch'), $('#catalogHeaderSearch')];
    pairedSearch.forEach(input => input.addEventListener('input', event => {
      state.q = event.target.value;
      pairedSearch.forEach(other => { if (other !== event.target) other.value = state.q; });
      render();
    }));

    const mappings = [
      ['#familyFilter', 'family'],
      ['#typeFilter', 'type'],
      ['#subgroupFilter', 'subgroup'],
      ['#developerFilter', 'developer'],
      ['#sortCatalog', 'sort']
    ];
    mappings.forEach(([selector, key]) => $(selector).addEventListener('change', event => {
      state[key] = event.target.value;
      render();
    }));

    $('#clearCatalogFilters').addEventListener('click', () => {
      state.q = '';
      state.family = '';
      state.type = '';
      state.subgroup = '';
      state.developer = '';
      populateFilters();
      render();
    });

    $('#openMobileFilters')?.addEventListener('click', () => setMobileFilters(true));
    $('#closeMobileFilters')?.addEventListener('click', () => setMobileFilters(false));
    $('#applyMobileFilters')?.addEventListener('click', () => setMobileFilters(false));

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') setMobileFilters(false);
    });

    $('#catalogSidebar')?.addEventListener('click', event => {
      if (event.target === $('#catalogSidebar')) setMobileFilters(false);
    });
  }

  async function init() {
    hydrateFromURL();
    modules = await Catalog.getModules();
    populateFilters();
    bind();
    render();
  }

  init().catch(error => {
    console.error(error);
    $('#catalogSummary').textContent = 'No se pudo cargar el catálogo.';
  });
})();
