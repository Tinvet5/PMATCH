# PLUGIN MATCH — v1.3 Responsive UI

Esta iteración mantiene intacto el pipeline de contenido de v1.2/v1.2.1 y se enfoca en la experiencia pública: navegación, catálogo y módulos en escritorio, tablet y móvil.

## Ejecutar el proyecto

Usa VS Code + Live Server o ejecuta:

```bash
python -m http.server 8080
```

Luego abre:

```text
http://localhost:8080/
```

## Qué cambia en v1.3

### Navegación responsive
- Header reorganizado para tablet y móvil.
- Menú lateral móvil con acceso a Catálogo, Destacados, Familias, PM-GAME y Studio.
- Barra de búsqueda usable en pantallas pequeñas.
- El icono de cuenta queda como placeholder visual para la futura etapa de login.

### Home
- Hero de PLUGIN MATCH ajustado para formato vertical.
- Carrusel de Plugins del Mes con indicadores y gesto de swipe.
- Familias del catálogo adaptadas a 4, 2 o 1 columnas según el ancho.
- Mejor jerarquía visual en tarjetas y contadores.

### Catálogo
- Filtros en panel lateral de escritorio.
- En móvil, los filtros pasan a un drawer.
- Indicador de cantidad de filtros activos.
- Chips para ver y quitar filtros individualmente.
- Tarjetas compactas horizontales en teléfonos.
- Barra de resultados y ordenamiento optimizada para pantallas pequeñas.

### Módulos
- En escritorio se mantienen hotspots, etiquetas y líneas.
- En móvil se ocultan las etiquetas externas para no saturar la imagen.
- Los hotspots siguen siendo interactivos.
- Se genera una fila horizontal de controles debajo de la imagen.
- Al tocar un control se actualiza el cuadro de explicación.
- Descripción, valoración, Ideal para y Cualidades se apilan en una lectura vertical más limpia.
- Búsqueda global desde la página del módulo.

### Studio
- El editor conserva el sistema de arrastre corregido.
- Se mantiene la importación desde Excel y el catálogo local.
- Studio sigue siendo principalmente una herramienta de escritorio/tablet.

## Archivos principales

- `index.html` — Home pública.
- `plugins.html` — Catálogo público.
- `module.html?id=<id>` — Módulo público.
- `studio.html` — Editor interno.
- `styles.css` — Estilos globales y responsive.
- `catalog.css` — Catálogo responsive.
- `module.css` — Módulo responsive.
- `ui.js` — Menú móvil y comportamiento común.
- `app.js` — Home, familias y carrusel.
- `catalog.js` — Búsqueda, filtros, chips y drawer móvil.
- `module-renderer.js` — Render dinámico y navegación de controles.

## Almacenamiento

El catálogo base sigue viniendo de Excel. Los cambios visuales hechos en Studio siguen guardándose localmente en IndexedDB durante esta etapa de prototipo.

La futura migración a backend/base de datos permitirá publicar esos cambios para todos los usuarios.
