(function () {
  const REQUIRED_HEADERS = {
    developer: ['EMPRESA / DESARROLLADOR', 'EMPRESA', 'DESARROLLADOR'],
    plugin: ['PLUGIN', 'NOMBRE', 'PLUGIN / VST'],
    type: ['TIPO', 'CATEGORIA', 'CATEGORÍA'],
    subgroup: ['SUBGRUPO', 'SUBTIPO'],
    description: ['DESCRIPCION', 'DESCRIPCIÓN'],
    idealFor: ['IDEAL PARA'],
    qualities: ['CUALIDADES']
  };

  const DISPLAY_ALIASES = {
    'emulacion': 'Emulación',
    'valvulas': 'Válvulas',
    'estado solido': 'Estado sólido',
    'parametrico': 'Paramétrico',
    'dinamico': 'Dinámico',
    'ecualizador / saturation': 'Ecualizador / Saturación'
  };

  function normalize(value) {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function normalizeHeader(value) {
    return normalize(value).replace(/[^a-z0-9/]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function slugify(value) {
    return String(value || 'module')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `module-${Date.now()}`;
  }

  function canonicalDisplay(value) {
    const text = String(value ?? '').trim();
    if (!text) return '';
    return DISPLAY_ALIASES[normalize(text)] || text;
  }

  function splitNumberedCards(value) {
    const text = String(value ?? '').replace(/\r\n/g, '\n').trim();
    if (!text) return [];

    let parts = text.split(/\n\s*\n(?=\s*\d+\.\s*)/g);
    if (parts.length === 1) parts = text.split(/\n(?=\s*\d+\.\s*)/g);

    return parts
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const cleaned = part.replace(/^\s*\d+\.\s*/, '').trim();
        const separator = cleaned.indexOf(':');
        if (separator === -1) return { title: cleaned, description: '' };
        return {
          title: cleaned.slice(0, separator).trim(),
          description: cleaned.slice(separator + 1).trim()
        };
      });
  }

  function sourceKeyFor(record) {
    return slugify(`${record.developer}-${record.plugin}`);
  }

  function convertRecord(record, sourceMeta = {}) {
    const category = canonicalDisplay(record.type);
    const subtype = canonicalDisplay(record.subgroup);
    const sourceKey = sourceKeyFor(record);
    return {
      schemaVersion: '1.2',
      id: slugify(`${record.plugin}-${record.developer}`),
      sourceKey,
      name: String(record.plugin || '').trim(),
      developer: String(record.developer || '').trim(),
      category,
      subtype,
      filters: {
        developer: String(record.developer || '').trim(),
        type: category,
        subgroup: subtype,
        developerKey: normalize(record.developer),
        typeKey: normalize(category),
        subgroupKey: normalize(subtype)
      },
      rating: 0,
      formats: '',
      operatingSystems: '',
      downloadUrl: '',
      description: String(record.description || '').trim(),
      idealFor: splitNumberedCards(record.idealFor),
      qualities: splitNumberedCards(record.qualities),
      image: { src: '', zoom: 1, offsetX: 0, offsetY: 0 },
      controls: [],
      source: {
        kind: 'excel',
        workbook: sourceMeta.fileName || sourceMeta.file || 'Plugins.xlsx',
        sheet: sourceMeta.sheetName || sourceMeta.sheet || '',
        row: Number(record.row || 0) || null,
        rawCategory: String(record.type || '').trim(),
        rawSubtype: String(record.subgroup || '').trim(),
        importedAt: new Date().toISOString()
      },
      updatedAt: null
    };
  }

  function analyzeRecords(records, sourceMeta = {}) {
    const issues = [];
    const seen = new Map();
    const modules = [];
    const duplicateGroups = new Map();

    records.forEach((record, index) => {
      const row = Number(record.row || index + 2);
      const developer = String(record.developer || '').trim();
      const plugin = String(record.plugin || '').trim();
      const type = String(record.type || '').trim();
      const description = String(record.description || '').trim();
      const key = sourceKeyFor({ developer, plugin });

      const requiredMissing = [];
      if (!developer) requiredMissing.push('EMPRESA / DESARROLLADOR');
      if (!plugin) requiredMissing.push('PLUGIN');
      if (!type) requiredMissing.push('TIPO');
      if (!description) requiredMissing.push('DESCRIPCIÓN');

      if (requiredMissing.length) {
        issues.push({
          level: 'error', row, plugin: plugin || 'Sin nombre', developer,
          message: `Faltan campos obligatorios: ${requiredMissing.join(', ')}`
        });
        return;
      }

      if (seen.has(key)) {
        const firstRow = seen.get(key);
        if (!duplicateGroups.has(key)) duplicateGroups.set(key, [firstRow]);
        duplicateGroups.get(key).push(row);
        issues.push({
          level: 'error', row, plugin, developer,
          message: `Duplicado de desarrollador + plugin. Ya existe en la fila ${firstRow}. Esta fila se omitirá.`
        });
        return;
      }
      seen.set(key, row);

      if (!String(record.subgroup || '').trim()) {
        issues.push({ level: 'warning', row, plugin, developer, message: 'SUBGRUPO está vacío. El módulo se importará igualmente.' });
      }
      if (!String(record.qualities || '').trim()) {
        issues.push({ level: 'warning', row, plugin, developer, message: 'CUALIDADES está vacío. El módulo se importará igualmente.' });
      }
      if (!String(record.idealFor || '').trim()) {
        issues.push({ level: 'warning', row, plugin, developer, message: 'IDEAL PARA está vacío. El módulo se importará igualmente.' });
      }

      modules.push(convertRecord({ ...record, row }, sourceMeta));
    });

    return {
      source: sourceMeta,
      modules,
      issues,
      stats: {
        rows: records.length,
        valid: modules.length,
        warnings: issues.filter(issue => issue.level === 'warning').length,
        errors: issues.filter(issue => issue.level === 'error').length,
        duplicates: duplicateGroups.size,
        developers: new Set(modules.map(module => module.developer).filter(Boolean)).size,
        types: new Set(modules.map(module => module.category).filter(Boolean)).size,
        subgroups: new Set(modules.map(module => module.subtype).filter(Boolean)).size
      }
    };
  }

  function findHeaderIndex(headerRow, candidates) {
    const normalizedCandidates = candidates.map(normalizeHeader);
    return headerRow.findIndex(cell => normalizedCandidates.includes(normalizeHeader(cell)));
  }

  function mapHeaderIndexes(headerRow) {
    const indexes = {};
    Object.entries(REQUIRED_HEADERS).forEach(([key, candidates]) => {
      indexes[key] = findHeaderIndex(headerRow, candidates);
    });
    return indexes;
  }

  function hasCoreHeaders(indexes) {
    return ['developer', 'plugin', 'type', 'description'].every(key => indexes[key] >= 0);
  }

  function rowsFromMatrix(matrix, sourceMeta = {}) {
    let headerRowIndex = -1;
    let indexes = null;

    for (let i = 0; i < Math.min(matrix.length, 12); i += 1) {
      const candidate = mapHeaderIndexes(matrix[i] || []);
      if (hasCoreHeaders(candidate)) {
        headerRowIndex = i;
        indexes = candidate;
        break;
      }
    }

    if (headerRowIndex === -1 || !indexes) {
      throw new Error('No se encontraron las columnas esperadas de PLUGIN MATCH en esta hoja.');
    }

    return matrix.slice(headerRowIndex + 1).map((row, offset) => ({
      row: headerRowIndex + offset + 2,
      developer: indexes.developer >= 0 ? row[indexes.developer] : '',
      plugin: indexes.plugin >= 0 ? row[indexes.plugin] : '',
      type: indexes.type >= 0 ? row[indexes.type] : '',
      subgroup: indexes.subgroup >= 0 ? row[indexes.subgroup] : '',
      description: indexes.description >= 0 ? row[indexes.description] : '',
      idealFor: indexes.idealFor >= 0 ? row[indexes.idealFor] : '',
      qualities: indexes.qualities >= 0 ? row[indexes.qualities] : ''
    })).filter(record => Object.values(record).some((value, idx) => idx === 0 ? false : String(value ?? '').trim()));
  }

  let xlsxLoader = null;
  async function ensureXLSX() {
    if (window.XLSX) return window.XLSX;
    if (xlsxLoader) return xlsxLoader;
    xlsxLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.async = true;
      script.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error('El lector de Excel no se inicializó.'));
      script.onerror = () => reject(new Error('No se pudo cargar el lector de Excel. Comprueba tu conexión o usa el catálogo incluido.'));
      document.head.appendChild(script);
    });
    return xlsxLoader;
  }

  async function fromWorkbookFile(file) {
    await ensureXLSX();
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', cellText: true, cellDates: false });
    let lastError = null;

    for (const sheetName of workbook.SheetNames) {
      try {
        const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', raw: false });
        const records = rowsFromMatrix(matrix, { fileName: file.name, sheetName });
        return analyzeRecords(records, { fileName: file.name, sheetName });
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('No se encontró una hoja compatible.');
  }

  function fromBundledCatalog(payload) {
    if (!payload?.rows?.length) throw new Error('El catálogo incluido no contiene filas.');
    return analyzeRecords(payload.rows, {
      fileName: payload.source?.file || 'Plugins.xlsx',
      sheetName: payload.source?.sheet || 'Hoja 1',
      bundled: true
    });
  }

  function sameModule(a, b) {
    if (!a || !b) return false;
    if (a.sourceKey && b.sourceKey && a.sourceKey === b.sourceKey) return true;
    return normalize(a.name) === normalize(b.name) && normalize(a.developer) === normalize(b.developer);
  }

  function mergeModule(incoming, existing) {
    if (!existing) return { ...incoming, updatedAt: new Date().toISOString() };
    return {
      ...existing,
      schemaVersion: '1.2',
      sourceKey: incoming.sourceKey,
      name: incoming.name,
      developer: incoming.developer,
      category: incoming.category,
      subtype: incoming.subtype,
      filters: incoming.filters,
      description: incoming.description,
      idealFor: incoming.idealFor,
      qualities: incoming.qualities,
      source: incoming.source,
      // Campos editoriales/visuales se conservan deliberadamente:
      rating: existing.rating ?? incoming.rating,
      formats: existing.formats ?? incoming.formats,
      operatingSystems: existing.operatingSystems ?? incoming.operatingSystems,
      downloadUrl: existing.downloadUrl ?? incoming.downloadUrl,
      image: existing.image || incoming.image,
      controls: Array.isArray(existing.controls) ? existing.controls : incoming.controls,
      id: existing.id || incoming.id,
      updatedAt: new Date().toISOString()
    };
  }

  function planMerge(result, existingModules = []) {
    let createCount = 0;
    let updateCount = 0;
    const plans = result.modules.map(incoming => {
      const existing = existingModules.find(module => sameModule(module, incoming));
      if (existing) updateCount += 1;
      else createCount += 1;
      return { incoming, existing, merged: mergeModule(incoming, existing) };
    });
    return { plans, createCount, updateCount };
  }

  window.PluginMatchExcelImporter = {
    analyzeRecords,
    canonicalDisplay,
    convertRecord,
    fromBundledCatalog,
    fromWorkbookFile,
    mergeModule,
    normalize,
    planMerge,
    slugify,
    splitNumberedCards
  };
})();
