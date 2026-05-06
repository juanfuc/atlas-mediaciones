# Plan de implementación por tickets — Atlas de mediaciones v3

**Para ejecutar con Claude Code Sonnet 4.6.**  
Cada ticket es autocontenido y debe ejecutarse de forma incremental.

---

## 0. Lectura previa: estado real del repositorio

Antes de ejecutar tickets, se fija este punto de partida:

- SvelteKit minimal ya creado en JavaScript, con `adapter-static` configurado y `prerender = true` en `+layout.js`.
- `data/raw/` contiene los 10 CSV canónicos y están poblados.
- `scripts/` y `static/data/` existen, pero están vacíos.
- `entities.csv` real tiene más columnas que las listadas inicialmente en el plan técnico, por ejemplo: `subtype`, `creator_display`, `local_src`, `iiif_url`, `source_reference`, `model_cluster`, `source_table`, `source_row_id`.
- El agente ejecutor **no debe alterar ni renombrar columnas**. Debe leer las columnas que necesite e ignorar las columnas extra.
- `_agent/referente.png` sirve como referencia de tono visual: nav superior, título hero, cuatro tarjetas principales, panel discreto con clave de lectura, fondo cálido, filete siena y footer simple.
- No hay repositorio Git todavía. La inicialización de Git y GitHub Pages queda fuera de los primeros tickets de código.

---

## 1. Orden de implementación

1. **T-00 — Fundamentos:** base path GitHub Pages + dependencias.
2. **T-01 — `scripts/build-data.js`:** CSV → JSON derivados.
3. **T-02 — Diseño base:** tokens, layout, navegación, home.
4. **T-03 — Stores y utilidades compartidas:** carga de datos, filtros, demo toggle.
5. **T-04 — `/repositorio`:** SourceCard + filtros.
6. **T-05 — `/fuente/[id]`:** detalle de entidad como nodo relacional.
7. **T-06 — `/grafo`:** vis-network.
8. **T-07 — `/mapa`:** Leaflet por roles de lugar.
9. **T-08 — `/linea-tiempo`:** HTML/CSS/SVG simple.
10. **T-09 — Validaciones, manifest y JSON-LD.**
11. **T-10 — Cierre:** build, preview, despliegue y capturas.

Los tickets T-04 a T-08 dependen de T-01 y T-03. T-02 puede ejecutarse en paralelo a T-01.

---

# T-00 — Fundamentos del proyecto

## Objetivo

Dejar el proyecto listo para GitHub Pages e instalar las dependencias de visualización.

## Cambios esperados

- `svelte.config.js`: añadir `kit.paths.base` configurable por variable de entorno `BASE_PATH`, por defecto vacío en desarrollo y `/atlas-mediaciones` en producción.
- `package.json`: añadir dependencias y scripts:
  - `leaflet` y `vis-network` como `dependencies`.
  - `papaparse` como `devDependency`.
  - `"build:data": "node scripts/build-data.js"`.
  - `"prebuild": "npm run build:data"`.
- Si `scripts/build-data.js` no existe todavía, crear un stub temporal que imprima `pendiente` para que `npm run build:data` no falle antes de T-01.

## Comandos sugeridos

```bash
npm i leaflet vis-network
npm i -D papaparse
```

En PowerShell, la prueba futura de build con base path será:

```powershell
$env:BASE_PATH="/atlas-mediaciones"; npm run build
```

No instalar `cross-env` todavía.

## Criterios de aceptación

- `npm run dev` levanta sin errores.
- `paths.base` está disponible mediante `$app/paths` y vale `''` en desarrollo.
- `npm run build:data` ejecuta el script existente o el stub temporal.

## No tocar

- `data/raw/*.csv`.
- Nombres de columnas.
- Carpeta `_agent/`.

---

# T-01 — `scripts/build-data.js`: CSV → JSON

## Objetivo

Generar todos los archivos derivados en `static/data/`, leyendo CSV con PapaParse.

## Cambios esperados

Crear o completar:

```text
scripts/build-data.js
```

El script debe generar, en este orden:

1. `static/data/entities.json`
2. `static/data/relations.json`
3. `static/data/graph.json`
4. `static/data/map.geojson`
5. `static/data/timeline.json`
6. `static/data/vocabularies.json`
7. `static/data/manifest.json`
8. `static/data/roulin.jsonld`

