const categories = [
  { name: 'COMPRESORES', image: 'compressors.png', href: 'compressors.html', tags: ['type','rating'] },
  { name: 'REVERBS', image: 'reverbs.png', tags: ['type','free'] },
  { name: 'CHANNEL STRIP', image: 'channel-strip.png', tags: ['type','recent'] },
  { name: 'DELAYS', image: 'delays.png', tags: ['type','brand'] },
  { name: 'ECUALIZADORES', image: 'eq.png', tags: ['type','rating'] },
  { name: 'PHASERS', image: 'phasers.png', tags: ['type','free'] },
  { name: 'DISTORSIONES', image: 'distortion.png', tags: ['type','recent'] },
  { name: 'LO-FI FX', image: 'lofi.png', tags: ['type','brand'] },
  { name: 'LIMITADORES', image: 'limiters.png', tags: ['type','free'] },
  { name: 'ANALIZADORES', image: 'analyzers.png', tags: ['type','rating'] },
  { name: 'VIRTUAL INSTRUMENTS', image: 'virtual-instruments.png', tags: ['type','recent'] },
  { name: 'SYNTHESIZERS', image: 'synthesizers.png', tags: ['type','brand'] },
  { name: 'AUTOTUNE', image: 'autotune.png', tags: ['type','rating'] },
  { name: 'GATES', image: 'gates.png', tags: ['type','free'] },
  { name: 'ECHOES', image: 'echoes.png', tags: ['type','recent'] },
  { name: 'SATURADORES', image: 'saturators.png', tags: ['type','brand'] },
];

const featuredPlugins = [
  { name: 'FRONTIER - D16 GROUP', meta: 'Limiter · Free', image: 'frontier.png', href: 'compressors.html' },
  { name: 'FET-76 - ARTURIA', meta: 'Compressor · FET', image: 'fet76-arturia.png', href: 'plugin.html' },
  { name: 'PULSAR SMASHER - PULSAR AUDIO', meta: 'Compressor · FET', image: 'pulsar-smasher.png', href: 'compressors.html' },
];

const compressorPlugins = [
  { name: 'MKII - SOFTUBE', image: 'mkii-softube.png', subtype: 'fet' },
  { name: 'FET-A76 - ANTELOPE', image: 'fet-a76.png', subtype: 'fet' },
  { name: 'PULSAR SMASHER - PULSAR AUDIO', image: 'pulsar-smasher.png', subtype: 'fet' },
  { name: '1176 COLLECTION - UNIVERSAL AUDIO', image: '1176-collection.png', subtype: 'fet' },
  { name: 'FET-76 - ARTURIA', image: 'fet76-arturia.png', subtype: 'fet', href: 'plugin.html', featured: true },
  { name: 'FET COMPRESSOR - SOFTUBE', image: 'fet-compressor-softube.png', subtype: 'fet' },
];

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

function initHome() {
  const grid = $('#categoryGrid');
  if (!grid) return;

  let activeFilter = 'all';
  let searchTerm = '';

  function renderCategories() {
    const filtered = categories.filter(cat => {
      const matchesSearch = cat.name.toLowerCase().includes(searchTerm);
      const matchesFilter = activeFilter === 'all' || cat.tags.includes(activeFilter);
      return matchesSearch && matchesFilter;
    });

    grid.innerHTML = filtered.map(cat => `
      <button class="category-card" type="button" data-href="${cat.href || ''}" data-name="${cat.name}">
        <img src="assets/${cat.image}" alt="${cat.name}" loading="lazy" />
        <span class="category-name">${cat.name}</span>
      </button>
    `).join('');

    $('#emptyState').hidden = filtered.length !== 0;

    $$('.category-card', grid).forEach(card => {
      card.addEventListener('click', () => {
        const href = card.dataset.href;
        if (href) window.location.href = href;
        else showToast(`${card.dataset.name}: sección preparada para añadir contenido.`);
      });
    });
  }

  renderCategories();

  $$('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.filter-tab').forEach(btn => btn.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.dataset.filter;
      renderCategories();
    });
  });

  $('#globalSearch')?.addEventListener('input', e => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderCategories();
  });

  let featuredIndex = 0;
  const image = $('#featuredImage');
  const name = $('#featuredName');
  const meta = $('#featuredMeta');
  const card = $('#featuredCard');

  function renderFeatured() {
    const plugin = featuredPlugins[featuredIndex];
    image.src = `assets/${plugin.image}`;
    image.alt = plugin.name;
    name.textContent = plugin.name;
    meta.textContent = plugin.meta;
    card.dataset.href = plugin.href;
  }

  $('#featuredPrev')?.addEventListener('click', () => {
    featuredIndex = (featuredIndex - 1 + featuredPlugins.length) % featuredPlugins.length;
    renderFeatured();
  });
  $('#featuredNext')?.addEventListener('click', () => {
    featuredIndex = (featuredIndex + 1) % featuredPlugins.length;
    renderFeatured();
  });
  card?.addEventListener('click', () => { if (card.dataset.href) window.location.href = card.dataset.href; });
  card?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (card.dataset.href) window.location.href = card.dataset.href;
    }
  });
}

