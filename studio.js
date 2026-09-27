(() => {
  const DB = window.PluginMatchStudioDB;
  const Excel = window.PluginMatchExcelImporter;
  const sample = structuredClone(window.PLUGIN_MATCH_DEFAULTS.sampleModule);

  const state = {
    module: null,
    modules: [],
    selectedControlId: null,
    addMode: false,
    dirty: false,
    drag: null,
    importReview: null
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const els = {
    library: $('#moduleLibrary'),
    search: $('#moduleSearch'),
    developerFilter: $('#developerFilter'),
    typeFilter: $('#typeFilter'),
    subgroupFilter: $('#subgroupFilter'),
    libraryCount: $('#libraryCount'),
    catalogHealth: $('#catalogHealth'),
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
    excelImportBtn: $('#excelImportBtn'),
    excelFile: $('#excelFile'),
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
    sourceInfoSection: $('#sourceInfoSection'),
    sourceFileName: $('#sourceFileName'),
    sourceLocation: $('#sourceLocation'),
    excelModal: $('#excelImportModal'),
    excelSummaryGrid: $('#excelSummaryGrid'),
    excelIssues: $('#excelIssues'),
    excelIssueCount: $('#excelIssueCount'),
    excelSourceLabel: $('#excelSourceLabel'),
    confirmExcelImport: $('#confirmExcelImportBtn'),
    loadBundledCatalog: $('#loadBundledCatalogBtn'),
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
    els.saveState.textContent = dirty ? 'Cambios sin guardar' : 'Guardado localmente';
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
      schemaVersion: '1.2', sourceKey: '', id: '', name: '', developer: '', category: '', subtype: '', rating: 0,
      formats: '', operatingSystems: '', downloadUrl: '', description: '',
      filters: { developer: '', type: '', subgroup: '' }, source: null,
      image: { src: '', zoom: 1, offsetX: 0, offsetY: 0 },
      controls: [], idealFor: [], qualities: [], updatedAt: null
    };
    const merged = { ...base, ...module };
    merged.image = { ...base.image, ...(module.image || {}) };
    merged.filters = { ...base.filters, ...(module.filters || {}) };
    merged.controls = Array.isArray(module.controls) ? module.controls : [];
    merged.idealFor = Array.isArray(module.idealFor) ? module.idealFor : [];
    merged.qualities = Array.isArray(module.qualities) ? module.qualities : [];
    if (!merged.sourceKey && merged.name && merged.developer) merged.sourceKey = slugify(`${merged.developer}-${merged.name}`);
    return merged;
  }

  function createBlank() {
    return ensureShape({
      id: `untitled-${Date.now()}`,
      name: 'Plugin sin título',
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
    els.canvasTitle.textContent = [m.name, m.developer].filter(Boolean).join(' · ') || 'Módulo sin título';
    const excelSource = m.source?.kind === 'excel';
    els.sourceInfoSection.hidden = !excelSource;
    if (excelSource) {
      els.sourceFileName.textContent = m.source.workbook || 'Plugins.xlsx';
      els.sourceLocation.textContent = `${m.source.sheet || 'Hoja'} · fila ${m.source.row || '—'}`;
    }
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
    m.sourceKey = m.sourceKey || slugify(`${m.developer}-${m.name}`);
    m.filters = { ...(m.filters || {}), developer: m.developer, type: m.category, subgroup: m.subtype };
    els.canvasTitle.textContent = [m.name, m.developer].filter(Boolean).join(' · ') || 'Módulo sin título';
    const excelSource = m.source?.kind === 'excel';
    els.sourceInfoSection.hidden = !excelSource;
    if (excelSource) {
      els.sourceFileName.textContent = m.source.workbook || 'Plugins.xlsx';
      els.sourceLocation.textContent = `${m.source.sheet || 'Hoja'} · fila ${m.source.row || '—'}`;
    }
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
      label.innerHTML = `<strong>${escapeHTML(control.title || 'Sin título label')}</strong><span>${escapeHTML(shortDescription(control.description) || 'Add a description…')}</span>`;

      // Pointer events are bound directly to the elements and the elements are kept
      // mounted for the entire drag. Re-rendering during pointerdown breaks pointer
      // capture in Chromium, which was the reason dragging did not work previously.
      hotspot.addEventListener('pointerdown', event => beginDrag(event, control.id, 'hotspot'));
      label.addEventListener('pointerdown', event => beginDrag(event, control.id, 'callout'));
      hotspot.addEventListener('click', event => {
        event.stopPropagation();
        if (!state.drag?.moved) selectControl(control.id);
      });
      label.addEventListener('click', event => {
        event.stopPropagation();
        if (!state.drag?.moved) selectControl(control.id);
      });
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

  function setSelectedCanvasVisuals(id) {
    $$('.studio-hotspot, .studio-callout', els.layer).forEach(element => {
      element.classList.toggle('selected', Boolean(id) && element.dataset.controlId === id);
    });
  }

  function selectControl(id, { render = true } = {}) {
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
    if (render) renderControls();
    else setSelectedCanvasVisuals(id);
    updatePositionReadout();
  }

  function updatePositionReadout() {
    const control = selectedControl();
    if (!control) {
      els.hotspotPosition.textContent = '—';
      els.calloutPosition.textContent = '—';
      return;
    }
    els.hotspotPosition.textContent = `${Number(control.x).toFixed(1)}%, ${Number(control.y).toFixed(1)}%`;
    els.calloutPosition.textContent = `${Number(control.labelX).toFixed(1)}%, ${Number(control.labelY).toFixed(1)}%`;
  }

  function elementsForControl(id) {
    const elements = $$('[data-control-id]', els.layer).filter(element => element.dataset.controlId === id);
    return {
      hotspot: elements.find(element => element.classList.contains('studio-hotspot')) || null,
      callout: elements.find(element => element.classList.contains('studio-callout')) || null
    };
  }

  function updateControlElementPositions(control) {
    const { hotspot, callout } = elementsForControl(control.id);
    const point = pointToStage(control);
    const calloutPoint = calloutToStage(control);
    if (hotspot) {
      hotspot.style.left = `${point.x}px`;
      hotspot.style.top = `${point.y}px`;
    }
    if (callout) {
      callout.style.left = `${calloutPoint.x}px`;
      callout.style.top = `${calloutPoint.y}px`;
    }
  }

  function localPointer(event) {
    const stageRect = els.canvas.getBoundingClientRect();
    return {
      stageRect,
      x: event.clientX - stageRect.left,
      y: event.clientY - stageRect.top
    };
  }

  function beginDrag(event, id, type) {
    if (event.button !== undefined && event.button !== 0) return;
    if (!state.module) return;

    const control = state.module.controls.find(item => item.id === id);
    if (!control) return;

    event.preventDefault();
    event.stopPropagation();
    toggleAddMode(false);

    // Do NOT re-render here. Keeping event.currentTarget mounted is essential for a
    // reliable pointer drag and lets setPointerCapture work as intended.
    selectControl(id, { render: false });

    const pointer = localPointer(event);
    const current = type === 'callout' ? calloutToStage(control) : pointToStage(control);
    const target = event.currentTarget;

    state.drag = {
      id,
      type,
      pointerId: event.pointerId,
      target,
      startClientX: event.clientX,
      startClientY: event.clientY,
      offsetX: pointer.x - current.x,
      offsetY: pointer.y - current.y,
      moved: false
    };

    target.classList.add('dragging');
    document.body.classList.add('studio-is-dragging');

    try {
      target.setPointerCapture?.(event.pointerId);
    } catch (error) {
      // Window-level pointer listeners below keep dragging functional even if capture
      // is unavailable in a particular browser/environment.
    }

    window.addEventListener('pointermove', handleDrag, { passive: false });
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
  }

  function handleDrag(event) {
    const drag = state.drag;
    if (!drag) return;
    if (drag.pointerId !== undefined && event.pointerId !== drag.pointerId) return;

    event.preventDefault();

    const control = state.module?.controls?.find(item => item.id === drag.id);
    if (!control) {
      endDrag(event);
      return;
    }

    if (!drag.moved) {
      const distance = Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY);
      drag.moved = distance > 2;
    }

    const { stageRect, x: pointerX, y: pointerY } = localPointer(event);
    const desiredX = pointerX - drag.offsetX;
    const desiredY = pointerY - drag.offsetY;

    if (drag.type === 'callout') {
      // Keep the whole card inside the canvas instead of only clamping its centre.
      const { callout } = elementsForControl(control.id);
      const calloutRect = callout?.getBoundingClientRect();
      const halfWidth = calloutRect ? calloutRect.width / 2 : 80;
      const halfHeight = calloutRect ? calloutRect.height / 2 : 24;
      const padding = 8;
      const clampedX = Math.max(halfWidth + padding, Math.min(stageRect.width - halfWidth - padding, desiredX));
      const clampedY = Math.max(halfHeight + padding, Math.min(stageRect.height - halfHeight - padding, desiredY));
      control.labelX = Number((clampedX / stageRect.width * 100).toFixed(3));
      control.labelY = Number((clampedY / stageRect.height * 100).toFixed(3));
    } else {
      const bounds = imageBounds();
      if (!bounds) return;
      control.x = Number((Math.max(0, Math.min(100, (desiredX - bounds.left) / bounds.width * 100))).toFixed(3));
      control.y = Number((Math.max(0, Math.min(100, (desiredY - bounds.top) / bounds.height * 100))).toFixed(3));
    }

    setDirty();
    updateControlElementPositions(control);
    updateLines();
    updatePositionReadout();
  }

  function endDrag(event) {
    const drag = state.drag;
    if (!drag) return;
    if (event?.pointerId !== undefined && drag.pointerId !== undefined && event.pointerId !== drag.pointerId) return;

    try {
      if (drag.target?.hasPointerCapture?.(drag.pointerId)) {
        drag.target.releasePointerCapture(drag.pointerId);
      }
    } catch (error) {
      // Safe to ignore if capture was already released by the browser.
    }

    drag.target?.classList.remove('dragging');
    document.body.classList.remove('studio-is-dragging');
    window.removeEventListener('pointermove', handleDrag);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);

    // Keep the final moved state long enough to suppress the synthetic click that can
    // follow pointerup, then clear the drag record on the next task.
    const finished = drag;
    setTimeout(() => {
      if (state.drag === finished) state.drag = null;
    }, 0);
  }

  function addControlAt(clientX, clientY) {
    const bounds = imageBounds();
    const stageRect = els.canvas.getBoundingClientRect();
    if (!bounds) {
      showToast('Primero sube una imagen.');
      return;
    }
    const xPx = clientX - stageRect.left;
    const yPx = clientY - stageRect.top;
    const x = (xPx - bounds.left) / bounds.width * 100;
    const y = (yPx - bounds.top) / bounds.height * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) {
      showToast('Haz clic directamente sobre la imagen del plugin.');
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
    els.addLabel.textContent = state.addMode ? 'Haz clic en la imagen…' : '+ Añadir etiqueta';
    els.canvas.classList.toggle('add-mode', state.addMode);
    els.instruction.textContent = state.addMode ? 'Haz clic sobre el control exacto en la imagen del plugin.' : 'Arrastra los hotspots y las etiquetas para ajustar su posición.';
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
    if (!silent) showToast('Módulo guardado localmente.');
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

  function setSelectOptions(select, values, label) {
    const current = select.value;
    const unique = [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    select.innerHTML = `<option value="">${label}</option>${unique.map(value => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join('')}`;
    if (unique.includes(current)) select.value = current;
  }

  function refreshLibraryFilters() {
    setSelectOptions(els.developerFilter, state.modules.map(module => module.developer), 'Todos');
    setSelectOptions(els.typeFilter, state.modules.map(module => module.category), 'Todos');
    setSelectOptions(els.subgroupFilter, state.modules.map(module => module.subtype), 'Todos');
  }

  function renderCatalogHealth() {
    const total = state.modules.length;
    const excelCount = state.modules.filter(module => module.source?.kind === 'excel').length;
    const withImage = state.modules.filter(module => module.image?.src).length;
    const sourceSummary = window.PLUGIN_MATCH_EXCEL_CATALOG?.summary;
    els.libraryCount.textContent = total;
    els.catalogHealth.innerHTML = `<strong>${excelCount} módulos desde Excel</strong><span>${withImage} con imagen · ${total - withImage} pendientes</span>${sourceSummary ? `<small>${sourceSummary.rows} filas fuente · ${sourceSummary.duplicates} duplicados detectados · ${sourceSummary.warnings} avisos</small>` : ''}`;
  }

  function renderLibrary() {
    const term = els.search.value.trim().toLowerCase();
    const developer = els.developerFilter.value;
    const type = els.typeFilter.value;
    const subgroup = els.subgroupFilter.value;
    const filtered = state.modules.filter(module => {
      const haystack = `${module.name} ${module.developer} ${module.category} ${module.subtype}`.toLowerCase();
      return (!term || haystack.includes(term))
        && (!developer || module.developer === developer)
        && (!type || module.category === type)
        && (!subgroup || module.subtype === subgroup);
    });
    els.library.innerHTML = filtered.length ? filtered.map(module => `
      <button class="module-library-item${module.id === state.module?.id ? ' active' : ''}" type="button" data-id="${escapeHTML(module.id)}">
        <span class="module-library-row"><strong>${escapeHTML(module.name || 'Sin título')}</strong>${module.source?.kind === 'excel' ? '<em>EXCEL</em>' : ''}</span>
        <span>${escapeHTML([module.developer, module.category, module.subtype].filter(Boolean).join(' · ') || 'Sin metadatos')}</span>
        <span class="module-library-status">${module.image?.src ? 'Imagen ✓' : 'Sin imagen'} · ${(module.controls || []).length} etiquetas</span>
      </button>
    `).join('') : '<div class="library-empty">No hay módulos que coincidan con estos filtros.</div>';
    $$('.module-library-item', els.library).forEach(button => button.addEventListener('click', () => loadModule(button.dataset.id)));
    els.libraryCount.textContent = filtered.length === state.modules.length ? state.modules.length : `${filtered.length}/${state.modules.length}`;
  }

  async function refreshLibrary() {
    state.modules = (await DB.getAll()).map(ensureShape).sort((a, b) => {
      const dev = (a.developer || '').localeCompare(b.developer || '', 'es', { sensitivity: 'base' });
      if (dev) return dev;
      return (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });
    });
    refreshLibraryFilters();
    renderCatalogHealth();
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
    showToast('Nuevo módulo listo.');
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
    showToast('JSON exportado.');
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
      showToast('Módulo importado.');
    } catch (error) {
      console.error(error);
      showToast('No se pudo importar este JSON.');
    }
  }

  function preview() {
    if (!state.module) return;
    saveCurrent({ silent: true }).then(() => {
      window.open(`module.html?id=${encodeURIComponent(state.module.id)}`, '_blank', 'noopener');
    });
  }

  function openExcelModal() {
    els.excelModal.hidden = false;
    document.body.classList.add('modal-open');
  }

  function closeExcelModal() {
    els.excelModal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  function importIssueHTML(issue) {
    const cls = issue.level === 'error' ? 'error' : 'warning';
    const label = issue.level === 'error' ? 'ERROR' : 'AVISO';
    return `<article class="excel-issue ${cls}"><span>${label}</span><div><strong>Fila ${issue.row} · ${escapeHTML(issue.plugin || 'Sin nombre')}</strong><p>${escapeHTML(issue.message)}</p></div></article>`;
  }

  function prepareExcelReview(result) {
    const mergePlan = Excel.planMerge(result, state.modules);
    state.importReview = { result, mergePlan };
    const stats = result.stats;
    els.excelSourceLabel.textContent = `${result.source.fileName || 'Plugins.xlsx'} · ${result.source.sheetName || 'Hoja'} · ${stats.rows} filas leídas`;
    els.excelSummaryGrid.innerHTML = `
      <div><span>FILAS</span><strong>${stats.rows}</strong></div>
      <div><span>MÓDULOS VÁLIDOS</span><strong>${stats.valid}</strong></div>
      <div><span>NUEVOS</span><strong>${mergePlan.createCount}</strong></div>
      <div><span>ACTUALIZACIONES</span><strong>${mergePlan.updateCount}</strong></div>
      <div><span>AVISOS</span><strong>${stats.warnings}</strong></div>
      <div><span>ERRORES / OMITIDOS</span><strong>${stats.errors}</strong></div>`;
    els.excelIssueCount.textContent = result.issues.length ? `${result.issues.length} incidencias` : 'Sin incidencias';
    els.excelIssues.innerHTML = result.issues.length
      ? result.issues.map(importIssueHTML).join('')
      : '<div class="excel-no-issues">✓ No se detectaron problemas en los datos.</div>';
    els.confirmExcelImport.disabled = !mergePlan.plans.length;
    els.confirmExcelImport.textContent = mergePlan.plans.length ? `Importar ${mergePlan.plans.length} módulos` : 'Nada que importar';
    openExcelModal();
  }

  async function reviewExcelFile(file) {
    try {
      showToast('Leyendo Excel…');
      const result = await Excel.fromWorkbookFile(file);
      prepareExcelReview(result);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'No se pudo leer el archivo Excel.');
    }
  }

  function reviewBundledCatalog() {
    try {
      prepareExcelReview(Excel.fromBundledCatalog(window.PLUGIN_MATCH_EXCEL_CATALOG));
    } catch (error) {
      console.error(error);
      showToast('No se pudo cargar el catálogo incluido.');
    }
  }

  async function commitExcelImport({ silent = false } = {}) {
    const review = state.importReview;
    if (!review?.mergePlan?.plans?.length) return;
    const modules = review.mergePlan.plans.map(plan => ensureShape(plan.merged));
    await DB.putMany(modules);
    localStorage.setItem('pluginMatchCatalogSeedV12', '1');
    await refreshLibrary();
    closeExcelModal();
    state.importReview = null;
    if (modules[0]) await loadModule(modules[0].id);
    if (!silent) {
      const { createCount, updateCount } = review.mergePlan;
      showToast(`Excel integrado: ${createCount} nuevos · ${updateCount} actualizados.`);
    }
  }

  async function seedBundledCatalogIfNeeded() {
    if (localStorage.getItem('pluginMatchCatalogSeedV12') === '1') return;
    const result = Excel.fromBundledCatalog(window.PLUGIN_MATCH_EXCEL_CATALOG);
    const existing = await DB.getAll();
    const mergePlan = Excel.planMerge(result, existing.map(ensureShape));
    if (mergePlan.plans.length) await DB.putMany(mergePlan.plans.map(plan => ensureShape(plan.merged)));
    localStorage.setItem('pluginMatchCatalogSeedV12', '1');
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
    [els.developerFilter, els.typeFilter, els.subgroupFilter].forEach(select => select.addEventListener('change', renderLibrary));
    els.excelImportBtn.addEventListener('click', () => els.excelFile.click());
    els.excelFile.addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (file) reviewExcelFile(file);
      event.target.value = '';
    });
    els.loadBundledCatalog.addEventListener('click', reviewBundledCatalog);
    els.confirmExcelImport.addEventListener('click', () => commitExcelImport());
    $$('[data-close-excel]').forEach(button => button.addEventListener('click', closeExcelModal));
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !els.excelModal.hidden) closeExcelModal(); });
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
    await seedBundledCatalogIfNeeded();
    await refreshLibrary();
    const first = state.modules[0];
    if (first) await loadModule(first.id);
    else await newModule();
  }

  init().catch(error => {
    console.error(error);
    showToast('Studio no pudo iniciarse. Usa Live Server en lugar de file://.');
  });
})();