## Entradas CSV

```text
data/raw/entities.csv
data/raw/relations.csv
data/raw/agents.csv
data/raw/places.csv
data/raw/institutions.csv
data/raw/entity_places.csv
data/raw/events.csv
data/raw/vocab_relations.csv
data/raw/vocab_place_roles.csv
data/raw/vocab_confidence.csv
```

## Requisitos del script

- Usar `papaparse`. No usar `split(',')`.
- Leer columnas por nombre, no por índice.
- No eliminar ni reformatear columnas extra de los CSV.
- Normalizar `include_demo` y `needs_review` como booleanos en los JSON derivados.
- Separar campos multivalor por punto y coma cuando aplique.
- Enriquecer `relations.json` con:
  - `subject_label`
  - `predicate_label`
  - `object_label`
- Generar `graph.json` con:
  - `nodes`
  - `edges`
  - `include_demo` en nodos y aristas
  - `chain`
  - `confidence`
  - `predicate`
- Generar `map.geojson` a partir de `places.csv` + `entity_places.csv`.
- El mapa debe respetar `place_role`; no inferir roles.
- Features sin `lat/lng` válidos deben omitirse del GeoJSON y registrarse como warning.
- Generar `timeline.json` desde `events.csv`.
- Generar `vocabularies.json` con:
  - `vocab_relations`
  - `vocab_place_roles`
  - `vocab_confidence`
- Generar `manifest.json` con:
  - fecha de generación;
  - conteos totales;
  - conteos demo;
  - warnings.
- Si una relación referencia un `subject_id` u `object_id` inexistente, registrarla como warning y no eliminarla.
- Si un predicado no existe en `vocab_relations.csv`, registrarlo como warning y no inventarlo.
- Si un `place_role` no existe en `vocab_place_roles.csv`, registrarlo como warning y no inventarlo.
- Generar `roulin.jsonld` mínimo con `@context` y `@graph`.
- El script debe ser idempotente.
- `npm run build:data` debe terminar con código 0 salvo que los CSV sean ilegibles.

## Criterios de aceptación

- `npm run build:data` produce los 8 archivos esperados.
- `manifest.json` reporta números coherentes.
- Si hay referencias rotas, aparecen como warnings y no detienen la generación.
- El script es idempotente.

## Riesgos

- Comillas y comas dentro de campos largos: usar PapaParse.
- Campos multivalor separados por `;`, no por coma.
- Columnas extra en CSV reales: ignorar sin borrar.

---

# T-02 — Diseño base: tokens, layout, home

## Objetivo

Definir el tono visual: sobrio, editorial, fondo cálido, acento siena, sin dashboardismo.

## Cambios esperados

- `src/app.html`: meta title `Atlas de mediaciones`, charset, favicon.
- `src/lib/styles/tokens.css`: variables CSS de paleta y tipografía.
- `src/routes/+layout.svelte`:
  - importar `tokens.css`;
  - estructura con `header`, `main` y `footer`;
  - filete siena superior de 2 px;
  - nav simple: Inicio · Repositorio · Grafo · Mapa · Línea de tiempo.
- `src/routes/+page.svelte`:
  - hero con título `Atlas de mediaciones`;
  - subtítulo `Corpus Roulin: imágenes, mediaciones y circulación visual`;
  - párrafo breve de presentación;
  - cuatro tarjetas de acceso a vistas;
  - panel lateral pequeño con clave de lectura: `documentada`, `inferida`, `hipotética`.

## Criterios de aceptación

- Layout responde a 1280 px y 768 px sin romperse.
- No hay emojis ni iconografía decorativa excesiva.
- Tipografía serif en titulares, sans en cuerpo, mono solo para signaturas.
- Filete siena `#8C3B22` arriba, fondo `#F4EFE6`.
- Tarjetas con borde `1px #D8CFC2`, padding generoso y sin sombras fuertes.

## No tocar

- No Tailwind.
- No Bootstrap.
- No UI kits.
- Solo CSS propio.

---

# T-03 — Stores y utilidades compartidas

## Objetivo

Centralizar carga de datos y toggle demo, para que las vistas compartan lógica.

## Cambios esperados

