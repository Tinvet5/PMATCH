
(() => {
  const Catalog = window.PluginMatchPublicCatalog;
  const $ = s => document.querySelector(s);
  const root = $('#moduleRoot');
  const error = $('#moduleError');
  const stage = $('#generatedStage');
  const image = $('#generatedImage');
  const lines = $('#generatedLines');
  const controlsRoot = $('#generatedControls');
  const pendingBadge = $('#moduleImagePending');
  const mobileStrip = $('#mobileControlStrip');
  let module = null;

  function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
  }

  function imageBounds() {
    const stageRect = stage.getBoundingClientRect();
    const rect = image.getBoundingClientRect();
    return {
      left: rect.left - stageRect.left,
      top: rect.top - stageRect.top,
      width: rect.width,
      height: rect.height
    };
  }

  function pointToStage(control) {
    const b = imageBounds();
    return {
      x: b.left + b.width * control.x / 100,
      y: b.top + b.height * control.y / 100
    };
  }

  function calloutToStage(control) {
    const rect = stage.getBoundingClientRect();
    return {
      x: rect.width * control.labelX / 100,
      y: rect.height * control.labelY / 100
    };
  }

  function selectControl(id) {
    const control = module.controls.find(item => item.id === id);
    if (!control) return;

    document.querySelectorAll('.generated-hotspot,.generated-callout,.mobile-control-chip').forEach(el => {
      el.classList.toggle('active', el.dataset.controlId === id);
    });

    $('#controlReader').classList.add('has-selection');
    $('#controlReaderTitle').textContent = control.title || 'Control';
    $('#controlReaderBody').textContent = control.description || 'Aún no se ha añadido una descripción.';

    const activeChip = mobileStrip
      ? [...mobileStrip.querySelectorAll('[data-control-id]')].find(el => el.dataset.controlId === id)
      : null;
    activeChip?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  function renderMobileControlStrip() {
    if (!mobileStrip) return;
    if (!module.controls.length) {
      mobileStrip.innerHTML = '';
      mobileStrip.hidden = true;
      return;
    }
    mobileStrip.hidden = false;
    mobileStrip.innerHTML = module.controls.map(control => `
      <button type="button" class="mobile-control-chip" data-control-id="${escapeHTML(control.id)}">
        ${escapeHTML(control.title || 'CONTROL')}
      </button>
    `).join('');

    mobileStrip.querySelectorAll('.mobile-control-chip').forEach(button => {
      button.addEventListener('click', () => selectControl(button.dataset.controlId));
    });
  }

  function renderAnnotations() {
    if (!module || !image.complete || !image.naturalWidth) return;
    const rect = stage.getBoundingClientRect();
    lines.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    lines.innerHTML = module.controls.map(control => {
      const p = pointToStage(control);
      const c = calloutToStage(control);
      return `<line x1="${p.x}" y1="${p.y}" x2="${c.x}" y2="${c.y}" />`;
    }).join('');

    controlsRoot.innerHTML = '';
    module.controls.forEach(control => {
      const p = pointToStage(control);
      const c = calloutToStage(control);

      const hotspot = document.createElement('button');
      hotspot.type = 'button';
      hotspot.className = 'generated-hotspot';
      hotspot.dataset.controlId = control.id;
      hotspot.style.left = `${p.x}px`;
      hotspot.style.top = `${p.y}px`;
      hotspot.setAttribute('aria-label', `Abrir ${control.title}`);
      hotspot.addEventListener('click', () => selectControl(control.id));

      const callout = document.createElement('button');
      callout.type = 'button';
      callout.className = 'generated-callout';
      callout.dataset.controlId = control.id;
      callout.style.left = `${c.x}px`;
      callout.style.top = `${c.y}px`;
      callout.textContent = control.title || 'Control';
      callout.addEventListener('click', () => selectControl(control.id));

      controlsRoot.append(hotspot, callout);
    });
  }

  function renderCards(target, items, icon) {
    target.innerHTML = items.length ? items.map(item => `
      <article class="info-card feature-card">
        <span class="icon-box">${icon}</span>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.description || '')}</p>
      </article>
    `).join('') : '<p class="generated-empty-card">Aún no se han añadido tarjetas.</p>';
  }

  function render() {
    const family = Catalog.familyFor(module);
    document.title = `${module.name || 'Plugin'} · PLUGIN MATCH`;
    $('#moduleTitle').textContent = [module.name, module.developer].filter(Boolean).join(' - ');
    $('#moduleMeta').textContent = [module.category, module.subtype, module.formats, module.operatingSystems].filter(Boolean).join(' · ');

    const download = $('#moduleDownload');
    if (module.downloadUrl) {
      download.href = module.downloadUrl;
      download.removeAttribute('aria-disabled');
      download.textContent = 'DESCARGAR';
      download.onclick = null;
    } else {
      download.href = '#';
      download.setAttribute('aria-disabled', 'true');
      download.textContent = 'ENLACE PENDIENTE';
      download.onclick = event => event.preventDefault();
    }

    $('#moduleDescription').textContent = module.description || 'Aún no se ha añadido una descripción.';

    const rating = Math.max(0, Math.min(5, Number(module.rating) || 0));
    $('#moduleRating').innerHTML = rating > 0
      ? `<strong>${rating.toFixed(1)}</strong><span aria-hidden="true">${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))}</span>`
      : '<strong>—</strong><span>Sin valoraciones todavía</span>';

    renderCards($('#idealForCards'), module.idealFor || [], '♬');
    renderCards($('#qualityCards'), module.qualities || [], '⚡');

    const hasRealImage = Boolean(module.image?.src);
    image.src = hasRealImage ? module.image.src : Catalog.fallbackImage(module);
    image.alt = hasRealImage ? `Interfaz de ${module.name}` : `Imagen de categoría ${family.label}`;
    pendingBadge.hidden = hasRealImage;
    stage.classList.toggle('uses-fallback-image', !hasRealImage);

    if (hasRealImage) {
      image.style.transform = `translate(calc(-50% + ${module.image?.offsetX || 0}px), calc(-50% + ${module.image?.offsetY || 0}px)) scale(${module.image?.zoom || 1})`;
    } else {
      image.style.transform = 'translate(-50%, -50%) scale(1)';
    }

    module.controls = hasRealImage && Array.isArray(module.controls) ? module.controls : [];
    renderMobileControlStrip();

    if (!module.controls.length) {
      $('#controlReader').classList.remove('has-selection');
      $('#controlReaderTitle').textContent = hasRealImage ? 'Sin controles etiquetados' : 'Imagen pendiente';
      $('#controlReaderBody').textContent = hasRealImage
        ? 'Este módulo todavía no tiene hotspots configurados en Studio.'
        : 'La información del módulo ya proviene del Excel. Sube su imagen en Studio para activar el diagrama interactivo.';
    }

    image.addEventListener('load', () => {
      renderAnnotations();
      if (module.controls.length && window.matchMedia('(max-width: 900px)').matches) {
        selectControl(module.controls[0].id);
      }
    }, { once: true });

    root.hidden = false;
    requestAnimationFrame(() => {
      renderAnnotations();
      if (module.controls.length && window.matchMedia('(max-width: 900px)').matches) {
        selectControl(module.controls[0].id);
      }
    });
  }

  async function init() {
    const id = new URLSearchParams(location.search).get('id') || 'fet76-arturia';
    module = await Catalog.getModule(id);

    if (!module) {
      error.hidden = false;
      return;
    }

    module.controls = Array.isArray(module.controls) ? module.controls : [];
    module.idealFor = Array.isArray(module.idealFor) ? module.idealFor : [];
    module.qualities = Array.isArray(module.qualities) ? module.qualities : [];
    render();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => requestAnimationFrame(renderAnnotations), 80);
    });
  }

  init().catch(err => {
    console.error(err);
    error.hidden = false;
  });
})();
