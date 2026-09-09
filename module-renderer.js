(() => {
  const DB = window.PluginMatchStudioDB;
  const $ = s => document.querySelector(s);
  const root = $('#moduleRoot');
  const error = $('#moduleError');
  const stage = $('#generatedStage');
  const image = $('#generatedImage');
  const lines = $('#generatedLines');
  const controlsRoot = $('#generatedControls');
  let module = null;

  function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
  }

  function imageBounds() {
    const stageRect = stage.getBoundingClientRect();
    const rect = image.getBoundingClientRect();
    return { left: rect.left - stageRect.left, top: rect.top - stageRect.top, width: rect.width, height: rect.height, stageWidth: stageRect.width, stageHeight: stageRect.height };
  }

  function pointToStage(control) {
    const b = imageBounds();
    return { x: b.left + b.width * control.x / 100, y: b.top + b.height * control.y / 100 };
  }

  function calloutToStage(control) {
    const rect = stage.getBoundingClientRect();
    return { x: rect.width * control.labelX / 100, y: rect.height * control.labelY / 100 };
  }

  function selectControl(id) {
    const control = module.controls.find(item => item.id === id);
    if (!control) return;
    document.querySelectorAll('.generated-hotspot,.generated-callout').forEach(el => el.classList.toggle('active', el.dataset.controlId === id));
    $('#controlReaderTitle').textContent = control.title || 'Control';
    $('#controlReaderBody').textContent = control.description || 'No description added yet.';
  }

  function renderAnnotations() {
    if (!module || !image.complete) return;
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
      hotspot.setAttribute('aria-label', `Open ${control.title}`);
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
    `).join('') : '<p class="generated-empty-card">No cards added yet.</p>';
  }

  function render() {
    document.title = `${module.name || 'Plugin'} · PLUGIN MATCH`;
    $('#moduleTitle').textContent = [module.name, module.developer].filter(Boolean).join(' - ');
    $('#moduleMeta').textContent = [module.formats, module.operatingSystems].filter(Boolean).join(' · ');
    const download = $('#moduleDownload');
    if (module.downloadUrl) {
      download.href = module.downloadUrl;
      download.removeAttribute('aria-disabled');
    } else {
      download.href = '#';
      download.setAttribute('aria-disabled', 'true');
      download.addEventListener('click', e => e.preventDefault());
    }
    $('#moduleDescription').textContent = module.description || 'No description added yet.';
    const rating = Math.max(0, Math.min(5, Number(module.rating) || 0));
    $('#moduleRating').innerHTML = `<strong>${rating.toFixed(1)}</strong><span aria-hidden="true">${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))}</span>`;
    renderCards($('#idealForCards'), module.idealFor || [], '♬');
    renderCards($('#qualityCards'), module.qualities || [], '⚡');

    image.src = module.image?.src || '';
    image.style.transform = `translate(calc(-50% + ${module.image?.offsetX || 0}px), calc(-50% + ${module.image?.offsetY || 0}px)) scale(${module.image?.zoom || 1})`;
    image.addEventListener('load', renderAnnotations, { once: true });
    root.hidden = false;
    requestAnimationFrame(renderAnnotations);
  }

  async function init() {
    const id = new URLSearchParams(location.search).get('id') || 'fet76-arturia';
    module = await DB.get(id);
    if (!module && id === 'fet76-arturia') module = window.PLUGIN_MATCH_DEFAULTS.sampleModule;
    if (!module) {
      error.hidden = false;
      return;
    }
    module.controls = Array.isArray(module.controls) ? module.controls : [];
    module.idealFor = Array.isArray(module.idealFor) ? module.idealFor : [];
    module.qualities = Array.isArray(module.qualities) ? module.qualities : [];
    render();
    window.addEventListener('resize', () => requestAnimationFrame(renderAnnotations));
  }

  init().catch(err => {
    console.error(err);
    error.hidden = false;
  });
})();