- `src/lib/data/loadData.js`:
  - `loadEntities()`
  - `loadRelations()`
  - `loadGraph()`
  - `loadMap()`
  - `loadTimeline()`
  - `loadVocabularies()`
  - usar `import { base } from '$app/paths'`.
  - cachear resultados en módulo.
- `src/lib/stores/demo.js`:
  - exportar `demoOnly = writable(true)`.
- `src/lib/utils/filters.js`:
  - `applyDemo`
  - `filterByChain`
  - `filterByType`
  - `filterByConfidence`
  - `filterByPredicate`
  - `filterByRole`
- `src/lib/components/DemoToggle.svelte`:
  - control único: `Solo demo / Corpus completo`.

## Criterios de aceptación

- Cambiar el toggle en una vista persiste al navegar a otra vista dentro de la sesión.
- `loadGraph()` puede llamarse desde dos componentes y no repite fetch innecesarios.

## No tocar

- Forma de los JSON producidos por T-01.

---

# T-04 — `/repositorio` con tarjetas y filtros

## Objetivo

Crear una vista de catálogo con tarjetas discretas y filtros.

## Cambios esperados

- `src/routes/repositorio/+page.svelte`.
- `src/lib/components/SourceCard.svelte`.
- `src/lib/components/ChainFilter.svelte`.
- `src/lib/components/ConfidenceBadge.svelte`.

## Funcionalidad

- Mostrar thumbnail si `image_url` existe; si no, placeholder.
- Mostrar título, tipo, fecha, agente, institución, signatura, cadena y badge demo.
- Click hacia `/fuente/[id]`.
- Filtros por:
  - `type`
  - `chain`
  - confianza asociada a relaciones
  - `DemoToggle`

## Criterios de aceptación

- `Solo demo` muestra solo entidades con `include_demo === true`.
- `Corpus completo` muestra todo lo visible.
- Filtros combinables.
- Tarjetas sobrias: sin shadows fuertes, bordes discretos, radio pequeño.

---

# T-05 — `/fuente/[id]`: detalle de entidad

## Objetivo

Mostrar cada fuente como nodo relacional.

## Cambios esperados

- `src/routes/fuente/[id]/+page.svelte`.
- `src/routes/fuente/[id]/+page.js` con prerender y entries.
- `src/lib/components/EntityPanel.svelte`.
- `src/lib/components/RelationBadge.svelte`.

## Funcionalidad

- Metadatos de entidad.
- Imagen o placeholder.
- Relaciones salientes.
- Relaciones entrantes.
- Eventos asociados.
- Lugares asociados por `place_role`.
- Notas curatoriales.

## Criterios de aceptación

- `npm run build` genera una página estática por cada entidad.
- Si no hay imagen, no se rompe el layout.
- Enlaces internos usan `base` desde `$app/paths`.

## Riesgo

- Prerender + base path puede romper enlaces. Usar siempre `base`.

---

# T-06 — `/grafo` con vis-network

## Objetivo

Implementar la vista relacional con toggle demo, filtros y panel lateral.

## Cambios esperados

- `src/routes/grafo/+page.svelte`.
- `src/lib/components/GraphView.svelte`.

## Funcionalidad

- Montar `vis-network` solo en `onMount`.
- Cargar `graph.json`.
- Filtros por:
  - cadena;
  - tipo de nodo;
  - predicado;
  - confianza;
  - demo/corpus completo.
- Estilo de aristas:
  - `documentada`: línea continua;
  - `inferida`: línea punteada;
  - `hipotetica`: línea discontinua.
- Panel lateral para nodo o relación seleccionada.

## Criterios de aceptación

- En `Solo demo`, grafo con tamaño razonable.
- En `Corpus completo`, no se cuelga.
- No hay errores de hidratación.

## Riesgos

- Grafo demasiado denso.
- SSR con vis-network. Importar dentro de `onMount`, no en top-level.

---

## T-06b — Reemplazo del grafo con D3/SVG

Este ticket reemplaza la implementación actual de `GraphView.svelte`, originalmente hecha con `vis-network`, por una implementación en D3/SVG. La razón del cambio es obtener mayor control visual, estabilidad, integración estética con el sitio y una lectura más curatorial del grafo.

El objetivo no es hacer una red automática genérica, sino una visualización relacional argumentativa que funcione bien para la demo de sustentación y pueda escalar como base de investigación.

### No modificar

