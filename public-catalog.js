(function () {
  const Excel = window.PluginMatchExcelImporter;
  const DB = window.PluginMatchStudioDB;
  const bundled = window.PLUGIN_MATCH_EXCEL_CATALOG;
  const defaults = window.PLUGIN_MATCH_DEFAULTS;

  const FAMILY_DEFINITIONS = [
    { key: 'compresores', label: 'COMPRESORES', image: 'compressors.png' },
    { key: 'reverbs', label: 'REVERBS', image: 'reverbs.png' },
    { key: 'ecualizadores', label: 'ECUALIZADORES', image: 'eq.png' },
    { key: 'delays', label: 'DELAYS', image: 'delays.png' },
    { key: 'channel-strip', label: 'CHANNEL STRIP', image: 'channel-strip.png' },
    { key: 'limitadores', label: 'LIMITADORES', image: 'limiters.png' },
    { key: 'sintetizadores', label: 'SINTETIZADORES', image: 'synthesizers.png' },
    { key: 'instrumentos', label: 'INSTRUMENTOS', image: 'virtual-instruments.png' },
    { key: 'saturacion-distorsion', label: 'SATURACIÓN / DISTORSIÓN', image: 'saturators.png' },
    { key: 'modulacion', label: 'MODULACIÓN', image: 'phasers.png' },
    { key: 'lofi-texturas', label: 'LO-FI / TEXTURAS', image: 'lofi.png' },
    { key: 'preamps', label: 'PREAMPS / EQ', image: 'channel-strip.png' },
    { key: 'procesamiento-vocal', label: 'PROCESAMIENTO VOCAL', image: 'autotune.png' },
    { key: 'filtros', label: 'FILTROS', image: 'analyzers.png' },
    { key: 'procesamiento', label: 'PROCESAMIENTO', image: 'analyzers.png' },
    { key: 'otros', label: 'OTROS', image: 'virtual-instruments.png' }
  ];

  const FAMILY_MAP = new Map(FAMILY_DEFINITIONS.map(item => [item.key, item]));

  function normalize(value) {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function familyKey(module) {
    const type = normalize(module.category || module.filters?.type);
    if (type.includes('compresor')) return 'compresores';
    if (type.includes('reverb')) return 'reverbs';
    if (type === 'eq' || type.includes('ecualizador')) return 'ecualizadores';
    if (type.includes('delay') || type.includes('echo')) return 'delays';
    if (type.includes('channel strip')) return 'channel-strip';
    if (type.includes('limitador') || type.includes('clipper')) return 'limitadores';
    if (type.includes('sintetizador')) return 'sintetizadores';
    if (type.includes('piano') || type.includes('libreria') || type.includes('contenedor')) return 'instrumentos';
    if (type.includes('satur') || type.includes('distors')) return 'saturacion-distorsion';
    if (type.includes('phaser') || type.includes('flanger') || type.includes('chorus') || type.includes('modulador')) return 'modulacion';
    if (type.includes('lo-fi') || type.includes('textura') || type.includes('imagen sonora')) return 'lofi-texturas';
    if (type.includes('preamplificador')) return 'preamps';
    if (type.includes('vocal') || type.includes('autotune')) return 'procesamiento-vocal';
    if (type.includes('filtro')) return 'filtros';
    if (type.includes('excitador') || type.includes('bus') || type.includes('emulacion')) return 'procesamiento';
    return 'otros';
  }

  function familyFor(module) {
    return FAMILY_MAP.get(familyKey(module)) || FAMILY_MAP.get('otros');
  }

  function fallbackImage(module) {
    return `assets/${familyFor(module).image}`;
  }

  function sameModule(a, b) {
    if (!a || !b) return false;
    if (a.sourceKey && b.sourceKey && a.sourceKey === b.sourceKey) return true;
    return normalize(a.name) === normalize(b.name) && normalize(a.developer) === normalize(b.developer);
  }

  function mergeVisual(base, saved) {
    if (!saved) return base;
    return {
      ...base,
      ...saved,
      name: saved.name || base.name,
      developer: saved.developer || base.developer,
      category: saved.category || base.category,
      subtype: saved.subtype || base.subtype,
      description: saved.description || base.description,
      idealFor: Array.isArray(saved.idealFor) && saved.idealFor.length ? saved.idealFor : base.idealFor,
      qualities: Array.isArray(saved.qualities) && saved.qualities.length ? saved.qualities : base.qualities,
      source: saved.source || base.source,
      filters: saved.filters || base.filters,
      image: saved.image?.src ? saved.image : base.image,
      controls: Array.isArray(saved.controls) && saved.controls.length ? saved.controls : base.controls
    };
  }

  function bundledModules() {
    if (!Excel || !bundled) return [];
    const result = Excel.fromBundledCatalog(bundled);
    const sample = defaults?.sampleModule;
    return result.modules.map(module => {
      if (sample && sameModule(module, sample)) {
        return {
          ...module,
          id: sample.id,
          rating: sample.rating,
          formats: sample.formats,
          operatingSystems: sample.operatingSystems,
          downloadUrl: sample.downloadUrl,
          image: sample.image,
          controls: sample.controls
        };
      }
      return module;
    });
  }

  async function getModules() {
    const base = bundledModules();
    if (!DB?.getAll) return base;
    try {
      const saved = await DB.getAll();
      const merged = base.map(module => {
        const local = saved.find(item => sameModule(item, module));
        return mergeVisual(module, local);
      });
      saved.forEach(local => {
        if (!merged.some(module => sameModule(module, local))) merged.push(local);
      });
      return merged.sort((a, b) => {
        const familyA = familyFor(a).label;
        const familyB = familyFor(b).label;
        return familyA.localeCompare(familyB, 'es') || String(a.name).localeCompare(String(b.name), 'es');
      });
    } catch (error) {
      console.warn('No se pudo leer IndexedDB; se usará el catálogo incluido.', error);
      return base;
    }
  }

  async function getModule(id) {
    const modules = await getModules();
    return modules.find(module => module.id === id)
      || modules.find(module => normalize(module.id) === normalize(id))
      || null;
  }

  function familyStats(modules) {
    return FAMILY_DEFINITIONS
      .map(family => ({
        ...family,
        count: modules.filter(module => familyKey(module) === family.key).length
      }))
      .filter(family => family.count > 0);
  }

  function uniqueValues(modules, field) {
    const values = modules
      .map(module => {
        if (field === 'developer') return module.developer;
        if (field === 'type') return module.category;
        if (field === 'subgroup') return module.subtype;
        return '';
      })
      .filter(value => String(value || '').trim());
    return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b), 'es'));
  }

  function searchText(module) {
    return normalize([
      module.name,
      module.developer,
      module.category,
      module.subtype,
      module.description,
      ...(module.idealFor || []).flatMap(item => [item.title, item.description]),
      ...(module.qualities || []).flatMap(item => [item.title, item.description])
    ].join(' '));
  }

  window.PluginMatchPublicCatalog = {
    FAMILY_DEFINITIONS,
    familyFor,
    familyKey,
    familyStats,
    fallbackImage,
    getModule,
    getModules,
    normalize,
    searchText,
    uniqueValues
  };
})();
