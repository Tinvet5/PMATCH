# PLUGIN MATCH — v1.2.1 Public Catalogue

## Objetivo
Conectar por primera vez el contenido importado desde `Plugins.xlsx` con el sitio público. Studio continúa siendo el editor; el sitio público ahora consume el mismo catálogo.

## Cambios

- Nuevo `plugins.html`: catálogo público dinámico de módulos.
- Nuevo filtro público por familia, tipo, subgrupo y desarrollador.
- Búsqueda de texto sobre nombre, desarrollador, descripción, usos y cualidades.
- Ordenamiento A–Z, por desarrollador o por tipo.
- El home genera automáticamente las familias a partir del catálogo Excel y muestra el número de módulos por familia.
- Cada tarjeta pública enlaza a `module.html?id=<id>`.
- `module.html` ahora puede abrir cualquier módulo del Excel aunque todavía no haya sido editado en Studio.
- Si existe una versión editada en IndexedDB, el sitio público del mismo navegador usa esa versión como override visual/editorial.
- Si un módulo todavía no tiene imagen, se muestra una imagen de categoría y el estado `IMAGEN PENDIENTE`.
- Si un módulo tiene imagen y hotspots de Studio, el diagrama interactivo se muestra normalmente.
- `compressors.html` se mantiene como enlace de compatibilidad y redirige al catálogo filtrado por compresores.
- El FET-76 conserva el ejemplo visual/controles de Studio como módulo de demostración.

## Arquitectura actual

`Plugins.xlsx` → catálogo incluido → Studio / catálogo público → página de módulo

En esta etapa, los cambios hechos en Studio se guardan en IndexedDB. Por ello, se ven inmediatamente en el sitio público del mismo navegador, pero todavía no se sincronizan entre dispositivos. Esa sincronización llegará con la futura base de datos/backend.