- `data/raw/*.csv`
- `scripts/build-data.js`
- estructura de `graph.json`
- rutas distintas de `/grafo`
- mapa
- línea de tiempo
- modelo de datos
- nombres de columnas CSV

### Dependencia permitida

- `npm i d3`

No agregar otras dependencias.

### Objetivo

Crear una visualización SVG estable y legible del grafo, orientada a la demo de sustentación y escalable como base de investigación.

La vista debe permitir mostrar las relaciones entre fuentes, imágenes, textos, agentes, lugares, instituciones, instrumentos y conceptos, con énfasis en:

- cadenas de mediación;
- grados de confianza;
- relaciones documentadas, inferidas e hipotéticas;
- lectura curatorial del corpus;
- alternancia entre “Solo demo” y “Corpus completo”.

### Requisitos funcionales

1. Usar D3/SVG, no canvas.
2. Reemplazar la lógica de `GraphView.svelte` basada en `vis-network`.
3. Mantener la ruta `/grafo`.
4. Mantener `src/routes/grafo/+page.js` y `src/routes/grafo/+page.svelte` salvo que un cambio mínimo sea necesario.
5. Abrir por defecto en modo “Solo demo”.
6. En modo “Solo demo”:
   - filtrar primero las aristas con `include_demo === true`;
   - conservar solo los nodos conectados a esas aristas;
   - si hay más de 70 relaciones demo, limitar a las primeras según `demo_priority`, `chain` o el orden disponible;
   - mostrar una nota discreta si se aplica límite.
7. En modo “Corpus completo”:
   - mostrar el corpus completo solo si es visualmente manejable;
   - si hay demasiadas relaciones, limitar temporalmente a 250 aristas visibles;
   - mostrar una nota discreta: “Corpus completo limitado para visualización inicial; use filtros para explorar.”
8. Mantener filtros combinables por:
   - `chain`;
   - `predicate`;
   - `confidence`;
   - tipo de nodo.
9. Añadir o conservar un contador visible:
   - `nodos visibles: X · relaciones visibles: Y`.
10. Si no hay datos visibles con los filtros seleccionados, mostrar un mensaje claro.
11. Mantener `DemoToggle`.
12. No implementar mapa ni línea de tiempo.

### Requisitos de layout

1. El grafo debe tener una disposición curatorial, no una nube caótica.
2. Agrupar visualmente por `chain`, por ejemplo:
   - `giast_archivo`;
   - `tapir`;
   - `quindiu_supia`;
   - `corpus_ampliado`;
   - otras cadenas si existen.
3. Preferir una distribución por columnas, bloques o bandas horizontales antes que una simulación física libre.
4. Si se usa `d3.forceSimulation`, debe ser limitada:
   - pocos ticks;
   - sin estabilización infinita;
   - detener la simulación;
   - no depender de ella para que el grafo aparezca.
5. El modo demo debe priorizar legibilidad y estabilidad.
6. El corpus completo puede ser más denso, pero no debe bloquear la vista.

### Requisitos visuales

1. Mantener diseño sobrio, académico y consistente con el resto del sitio.
2. Usar SVG responsive dentro de un contenedor con dimensiones controladas:
   - `width: 100%`;
   - `height` o `min-height` suficiente para lectura;
   - borde discreto;
   - fondo cálido coherente con la paleta.
3. Nodos:
   - pequeños;
   - sobrios;
   - sin colores saturados;
   - diferenciados por tipo o cadena de manera discreta.
4. Aristas:
   - discretas;
   - con etiquetas o títulos solo cuando sea legible;
   - diferenciadas por `confidence`.
5. Estilos de aristas por grado de confianza:
   - `documentada`: línea continua;
   - `inferida`: línea punteada;
   - `hipotetica`: línea discontinua.
6. Etiquetas:
   - visibles solo para nodos principales o al hover, si el grafo se satura;
   - evitar que todas las etiquetas se monten unas sobre otras.
7. Incluir una leyenda breve:
   - documentada;
   - inferida;
   - hipotética.

### Interacción

1. Añadir zoom/pan con `d3.zoom`.
2. Al seleccionar un nodo, mostrar panel lateral con:
   - `label`;
   - `type`;
   - `subtype`, si existe;
   - `chain`, si existe;
   - `id`;
   - enlace a `/fuente/[id]/` si corresponde a una entidad navegable.