function initCompressors() {
  const list = $('#pluginList');
  if (!list) return;
  let subtype = 'fet';
  let search = '';

  function renderPlugins() {
    const filtered = compressorPlugins.filter(plugin => {
      const subtypeMatch = subtype === 'all' || plugin.subtype === subtype;
      const searchMatch = plugin.name.toLowerCase().includes(search);
      return subtypeMatch && searchMatch;
    });

    list.innerHTML = filtered.map(plugin => `
      <button class="plugin-list-item ${plugin.featured ? 'featured' : ''}" type="button" data-href="${plugin.href || ''}" data-name="${plugin.name}">
        <img src="assets/${plugin.image}" alt="${plugin.name}" loading="lazy" />
        <span class="plugin-list-name">${plugin.name}</span>
      </button>
    `).join('');

    $('#pluginEmpty').hidden = filtered.length !== 0;

    $$('.plugin-list-item', list).forEach(item => {
      item.addEventListener('click', () => {
        if (item.dataset.href) window.location.href = item.dataset.href;
        else showToast(`${item.dataset.name}: ficha todavía no añadida.`);
      });
    });
  }

  renderPlugins();

  $$('.subtype-button').forEach(button => {
    button.addEventListener('click', () => {
      $$('.subtype-button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      subtype = button.dataset.subtype;
      renderPlugins();
    });
  });

  $('#categorySearch')?.addEventListener('input', e => {
    search = e.target.value.trim().toLowerCase();
    renderPlugins();
  });
}

function initPluginDetail() {
  const wrap = $('#diagramWrap');
  const tooltip = $('#hotspotTooltip');
  if (!wrap || !tooltip) return;

  const title = $('#tooltipTitle');
  const body = $('#tooltipBody');

  $$('.hotspot', wrap).forEach(hotspot => {
    hotspot.addEventListener('click', event => {
      event.stopPropagation();
      $$('.hotspot', wrap).forEach(point => point.classList.remove('active'));
      hotspot.classList.add('active');
      title.textContent = hotspot.dataset.title;
      body.textContent = hotspot.dataset.body;
      tooltip.hidden = false;

      const x = parseFloat(getComputedStyle(hotspot).getPropertyValue('--x'));
      const y = parseFloat(getComputedStyle(hotspot).getPropertyValue('--y'));
      const left = Math.min(Math.max(x, 18), 82);
      const top = y > 55 ? Math.max(y - 34, 4) : Math.min(y + 10, 74);
      tooltip.style.left = `${left}%`;
      tooltip.style.top = `${top}%`;
      tooltip.style.transform = 'translateX(-50%)';
    });
  });

  document.addEventListener('click', event => {
    if (!tooltip.contains(event.target)) {
      tooltip.hidden = true;
      $$('.hotspot', wrap).forEach(point => point.classList.remove('active'));
    }
  });

  $('#downloadBtn')?.addEventListener('click', () => {
    showToast('Añade aquí el enlace oficial del desarrollador antes de publicar.');
  });
}

const page = document.body.dataset.page;
if (page === 'home') initHome();
if (page === 'compressors') initCompressors();
if (page === 'plugin') initPluginDetail();
