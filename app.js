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
  { name: 'FET-76 - ARTURIA', meta: 'Compressor · FET', image: 'fet76-arturia.png', href: 'module.html?id=fet76-arturia' },
  { name: 'PULSAR SMASHER - PULSAR AUDIO', meta: 'Compressor · FET', image: 'pulsar-smasher.png', href: 'compressors.html' },
];

const compressorPlugins = [
  { name: 'MKII - SOFTUBE', image: 'mkii-softube.png', subtype: 'fet' },
  { name: 'FET-A76 - ANTELOPE', image: 'fet-a76.png', subtype: 'fet' },
  { name: 'PULSAR SMASHER - PULSAR AUDIO', image: 'pulsar-smasher.png', subtype: 'fet' },
  { name: '1176 COLLECTION - UNIVERSAL AUDIO', image: '1176-collection.png', subtype: 'fet' },
  { name: 'FET-76 - ARTURIA', image: 'fet76-arturia.png', subtype: 'fet', href: 'module.html?id=fet76-arturia', featured: true },
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

  function cardMarkup(cat) {
    return `
      <button class="category-card" type="button" data-href="${cat.href || ''}" data-name="${cat.name}" aria-label="Abrir ${cat.name}">
        <img src="assets/${cat.image}" alt="${cat.name}" loading="lazy" />
      </button>
    `;
  }

  function renderCategories() {
    const filtered = categories.filter(cat => {
      const matchesSearch = cat.name.toLowerCase().includes(searchTerm);
      const matchesFilter = activeFilter === 'all' || cat.tags.includes(activeFilter);
      return matchesSearch && matchesFilter;
    });

    // The Canva composition is a four-column masonry layout. Keeping the
    // original row-major ordering while distributing every fourth item into
    // one column reproduces that composition much more closely than a rigid grid.
    const columnCount = window.innerWidth <= 720 ? 1 : window.innerWidth <= 1050 ? 2 : 4;
    const columns = Array.from({ length: columnCount }, () => []);
    filtered.forEach((cat, index) => columns[index % columnCount].push(cat));

    grid.innerHTML = columns
      .filter(column => column.length)
      .map(column => `<div class="category-column">${column.map(cardMarkup).join('')}</div>`)
      .join('');

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

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderCategories, 120);
  });

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
  let featuredTimer;
  const image = $('#featuredImage');
  const name = $('#featuredName');
  const meta = $('#featuredMeta');
  const card = $('#featuredCard');

  function commitFeatured() {
    const plugin = featuredPlugins[featuredIndex];
    image.src = `assets/${plugin.image}`;
    image.alt = plugin.name;
    name.textContent = plugin.name;
    meta.textContent = plugin.meta;
    card.dataset.href = plugin.href;
  }

  function renderFeatured(direction = 1) {
    if (!card) return;
    card.classList.add('is-changing');
    clearTimeout(featuredTimer);
    featuredTimer = setTimeout(() => {
      commitFeatured();
      requestAnimationFrame(() => card.classList.remove('is-changing'));
    }, 120);
  }

  $('#featuredPrev')?.addEventListener('click', () => {
    featuredIndex = (featuredIndex - 1 + featuredPlugins.length) % featuredPlugins.length;
    renderFeatured(-1);
  });
  $('#featuredNext')?.addEventListener('click', () => {
    featuredIndex = (featuredIndex + 1) % featuredPlugins.length;
    renderFeatured(1);
  });
  card?.addEventListener('click', () => {
    if (card.dataset.href) window.location.href = card.dataset.href;
  });
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

  function clearActive() {
    $$('.hotspot', wrap).forEach(point => point.classList.remove('active'));
    $$('.diagram-callout', wrap).forEach(callout => callout.classList.remove('is-active'));
  }

  function openControl(hotspot) {
    if (!hotspot) return;
    clearActive();
    hotspot.classList.add('active');
    const control = hotspot.dataset.control;
    $(`.diagram-callout[data-target="${control}"]`, wrap)?.classList.add('is-active');

    title.textContent = hotspot.dataset.title;
    body.textContent = hotspot.dataset.body;
    tooltip.hidden = false;

    if (window.innerWidth > 1050) {
      const frame = $('.plugin-image-frame', wrap);
      const frameRect = frame.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      const x = frameRect.left - wrapRect.left + frameRect.width * (parseFloat(getComputedStyle(hotspot).getPropertyValue('--x')) / 100);
      const y = frameRect.top - wrapRect.top + frameRect.height * (parseFloat(getComputedStyle(hotspot).getPropertyValue('--y')) / 100);
      const left = Math.min(Math.max(x, 175), wrapRect.width - 175);
      const top = y > wrapRect.height * .58 ? Math.max(y - 125, 12) : Math.min(y + 24, wrapRect.height - 120);
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.style.transform = 'translateX(-50%)';
    } else {
      const x = parseFloat(getComputedStyle(hotspot).getPropertyValue('--x'));
      const y = parseFloat(getComputedStyle(hotspot).getPropertyValue('--y'));
      tooltip.style.left = `${Math.min(Math.max(x, 25), 75)}%`;
      tooltip.style.top = `${y > 55 ? Math.max(y - 36, 2) : Math.min(y + 10, 72)}%`;
      tooltip.style.transform = 'translateX(-50%)';
    }
  }

  $$('.hotspot', wrap).forEach(hotspot => {
    hotspot.addEventListener('click', event => {
      event.stopPropagation();
      openControl(hotspot);
    });
  });

  $$('.diagram-callout', wrap).forEach(callout => {
    callout.addEventListener('click', event => {
      event.stopPropagation();
      const hotspot = $(`.hotspot[data-control="${callout.dataset.target}"]`, wrap);
      openControl(hotspot);
    });
  });

  document.addEventListener('click', event => {
    if (!tooltip.contains(event.target)) {
      tooltip.hidden = true;
      clearActive();
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
