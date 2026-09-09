window.PLUGIN_MATCH_DEFAULTS = {
  sampleModule: {
    id: 'fet76-arturia',
    name: 'FET-76',
    developer: 'ARTURIA',
    category: 'Compressor',
    subtype: 'FET',
    rating: 4.8,
    formats: 'VST3 / AU / AAX',
    operatingSystems: 'Win & macOS',
    downloadUrl: '',
    description: 'El Arturia Comp FET-76 recrea minuciosamente el circuito clásico D/E del UREI 1176, modelando la respuesta de sus transistores FET y el amplificador Clase A.\n\nAporta el ponche, la presencia y la calidez armónica que definió décadas de producciones legendarias, combinándolo con flexibilidad digital.',
    image: {
      src: 'assets/fet76-main.png',
      zoom: 1,
      offsetX: 0,
      offsetY: 0
    },
    controls: [
      { id: 'input', title: 'Input', description: 'Regula el ingreso de señal al circuito y define cuán fuerte golpeará el umbral.', x: 13, y: 52, labelX: 10, labelY: 23 },
      { id: 'output', title: 'Output', description: 'Compensa la pérdida de dB después de la compresión y ajusta el nivel final.', x: 31, y: 52, labelX: 34, labelY: 18 },
      { id: 'attack', title: 'Attack', description: 'Controla la velocidad a la que actúa el compresor una vez superado el umbral.', x: 47, y: 33, labelX: 53, labelY: 15 },
      { id: 'release', title: 'Release', description: 'Determina cuánto tarda el compresor en soltar la señal procesada.', x: 47, y: 68, labelX: 21, labelY: 84 },
      { id: 'ratio', title: 'Ratio', description: 'Define la cantidad de reducción de ganancia aplicada cuando la señal supera el umbral.', x: 59, y: 58, labelX: 49, labelY: 83 },
      { id: 'meter', title: 'VU Meter', description: 'Referencia visual del procesamiento. Puede mostrar GR, IN u OUT según el modo seleccionado.', x: 73, y: 58, labelX: 78, labelY: 13 },
      { id: 'mix', title: 'Mix', description: 'Mezcla la señal original con la señal comprimida para facilitar compresión paralela.', x: 86, y: 52, labelX: 88, labelY: 46 },
      { id: 'bypass', title: 'Bypass', description: 'Activa o desactiva el procesamiento para comparar la señal original y la procesada.', x: 83, y: 77, labelX: 83, labelY: 84 }
    ],
    idealFor: [
      { title: 'Voces Líderes', description: 'Mantiene las voces al frente de la mezcla con una consistencia de nivel sólida y un carácter directo.' },
      { title: 'Baterías y cajas', description: 'Añade pegada a la caja y permite controlar transitorios muy rápidos.' },
      { title: 'Bajo y Guitarras', description: 'Proporciona sustain y ayuda a compactar instrumentos rítmicos dentro de la mezcla.' }
    ],
    qualities: [
      { title: 'Ataque ultrarrápido', description: 'Tiempos de respuesta muy rápidos para controlar transitorios agresivos.' },
      { title: '“All-buttons” Mode', description: 'Modo de compresión extrema con un carácter más saturado y agresivo.' },
      { title: 'Input / Output Link', description: 'Facilita ajustar ganancia y comparar el carácter del procesamiento.' }
    ],
    updatedAt: null
  }
};