3. Al seleccionar una arista, mostrar panel lateral con:
   - `subject_label`;
   - `predicate_label`;
   - `object_label`;
   - `confidence`;
   - `asserted_by`;
   - `assertion_basis`;
   - `evidence_source`;
   - `page_or_folio`;
   - `note`.
4. Si el usuario cambia filtros o alterna entre demo/corpus completo:
   - recalcular nodos y aristas visibles;
   - actualizar el SVG;
   - no duplicar nodos ni aristas;
   - no dejar elementos antiguos flotando.

### Criterios de aceptación

- `npm run build` pasa.
- `/grafo` muestra un SVG visible.
- No usa canvas.
- El modo demo se ve estable y legible.
- El toggle “Solo demo / Corpus completo” funciona.
- Los filtros modifican la red.
- El panel lateral funciona para nodos y aristas.
- El contador muestra valores mayores que cero cuando hay datos visibles.
- El grafo no se queda cargando.
- No aparece error de canvas.
- No se implementan mapa ni línea de tiempo.
- No se modifica el modelo de datos.

### Resumen esperado al terminar

El agente debe reportar:

- archivos modificados;
- si instaló `d3`;
- estrategia de layout adoptada;
- número de nodos/aristas visibles en modo demo;
- número de nodos/aristas visibles en corpus completo;
- si aplicó límites temporales;
- si `npm run build` pasó;
- cualquier decisión técnica tomada.

---

# T-07 — `/mapa` con Leaflet por roles de lugar

## Objetivo

Mapa de geografías superpuestas, no itinerario.

## Cambios esperados

- `src/routes/mapa/+page.svelte`.
- `src/lib/components/MapView.svelte`.

## Funcionalidad

- Montar Leaflet en `onMount`.
- Cargar `map.geojson`.
- Popup con:
  - lugar;
  - roles;
  - entidades asociadas;
  - cadenas.
- Filtros por `place_role`.
- `DemoToggle`.
- Tile layer OpenStreetMap con atribución.

## Criterios de aceptación

- Un lugar con varios roles no se duplica si varias capas están activas.
- Leaflet CSS importado correctamente.
- No se renderiza en SSR.

## Riesgos

- No inferir roles ausentes.
- Filtrar coordenadas inválidas.
- Importar `leaflet/dist/leaflet.css`.

---

# T-08 — `/linea-tiempo`

## Objetivo

Mostrar capas históricas con HTML/CSS/SVG simple.

## Cambios esperados

- `src/routes/linea-tiempo/+page.svelte`.
- `src/lib/components/TimelineLayers.svelte`.

## Funcionalidad

- Capas:
  1. científico-comparativo;
  2. mediación republicana;
  3. patrimonialización;
  4. digitalización.
- Eventos como bloques o puntos.
- Click en evento → panel lateral.
- Enlaces a entidades asociadas.
- `DemoToggle`.

## Criterios de aceptación

- Legible entre 1820 y 2026.
- Ticks mayores cada 25 años.
- Sin librerías de timeline.

---

# T-09 — Validaciones, manifest y JSON-LD

## Objetivo

Endurecer el pipeline y producir primer corte semántico.

## Cambios esperados

- `scripts/validate-data.js`:
  - referencias rotas;
  - predicados fuera de vocabulario;
  - `include_demo=yes` sin `demo_priority`;
  - fechas mal formadas.
- Ampliar `build-data.js` para volcar warnings en `manifest.json`.
- Completar `roulin.jsonld` con `@context` mínimo:
  - DCTERMS;
  - SKOS;
  - Schema.org;
  - vocabulario local.
- Mostrar conteo y warnings en home como bloque discreto `Estado del corpus`.

## Criterios de aceptación

- `node scripts/validate-data.js` imprime reporte legible.
- `roulin.jsonld` pasa `JSON.parse`.
- Warnings no detienen build salvo CSV ilegible.

---

# T-10 — Build, preview, despliegue

## Objetivo

Primera versión navegable en GitHub Pages.

## Cambios esperados

- `static/.nojekyll` vacío.
- `README.md` con instrucciones de:
  - desarrollo;
  - build;
  - preview;
  - despliegue.

## Comandos sugeridos

En PowerShell:

