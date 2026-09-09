(() => {
  const DB = window.PluginMatchStudioDB;
  const sample = structuredClone(window.PLUGIN_MATCH_DEFAULTS.sampleModule);

  const state = {
    module: null,
    modules: [],
    selectedControlId: null,
    addMode: false,
    dirty: false,
    drag: null
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const els = {
    library: $('#moduleLibrary'),
    search: $('#moduleSearch'),
    saveState: $('#saveState'),
    canvasTitle: $('#canvasTitle'),
    canvas: $('#studioCanvas'),
    image: $('#studioMainImage'),
    emptyImage: $('#emptyImageState'),
    lines: $('#studioLines'),
    layer: $('#studioLabelLayer'),
    instruction: $('#canvasInstruction'),
    coordinates: $('#canvasCoordinates'),
    addLabel: $('#addLabelBtn'),
    deleteLabel: $('#deleteLabelBtn'),
    save: $('#saveBtn'),
    preview: $('#previewBtn'),
    create: $('#newModuleBtn'),
    importBtn: $('#importBtn'),
    exportBtn: $('#exportBtn'),
    importFile: $('#importFile'),
    pluginImageInput: $('#pluginImageInput'),
    zoom: $('#imageZoom'),
    offsetX: $('#imageOffsetX'),
    offsetY: $('#imageOffsetY'),
    zoomValue: $('#zoomValue'),
    offsetXValue: $('#offsetXValue'),
    offsetYValue: $('#offsetYValue'),
    resetImage: $('#resetImageBtn'),
    labelInspector: $('#labelInspector'),
    labelEmpty: $('#labelEmptyInspector'),
    labelTitle: $('#labelTitle'),
    labelDescription: $('#labelDescription'),
    hotspotPosition: $('#hotspotPosition'),
    calloutPosition: $('#calloutPosition'),
    toast: $('#studioToast')
  };

  const moduleFields = {
    name: $('#pluginName'),
    developer: $('#pluginDeveloper'),
    category: $('#pluginCategory'),
    subtype: $('#pluginSubtype'),
    rating: $('#pluginRating'),
    formats: $('#pluginFormats'),
    operatingSystems: $('#pluginOS'),
    downloadUrl: $('#pluginDownload'),
    description: $('#pluginDescription'),
    idealFor: $('#idealForInput'),
    qualities: $('#qualitiesInput')
  };

  function slugify(value) {
    return String(value || 'untitled')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `module-${Date.now()}`;
  }

  function uid(prefix = 'control') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 1800);
  }

  function setDirty(dirty = true) {
    state.dirty = dirty;
    els.saveState.textContent = dirty ? 'Unsaved changes' : 'Saved locally';
    els.saveState.classList.toggle('dirty', dirty);
  }

  function parseCardLines(text) {
    return String(text || '')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [title, ...rest] = line.split('|');
        return { title: title.trim(), description: rest.join('|').trim() };
      });
  }

  function stringifyCardLines(items = []) {
    return items.map(item => `${item.title || ''}${item.description ? ` | ${item.description}` : ''}`).join('\n');
  }

  function selectedControl() {
    return state.module?.controls?.find(control => control.id === state.selectedControlId) || null;
  }

  function switchTab(name) {
    $$('.studio-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === name));
    $$('.studio-tab-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.panel === name));
  }

  function ensureShape(module) {
    const base = {
      id: '', name: '', developer: '', category: '', subtype: '', rating: 0,
      formats: '', operatingSystems: '', downloadUrl: '', description: '',
      image: { src: '', zoom: 1, offsetX: 0, offsetY: 0 },
      controls: [], idealFor: [], qualities: [], updatedAt: null
    };
    const merged = { ...base, ...module };
    merged.image = { ...base.image, ...(module.image || {}) };
    merged.controls = Array.isArray(module.controls) ? module.controls : [];
    merged.idealFor = Array.isArray(module.idealFor) ? module.idealFor : [];
    merged.qualities = Array.isArray(module.qualities) ? module.qualities : [];
    return merged;
  }

  function createBlank() {
    return ensureShape({
      id: `untitled-${Date.now()}`,
      name: 'Untitled Plugin',
      developer: '',
      category: '',
      subtype: '',
      rating: 0,
      image: { src: '', zoom: 1, offsetX: 0, offsetY: 0 },
      controls: []
    });
  }

  function fillForm() {
    const m = state.module;
    if (!m) return;
    moduleFields.name.value = m.name || '';
    moduleFields.developer.value = m.developer || '';
    moduleFields.category.value = m.category || '';
    moduleFields.subtype.value = m.subtype || '';
    moduleFields.rating.value = Number(m.rating || 0);
    moduleFields.formats.value = m.formats || '';
    moduleFields.operatingSystems.value = m.operatingSystems || '';
    moduleFields.downloadUrl.value = m.downloadUrl || '';
    moduleFields.description.value = m.description || '';
    moduleFields.idealFor.value = stringifyCardLines(m.idealFor);
    moduleFields.qualities.value = stringifyCardLines(m.qualities);

    els.zoom.value = Math.round((m.image.zoom || 1) * 100);
    els.offsetX.value = Math.round(m.image.offsetX || 0);
    els.offsetY.value = Math.round(m.image.offsetY || 0);
    updateImageControlLabels();
    els.canvasTitle.textContent = [m.name, m.developer].filter(Boolean).join(' · ') || 'Untitled module';
  }

  function readForm() {
    const m = state.module;
    if (!m) return;
    m.name = moduleFields.name.value.trim();
    m.developer = moduleFields.developer.value.trim();
    m.category = moduleFields.category.value.trim();
    m.subtype = moduleFields.subtype.value.trim();
    m.rating = Math.max(0, Math.min(5, Number(moduleFields.rating.value) || 0));
    m.formats = moduleFields.formats.value.trim();
    m.operatingSystems = moduleFields.operatingSystems.value.trim();
    m.downloadUrl = moduleFields.downloadUrl.value.trim();
    m.description = moduleFields.description.value.trim();
    m.idealFor = parseCardLines(moduleFields.idealFor.value);
    m.qualities = parseCardLines(moduleFields.qualities.value);
    els.canvasTitle.textContent = [m.name, m.developer].filter(Boolean).join(' · ') || 'Untitled module';
  }

  function updateImageControlLabels() {
    els.zoomValue.textContent = `${Math.round(Number(els.zoom.value))}%`;
    els.offsetXValue.textContent = `${Math.round(Number(els.offsetX.value))}px`;
    els.offsetYValue.textContent = `${Math.round(Number(els.offsetY.value))}px`;
  }

  function imageTransform() {
    const image = state.module?.image || { zoom: 1, offsetX: 0, offsetY: 0 };
    return `translate(calc(-50% + ${image.offsetX || 0}px), calc(-50% + ${image.offsetY || 0}px)) scale(${image.zoom || 1})`;
  }

  function renderImage() {
    const src = state.module?.image?.src;
    els.emptyImage.hidden = Boolean(src);
    els.image.hidden = !src;
    if (!src) return;
    if (els.image.src !== src) els.image.src = src;
    els.image.style.transform = imageTransform();
  }

  function imageBounds() {
    if (!state.module?.image?.src || els.image.hidden || !els.image.complete) return null;
    const stageRect = els.canvas.getBoundingClientRect();
    const rect = els.image.getBoundingClientRect();
    return {
      left: rect.left - stageRect.left,
      top: rect.top - stageRect.top,
      width: rect.width,
      height: rect.height,
      stageWidth: stageRect.width,
      stageHeight: stageRect.height
    };
  }

  function pointToStage(control) {
    const bounds = imageBounds();
    if (!bounds) return { x: 0, y: 0 };
    return {
      x: bounds.left + bounds.width * (control.x / 100),
      y: bounds.top + bounds.height * (control.y / 100)
    };
  }

  function calloutToStage(control) {
    const rect = els.canvas.getBoundingClientRect();
    return {
      x: rect.width * (control.labelX / 100),
      y: rect.height * (control.labelY / 100)
    };
  }

  function updateLines() {
    const rect = els.canvas.getBoundingClientRect();
    els.lines.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    els.lines.innerHTML = (state.module?.controls || []).map(control => {
      const p = pointToStage(control);
      const c = calloutToStage(control);
      return `<line x1="${p.x}" y1="${p.y}" x2="${c.x}" y2="${c.y}" />`;
    }).join('');
  }

  function shortDescription(text, max = 72) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
  }

  function renderControls() {
    const rect = els.canvas.getBoundingClientRect();
    els.layer.innerHTML = '';
    (state.module?.controls || []).forEach(control => {
      const point = pointToStage(control);
      const callout = calloutToStage(control);

      const hotspot = document.createElement('button');
      hotspot.type = 'button';
      hotspot.className = `studio-hotspot${control.id === state.selectedControlId ? ' selected' : ''}`;
      hotspot.dataset.controlId = control.id;
      hotspot.style.left = `${point.x}px`;
      hotspot.style.top = `${point.y}px`;
      hotspot.title = control.title || 'Control';
      hotspot.setAttribute('aria-label', `Hotspot for ${control.title || 'control'}`);

      const label = document.createElement('button');
      label.type = 'button';
      label.className = `studio-callout${control.id === state.selectedControlId ? ' selected' : ''}`;
      label.dataset.controlId = control.id;
      label.style.left = `${callout.x}px`;
      label.style.top = `${callout.y}px`;
      label.innerHTML = `<strong>${escapeHTML(control.title || 'Untitled label')}</strong><span>${escapeHTML(shortDescription(control.description) || 'Add a description…')}</span>`;

      hotspot.addEventListener('pointerdown', event => beginDrag(event, control.id, 'hotspot'));
      label.addEventListener('pointerdown', event => beginDrag(event, control.id, 'callout'));
      hotspot.addEventListener('click', event => { event.stopPropagation(); selectControl(control.id); });
      label.addEventListener('click', event => { event.stopPropagation(); selectControl(control.id); });
      els.layer.append(hotspot, label);
    });
    updateLines();
    if (rect.width) updatePositionReadout();
  }

  function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
  }

  function selectControl(id) {
    state.selectedControlId = id;
    const control = selectedControl();
    els.deleteLabel.disabled = !control;
    els.labelEmpty.hidden = Boolean(control);
    els.labelInspector.hidden = !control;
    if (control) {
      els.labelTitle.value = control.title || '';
      els.labelDescription.value = control.description || '';
      switchTab('label');
    }
    renderControls();
    updatePositionReadout();
  }

  function updatePositionReadout() {
    const control = selectedControl();
    if (!control) {
      els.hotspotPosition.textContent = '—';
      els.calloutPosition.textContent = '—';
      return;
    }
    els.hotspotPosition.textContent = `${control.x.toFixed(1)}%, ${control.y.toFixed(1)}%`;
    els.calloutPosition.textContent = `${control.labelX.toFixed(1)}%, ${control.labelY.toFixed(1)}%`;
  }

  function beginDrag(event, id, type) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    selectControl(id);
    state.drag = { id, type, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    document.addEventListener('pointermove', handleDrag);
    document.addEventListener('pointerup', endDrag, { once: true });
  }

  function handleDrag(event) {
    if (!state.drag) return;
    const control = state.module.controls.find(item => item.id === state.drag.id);
    if (!control) return;
    const stageRect = els.canvas.getBoundingClientRect();
    const localX = event.clientX - stageRect.left;
    const localY = event.clientY - stageRect.top;

    if (state.drag.type === 'callout') {
      control.labelX = Math.max(3, Math.min(97, localX / stageRect.width * 100));
      control.labelY = Math.max(4, Math.min(96, localY / stageRect.height * 100));
    } else {
      const bounds = imageBounds();
      if (!bounds) return;
      control.x = Math.max(0, Math.min(100, (localX - bounds.left) / bounds.width * 100));
      control.y = Math.max(0, Math.min(100, (localY - bounds.top) / bounds.height * 100));
    }
    setDirty();
    renderControls();
  }

  function endDrag() {
    state.drag = null;
    document.removeEventListener('pointermove', handleDrag);
  }

  function addControlAt(clientX, clientY) {
    const bounds = imageBounds();
    const stageRect = els.canvas.getBoundingClientRect();
    if (!bounds) {
      showToast('Upload an image first.');
      return;
    }
    const xPx = clientX - stageRect.left;
    const yPx = clientY - stageRect.top;
    const x = (xPx - bounds.left) / bounds.width * 100;
    const y = (yPx - bounds.top) / bounds.height * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) {
      showToast('Click directly on the plugin image.');
      return;
    }

    const labelX = Math.max(10, Math.min(90, xPx / stageRect.width * 100 + (x > 55 ? -18 : 18)));
    const labelY = Math.max(10, Math.min(90, yPx / stageRect.height * 100 - 14));
    const control = {
      id: uid(),
      title: `Control ${state.module.controls.length + 1}`,
      description: '',
      x: Number(x.toFixed(3)),
      y: Number(y.toFixed(3)),
      labelX: Number(labelX.toFixed(3)),
      labelY: Number(labelY.toFixed(3))
    };
    state.module.controls.push(control);
    toggleAddMode(false);
    setDirty();
    selectControl(control.id);
    els.labelTitle.select();
  }

  function toggleAddMode(force) {
    state.addMode = typeof force === 'boolean' ? force : !state.addMode;
    els.addLabel.classList.toggle('primary', state.addMode);
    els.addLabel.textContent = state.addMode ? 'Click image…' : '+ Add label';
    els.canvas.classList.toggle('add-mode', state.addMode);
    els.instruction.textContent = state.addMode ? 'Click the exact control on the plugin image.' : 'Drag hotspots and label cards to refine placement.';
  }

  function deleteSelectedControl() {
    if (!state.selectedControlId) return;
    state.module.controls = state.module.controls.filter(control => control.id !== state.selectedControlId);
    state.selectedControlId = null;
    setDirty();
    selectControl(null);
    switchTab('module');
  }

  function updateCanvasFromImageSettings() {
    if (!state.module) return;
    state.module.image.zoom = Number(els.zoom.value) / 100;
    state.module.image.offsetX = Number(els.offsetX.value);
    state.module.image.offsetY = Number(els.offsetY.value);
    updateImageControlLabels();
    renderImage();
    requestAnimationFrame(renderControls);
    setDirty();
  }

  function resetImageFraming() {
    if (!state.module) return;
    els.zoom.value = 100;
    els.offsetX.value = 0;
    els.offsetY.value = 0;
    updateCanvasFromImageSettings();
  }

  async function readImage(file) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function saveCurrent({ silent = false } = {}) {
    if (!state.module) return;
    readForm();
    const previousId = state.module.id;
    const desiredId = slugify(`${state.module.name}-${state.module.developer}`);
    if (previousId.startsWith('untitled-')) state.module.id = desiredId;
    state.module.updatedAt = new Date().toISOString();
    await DB.put(clone(state.module));
    if (previousId !== state.module.id) await DB.delete(previousId).catch(() => {});
    setDirty(false);
    await refreshLibrary();
    if (!silent) showToast('Module saved locally.');
  }

  async function loadModule(id) {
    const stored = await DB.get(id);
    if (!stored) return;
    state.module = ensureShape(clone(stored));
    state.selectedControlId = null;
    toggleAddMode(false);
    fillForm();
    renderImage();
    requestAnimationFrame(() => {
      renderControls();
      selectControl(null);
      switchTab('module');
    });
    setDirty(false);
    renderLibrary();
  }

  function renderLibrary() {
    const term = els.search.value.trim().toLowerCase();
    const filtered = state.modules.filter(module => `${module.name} ${module.developer} ${module.category}`.toLowerCase().includes(term));
    els.library.innerHTML = filtered.map(module => `
      <button class="module-library-item${module.id === state.module?.id ? ' active' : ''}" type="button" data-id="${escapeHTML(module.id)}">
        <strong>${escapeHTML(module.name || 'Untitled')}</strong>
        <span>${escapeHTML([module.developer, module.category].filter(Boolean).join(' · ') || 'No metadata')}</span>
      </button>
    `).join('');
    $$('.module-library-item', els.library).forEach(button => button.addEventListener('click', () => loadModule(button.dataset.id)));
  }

  async function refreshLibrary() {
    state.modules = (await DB.getAll()).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    renderLibrary();
  }

  async function initSampleIfNeeded() {
    const all = await DB.getAll();
    if (all.length === 0) {
      const initial = clone(sample);
      initial.updatedAt = new Date().toISOString();
      await DB.put(initial);
    }
  }

  async function newModule() {
    state.module = createBlank();
    state.selectedControlId = null;
    fillForm();
    renderImage();
    renderControls();
    selectControl(null);
    switchTab('module');
    setDirty(true);
    showToast('New module ready.');
  }

  function exportJSON() {
    if (!state.module) return;
    readForm();
    const blob = new Blob([JSON.stringify(state.module, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${state.module.id || slugify(state.module.name)}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast('JSON exported.');
  }

  async function importJSON(file) {
    try {
      const data = JSON.parse(await file.text());
      const imported = ensureShape(data);
      if (!imported.id) imported.id = slugify(`${imported.name}-${imported.developer}`);
      imported.updatedAt = new Date().toISOString();
      await DB.put(imported);
      await refreshLibrary();
      await loadModule(imported.id);
      showToast('Module imported.');
    } catch (error) {
      console.error(error);
      showToast('Could not import this JSON.');
    }
  }

  function preview() {
    if (!state.module) return;
    saveCurrent({ silent: true }).then(() => {
      window.open(`module.html?id=${encodeURIComponent(state.module.id)}`, '_blank', 'noopener');
    });
  }

  function bindModuleFields() {
    Object.values(moduleFields).forEach(input => {
      input.addEventListener('input', () => {
        readForm();
        setDirty();
        renderLibrary();
      });
    });
  }

  function bindEvents() {
    $$('.studio-tab').forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
    els.addLabel.addEventListener('click', () => toggleAddMode());
    els.deleteLabel.addEventListener('click', deleteSelectedControl);
    els.canvas.addEventListener('click', event => {
      if (state.addMode) addControlAt(event.clientX, event.clientY);
    });
    els.canvas.addEventListener('pointermove', event => {
      const rect = els.canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width * 100;
      const y = (event.clientY - rect.top) / rect.height * 100;
      els.coordinates.textContent = `${x.toFixed(1)}%, ${y.toFixed(1)}%`;
    });
    els.canvas.addEventListener('pointerleave', () => { els.coordinates.textContent = '—'; });

    [els.zoom, els.offsetX, els.offsetY].forEach(input => input.addEventListener('input', updateCanvasFromImageSettings));
    els.resetImage.addEventListener('click', resetImageFraming);

    els.pluginImageInput.addEventListener('change', async event => {
      const file = event.target.files?.[0];
      if (!file || !state.module) return;
      state.module.image.src = await readImage(file);
      state.module.image.zoom = 1;
      state.module.image.offsetX = 0;
      state.module.image.offsetY = 0;
      els.zoom.value = 100;
      els.offsetX.value = 0;
      els.offsetY.value = 0;
      renderImage();
      els.image.addEventListener('load', () => renderControls(), { once: true });
      updateImageControlLabels();
      setDirty();
    });

    els.labelTitle.addEventListener('input', () => {
      const control = selectedControl();
      if (!control) return;
      control.title = els.labelTitle.value;
      setDirty();
      renderControls();
    });
    els.labelDescription.addEventListener('input', () => {
      const control = selectedControl();
      if (!control) return;
      control.description = els.labelDescription.value;
      setDirty();
      renderControls();
    });

    els.save.addEventListener('click', () => saveCurrent());
    els.preview.addEventListener('click', preview);
    els.create.addEventListener('click', newModule);
    els.exportBtn.addEventListener('click', exportJSON);
    els.importBtn.addEventListener('click', () => els.importFile.click());
    els.importFile.addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (file) importJSON(file);
      event.target.value = '';
    });
    els.search.addEventListener('input', renderLibrary);
    window.addEventListener('resize', () => requestAnimationFrame(renderControls));
    els.image.addEventListener('load', () => requestAnimationFrame(renderControls));

    window.addEventListener('beforeunload', event => {
      if (!state.dirty) return;
      event.preventDefault();
      event.returnValue = '';
    });
  }

  async function init() {
    bindEvents();
    bindModuleFields();
    await initSampleIfNeeded();
    await refreshLibrary();
    const first = state.modules[0];
    if (first) await loadModule(first.id);
    else await newModule();
  }

  init().catch(error => {
    console.error(error);
    showToast('Studio could not initialize. Use Live Server rather than file://.');
  });
})();