```powershell
$env:BASE_PATH="/atlas-mediaciones"; npm run build
npm run preview
```

## Criterios de aceptación

- `npm run build` termina sin errores.
- `build/` contiene rutas estáticas:
  - `index.html`
  - `repositorio/index.html`
  - `grafo/index.html`
  - `mapa/index.html`
  - `linea-tiempo/index.html`
  - `fuente/<id>/index.html`
- GitHub Pages carga sin 404 de assets.
- `.nojekyll` evita problemas con `_app`.

---

# Advertencias generales para el agente ejecutor

Aplican a todos los tickets:

1. No modificar nombres ni añadir columnas a los CSV de `data/raw/`.
2. Si una columna del plan no existe, ignorarla; si una columna existe en el CSV real pero no en el plan, no eliminarla.
3. No crear tablas separadas para demo.
4. La demo se filtra con `include_demo` y se ordena con `demo_priority`.
5. No inventar relaciones.
6. Las relaciones indirectas se derivan por recorrido del grafo, no se persisten como relaciones primarias.
7. No introducir TypeScript.
8. No introducir Tailwind, Bootstrap ni librerías UI.
9. No añadir backend, API routes ni hooks de servidor.
10. No copiar literalmente la maqueta de referencia.
11. No ejecutar `git push --force`, `npm audit fix --force` ni borrar carpetas existentes.
12. No adoptar dependencias adicionales sin avisar.
13. Stack permitido: SvelteKit, vis-network, Leaflet, PapaParse.
14. No inferir roles de lugar ni grados de confianza ausentes. Lo que falta se reporta como warning.

---

# Riesgos identificados y mitigaciones

## 1. Rutas en GitHub Pages

**Riesgo:** `fetch('/data/...')` y enlaces internos fallan con base path.  
**Mitigación:** usar `import { base } from '$app/paths'` en toda carga de datos y enlaces.

## 2. Carga de datos grande

**Riesgo:** muchos registros degradan render.  
**Mitigación:** cachear en módulo, aplicar `applyDemo()` antes del grafo y considerar paginación si el repositorio supera 200 tarjetas.

## 3. Grafo demasiado denso

**Riesgo:** corpus completo ilegible.  
**Mitigación:** apagar physics por defecto, botón `Estabilizar`, limitar a `visibility = public`.

## 4. Mapa con roles ambiguos

**Riesgo:** lugares sin rol o sin coordenadas.  
**Mitigación:** mapear solo `place_id` con `lat/lng` válidos y rol declarado en `entity_places.csv`.

## 5. Cambios accidentales en CSV

**Riesgo:** refactor rompe columnas.  
**Mitigación:** validar estructura antes de cada commit.

## 6. SSR rompe vis-network o Leaflet

**Riesgo:** librerías usan `window`.  
**Mitigación:** importar y montar dentro de `onMount`.

## 7. Parser CSV frágil

**Riesgo:** comas y comillas en descripciones.  
**Mitigación:** usar PapaParse.

## 8. Imágenes externas lentas o rotas

**Riesgo:** Drive o enlaces remotos fallan.  
**Mitigación:** `loading="lazy"`, `onerror` y placeholders.

## 9. Identidad visual demasiado dashboard

**Riesgo:** interfaz parece corporativa o técnica.  
**Mitigación:** sobriedad editorial, sin íconos excesivos ni sombras fuertes.

## 10. Columnas extra en CSV reales

**Riesgo:** script falla por columnas no previstas.  
**Mitigación:** lectura por nombre de columna e ignorar columnas extra.

---

# Cambios estructurales opcionales fuera de la primera versión

No ejecutar ahora:

- Búsqueda full-text con FlexSearch.
- Migración de vis-network a Cytoscape.
- IIIF viewer para imágenes con `iiif_url`.
- Exportación Turtle validada (`roulin.ttl`).
- Modo curatorial con notas extensas por entidad.
- Multi-corpus con `corpus_id` cuando exista un segundo corpus.

Cualquier mejora requiere conversación previa antes de abrirse como ticket.

---

# Próximo paso recomendado

Ejecutar primero:

```text
T-00 + T-01
```

Después revisar:

```text
static/data/manifest.json
static/data/graph.json
static/data/map.geojson
salida de npm run build:data
```

Solo si esos archivos están bien, pasar a T-02.
