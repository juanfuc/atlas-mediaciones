# Plan técnico v3 — Atlas de mediaciones
## Plataforma mínima escalable para demo de sustentación, investigación futura y aplicaciones a fellowships

---

## 0. Estado de decisión

Este documento actualiza el plan técnico v2 del prototipo Roulin. La versión v3 conserva la idea central del prototipo como **artefacto argumentativo**, pero lo reubica dentro de una plataforma más amplia: **Atlas de mediaciones**.

La demo inicial se concentrará en el corpus Roulin, pero la arquitectura no debe quedar amarrada exclusivamente a Roulin. El repositorio y la URL pública deben servir para futuros corpus de circulación visual, mediaciones documentales, historia natural, cultura visual e historia global.

**Nombre del repositorio GitHub:**

```text
atlas-mediaciones
```

**Nombre del sitio:**

```text
Atlas de mediaciones
```

**Primer corpus:**

```text
Roulin: imágenes, mediaciones y circulación visual
```

**URL esperada en GitHub Pages:**

```text
https://usuario.github.io/atlas-mediaciones/
```

---

## 1. Concepto

El sitio no debe entenderse como una maqueta descartable ni como un repositorio institucional plenamente desarrollado. Debe funcionar como una **plataforma mínima de investigación**: suficientemente acotada para servir en la demo de sustentación oral, pero construida con una arquitectura que pueda crecer hacia otros corpus, alimentar nuevas visualizaciones, producir datos semánticos y sostener aplicaciones a fellowships.

El principio rector se mantiene:

> El prototipo es un **artefacto argumentativo**. Su valor no está solo en mostrar fuentes históricas, sino en hacer visibles las relaciones, mediaciones, incertidumbres y cambios de función que atraviesan esas fuentes.

La versión inicial se concentrará en Roulin. Sin embargo, la arquitectura debe estar preparada para incorporar otros corpus sin reescribir el sitio.

---

## 2. Decisión estratégica

### 2.1 Usar

```text
SvelteKit estático
+ JavaScript, no TypeScript por ahora
+ CSV como capa de recolección
+ scripts de transformación
+ JSON / GeoJSON / Graph JSON para visualización
+ JSON-LD / Turtle como exportación semántica
+ GitHub Pages para despliegue público
```

### 2.2 No usar todavía

```text
backend
login
base de datos relacional
Omeka S
Wikibase
triplestore
endpoint SPARQL
CMS
búsqueda full-text compleja
```

### 2.3 Justificación

El prototipo tiene una doble función:

1. **Función inmediata:** servir como demo navegable durante la sustentación oral.
2. **Función futura:** convertirse en la base de un proyecto de investigación escalable sobre circulación visual, mediaciones documentales, historia natural, archivos, historia global y datos enlazados.

Por eso, la arquitectura debe permitir:

- cosechar datos de forma sencilla;
- ampliar el corpus sin reescribir el código;
- documentar decisiones curatoriales;
- modelar relaciones con grados de confianza;
- mostrar corpus completo y subconjunto de demo;
- distinguir roles geográficos;
- exportar datos estructurados;
- migrar, si el proyecto crece, hacia infraestructuras más robustas como Omeka S, Wikibase, PostgreSQL o un triplestore.

---

## 3. Principios rectores

1. **Lo mínimo que sirva al argumento, pero sin cerrar el crecimiento.**  
   La versión de demo debe ser pequeña, clara y estable; la estructura de datos debe poder crecer.

2. **CSV primero.**  
   Los CSV son la capa de recolección, corrección y cosecha. Son fáciles de editar, revisar, versionar y compartir.

3. **Modelo orientado a grafo.**  
   Las tablas CSV no definen una base relacional en sentido estricto. Funcionan como interfaz humana de captura. El modelo historiográfico vive en las relaciones sujeto-propiedad-objeto.

4. **Datos como tripletas.**  
   `relations.csv` registra las aristas directas del grafo. Cada relación debe tener sujeto, predicado, objeto, evidencia, grado de confianza y autoría de la inferencia cuando aplique.

5. **Corpus único, vistas filtradas.**  
   No habrá tablas separadas para demo y corpus ampliado. La distinción se hará con campos como `include_demo`, `demo_priority`, `chain` y `path_group`.

6. **La incertidumbre se modela.**  
   Toda relación debe poder distinguirse como `documentada`, `inferida` o `hipotetica`.

7. **Los lugares tienen roles.**  
   Una entidad puede estar asociada a varios lugares con funciones distintas: representación, producción, observación, publicación, custodia, digitalización, circulación o comparación.

8. **La técnica responde a una pregunta historiográfica.**  
   Ninguna funcionalidad se justifica por novedad técnica. Cada elemento debe servir para mostrar mediaciones, capas, evidencias o relaciones.

9. **Escalabilidad progresiva.**  
   La plataforma no debe nacer como infraestructura pesada, pero sí con estructura suficiente para convertirse en una plataforma propia de investigación.

---

## 4. Alcance del corpus Roulin para la demo

La sustentación no debe mostrar todo el corpus. El corpus amplio puede estar cargado en el repositorio, pero la demo debe operar sobre tres cadenas prioritarias.

### 4.1 Cadena 1 — Tapir, cámara lúcida, Cuvier, Palaeotherium

**Eje historiográfico:**

```text
historia natural comparada
instrumentos de inscripción
anatomía comparada
tiempo profundo
inscripción probatoria
```

**Entidades esperadas:**

```text
Roulin
Mémoire pour servir à l’histoire du tapir
cámara lúcida
tapir
Palaeotherium
Cuvier
Recherches sur les ossemens fossiles
Annales des sciences naturelles
París
```

### 4.2 Cadena 2 — Quindío, Supía, d’Orbigny, Boussingault, Acosta

**Eje historiográfico:**

```text
reuso editorial
paisaje
trabajo
geología
minería
reorientación técnico-administrativa
```

**Entidades esperadas:**

```text
Le passage du Quindiu
Mines de la Vega de Supía
d’Orbigny
Voyage pittoresque dans les deux Amériques
Boussingault
Acosta
Viajes científicos a los Andes ecuatoriales
Quindío
Supía
senita porfídica
```

### 4.3 Cadena 3 — Roulin, Giast, archivo, patrimonialización y digitalización

**Eje historiográfico:**

```text
copia
recorte
motivo visual
atribución
archivo nacional
patrimonialización
digitalización
incertidumbre
```

**Entidades esperadas:**

```text
Place de St. Victorin, à Bogotá
Mujer con balde
Roulin
Giast
Bonifacio del Carril
Robert Heymann
Banco de la República
Archivo Central Andrés Bello
De Santiago a Mendoza
dominio público / digitalización 2003
```

### 4.4 Criterio de demo

La demo debe usar:

```text
20–30 entidades visibles
30–60 relaciones visibles
5–10 relaciones inferidas o hipotéticas
4 vistas principales
1 exportación JSON-LD mínima
```

El corpus completo puede contener más ítems, pero el grafo, el mapa y la línea de tiempo deben permitir activar el modo **Solo demo**.

---

## 5. Arquitectura del repositorio

```text
atlas-mediaciones/
├── README.md
├── package.json
├── svelte.config.js
├── vite.config.js
├── static/
│   ├── img/
│   └── data/
│       ├── entities.json
│       ├── relations.json
│       ├── graph.json
│       ├── map.geojson
│       ├── timeline.json
│       ├── vocabularies.json
│       ├── manifest.json
│       └── roulin.jsonld
├── data/
│   ├── raw/
│   │   ├── entities.csv
│   │   ├── relations.csv
│   │   ├── agents.csv
│   │   ├── places.csv
│   │   ├── institutions.csv
│   │   ├── entity_places.csv
│   │   ├── events.csv
│   │   ├── vocab_relations.csv
│   │   ├── vocab_place_roles.csv
│   │   └── vocab_confidence.csv
│   ├── processed/
│   │   ├── entities.json
│   │   ├── relations.json
│   │   ├── graph.json
│   │   ├── map.geojson
│   │   ├── timeline.json
│   │   ├── vocabularies.json
│   │   └── manifest.json
│   └── rdf/
│       ├── roulin.jsonld
│       └── roulin.ttl
├── scripts/
│   ├── build-data.js
│   ├── validate-data.js
│   ├── csv-to-json.js
│   ├── csv-to-graph.js
│   ├── csv-to-geojson.js
│   ├── csv-to-timeline.js
│   └── csv-to-jsonld.js
├── _agent/
│   ├── plan_tecnico_atlas_mediaciones_v3.md
│   ├── modelo-datos.md
│   ├── diccionario-campos.md
│   ├── criterios-curatoriales.md
│   ├── vocabulario-relaciones.md
│   ├── guion-demo.md
│   └── roadmap-investigacion.md
└── src/
    ├── routes/
    │   ├── +layout.js
    │   ├── +layout.svelte
    │   ├── +page.svelte
    │   ├── repositorio/+page.svelte
    │   ├── grafo/+page.svelte
    │   ├── mapa/+page.svelte
    │   ├── linea-tiempo/+page.svelte
    │   └── fuente/[id]/+page.svelte
    └── lib/
        ├── components/
        │   ├── SourceCard.svelte
        │   ├── ConfidenceBadge.svelte
        │   ├── RelationBadge.svelte
        │   ├── EntityPanel.svelte
        │   ├── GraphView.svelte
        │   ├── MapView.svelte
        │   ├── TimelineLayers.svelte
        │   ├── ChainFilter.svelte
        │   └── DemoToggle.svelte
        ├── data/
        │   └── loadData.js
        └── utils/
            ├── relations.js
            ├── filters.js
            ├── format.js
            └── paths.js
```

---

## 6. Instalación SvelteKit

### 6.1 Crear proyecto

```bash
npx sv create atlas-mediaciones
cd atlas-mediaciones
npm install
npm i -D @sveltejs/adapter-static
```

Opciones recomendadas al crear el proyecto:

```text
Template: minimal
TypeScript: no
JavaScript: sí
ESLint: sí
Prettier: sí
Vitest/Playwright: no por ahora
Package manager: npm
```

### 6.2 Configurar `adapter-static`

En `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-static';

const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      strict: true
    })
  }
};

export default config;
```

### 6.3 Prerender

Crear `src/routes/+layout.js`:

```js
export const prerender = true;
export const trailingSlash = 'always';
```

### 6.4 Desarrollo local

```bash
npm run dev -- --open
```

### 6.5 Build

```bash
npm run build
```

---

## 7. Flujo de datos

### Capa 1 — Recolección

```text
data/raw/*.csv
```

Los CSV son la fuente de trabajo cotidiana. Allí se agregan fuentes, lugares, agentes, instituciones, relaciones, eventos, roles de lugar y vocabularios.

### Capa 2 — Procesamiento

```text
scripts/build-data.js
```

El script toma los CSV y produce archivos derivados.

### Capa 3 — Visualización

```text
static/data/*.json
```

La aplicación SvelteKit consume solo los archivos procesados ubicados en `static/data/`.

### Capa 4 — Interoperabilidad

```text
data/rdf/roulin.jsonld
data/rdf/roulin.ttl
static/data/roulin.jsonld
```

La exportación semántica permite mostrar que el prototipo no es solo visual, sino que puede avanzar hacia datos enlazados publicables.

---

## 8. Archivos CSV canónicos

La versión v3 usa **un corpus único**. No existen `entities_demo.csv` ni `relations_demo.csv` como tablas principales.

### 8.1 `entities.csv`

Contiene todos los recursos principales: imágenes, textos, publicaciones, instrumentos, conceptos, documentos, conjuntos, etc.

Campos esperados:

```csv
id,legacy_id,corpus_id,label,type,date_start,date_end,agent_ids,institution_id,signature,source_url,image_url,drive_id,drive_url,description,chain,path_group,include_demo,demo_priority,needs_review
```

Notas:

- `id` es el identificador semántico interno.
- `legacy_id` conserva el identificador heredado de bases previas.
- `corpus_id` permite escalar más allá de Roulin.
- `include_demo` permite filtrar la sustentación.
- `demo_priority` ordena la aparición en la demo.
- `needs_review` permite dejar marcado lo que requiere revisión curatorial.

Ejemplos de IDs:

```text
img_ap4088_place_st_victorin
img_ci_vi_107_mujer_balde
txt_roulin_1829a_tapir
pub_dorbigny_1836_voyage
agt_roulin
plc_bogota
inst_banrep
```

---

### 8.2 `relations.csv`

Es el archivo central del proyecto. Contiene las tripletas sujeto-propiedad-objeto y sus metadatos de evidencia.

Campos esperados:

```csv
id,corpus_id,subject_id,predicate,object_id,confidence,asserted_by,assertion_basis,evidence_source,page_or_folio,note,chain,path_group,relation_function,include_demo,demo_priority,visibility,needs_review
```

Notas:

- Solo se registran relaciones directas.
- Las relaciones indirectas se derivan mediante recorrido de grafo.
- `asserted_by` distingue entre afirmación documental, inferencia propia, inferencia de Antei, catalogación archivística u otra fuente.
- `assertion_basis` indica la base de la afirmación: correspondencia visual, fuente textual, misma plancha, catálogo, atribución historiográfica, etc.

Ejemplo conceptual:

```csv
rel_001,roulin,img_ap4088_place_st_victorin,comparte_motivo_con,img_ci_vi_107_mujer_balde,hipotetica,juan_felipe_uruena,correspondencia_visual,Comparación visual,,Figura recortada y reubicada,giast_archivo,giast,plantilla,yes,1,public,yes
```

---

### 8.3 `agents.csv`

Campos esperados:

```csv
id,label,type,birth_date,death_date,nationality,description,external_uri
```

---

### 8.4 `places.csv`

Campos esperados:

```csv
id,label,type,lat,lng,current_country,historical_region,description,external_uri
```

`places.csv` solo define lugares. No define qué papel cumplen esos lugares en relación con una entidad. Esa función corresponde a `entity_places.csv`.

---

### 8.5 `institutions.csv`

Campos esperados:

```csv
id,label,type,place_id,lat,lng,city,country,description,external_uri,no_map
```

Notas:

- Cuando una institución tiene sede física clara, puede tener coordenadas.
- Cuando se trate de repositorios digitales, agregadores o referencias bibliográficas sin sede útil para el argumento, `no_map` puede marcarse como `yes`.

---

### 8.6 `entity_places.csv`

Tabla para asociar entidades con lugares según rol.

Campos esperados:

```csv
id,entity_id,place_id,place_role,confidence,evidence_source,note,include_demo
```

Roles controlados:

```text
represented_place
production_place
observation_place
publication_place
custody_place
digitization_place
comparison_place
circulation_place
```

Esta tabla permite que el mapa funcione por capas geográficas superpuestas y no como itinerario.

---

### 8.7 `events.csv`

Campos esperados:

```csv
id,corpus_id,label,date_start,date_end,layer,entity_ids,place_ids,description,include_demo,demo_priority
```

Capas esperadas:

```text
siglo_xix_cientifico_comparativo
mediacion_republicana
patrimonializacion_siglo_xx
mediacion_digital
circulacion_editorial
```

---

### 8.8 `vocab_relations.csv`

Vocabulario controlado de predicados. Es decisivo para que la red no se ensucie a medida que el corpus crezca.

Campos esperados:

```csv
id,label,domain,range,description
```

Predicados iniciales:

```text
observa
dibuja_mediante
compara_con
traduce
recompone
reutiliza
sirve_de_modelo
sirve_de_modelo_a
se_conserva_en
fue_atribuido_a
fue_adquirido_por
fue_digitalizado_por
comparte_motivo_con
hace_visible
oculta
reorienta_hacia
contextualiza
publicado_en
menciona
relacionado_con
usa_modelo_visual_asociado_a
```

---

### 8.9 `vocab_place_roles.csv`

Campos esperados:

```csv
id,label,description
```

Roles iniciales:

```text
represented_place
production_place
observation_place
publication_place
custody_place
digitization_place
comparison_place
circulation_place
```

---

### 8.10 `vocab_confidence.csv`

Campos esperados:

```csv
id,label,description,visual_style
```

Valores iniciales:

```text
documentada
inferida
hipotetica
```

---

## 9. Archivos derivados

### 9.1 `entities.json`

Lista de entidades normalizadas para consumo web.

### 9.2 `relations.json`

Lista de relaciones enriquecidas con etiquetas de sujeto, predicado y objeto.

### 9.3 `graph.json`

Estructura para la visualización de red:

```json
{
  "nodes": [
    {
      "id": "img_ap4088_place_st_victorin",
      "label": "Place de St. Victorin",
      "type": "Imagen",
      "corpus_id": "roulin",
      "chain": "giast_archivo",
      "include_demo": true
    }
  ],
  "edges": [
    {
      "id": "rel_001",
      "from": "img_ap4088_place_st_victorin",
      "to": "img_ci_vi_107_mujer_balde",
      "label": "comparte motivo con",
      "confidence": "hipotetica",
      "include_demo": true
    }
  ]
}
```

### 9.4 `map.geojson`

Estructura para Leaflet:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "plc_bogota",
        "label": "Bogotá",
        "place_roles": ["represented_place", "production_place"],
        "entities": ["img_ap4088_place_st_victorin"],
        "include_demo": true
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-74.072, 4.711]
      }
    }
  ]
}
```

### 9.5 `timeline.json`

Eventos para línea de tiempo por capas.

### 9.6 `vocabularies.json`

Agrupa vocabularios para consumo de la interfaz.

### 9.7 `manifest.json`

Debe incluir:

```text
fecha de generación
número de entidades
número de relaciones
número de entidades demo
número de relaciones demo
warnings de referencias rotas
warnings de campos vacíos críticos
```

### 9.8 `roulin.jsonld`

Exportación semántica mínima.

---

## 10. Vistas del sitio

### 10.1 Inicio

Función: situar el argumento y orientar la navegación.

Debe incluir:

- nombre general: **Atlas de mediaciones**;
- primer corpus: **Roulin: imágenes, mediaciones y circulación visual**;
- breve explicación de la red de mediaciones;
- acceso a las cuatro vistas;
- aviso de que se trata de una plataforma mínima en desarrollo;
- enlace al repositorio de GitHub.

Texto sugerido:

> Este prototipo modela un corpus acotado de fuentes asociadas a Roulin como una red de mediaciones. No busca reunir objetos aislados, sino registrar relaciones entre imágenes, textos, agentes, lugares, instituciones, instrumentos y conceptos, distinguiendo grados de evidencia, roles geográficos y capas de reorientación histórica.

---

### 10.2 Repositorio

Función: mostrar el corpus.

Componentes:

- tarjetas de entidades;
- filtros por tipo;
- filtros por cadena de mediación;
- filtro `solo demo / corpus completo`;
- filtros por grado de confianza asociado;
- acceso a página de detalle.

Cada tarjeta debe mostrar:

```text
thumbnail
título
tipo
fecha
agente principal
institución
signatura
cadena
badge de demo, si aplica
```

---

### 10.3 Página de detalle de fuente

Función: mostrar que cada fuente es un nodo relacional.

Debe incluir:

- metadatos;
- imagen o placeholder;
- descripción;
- signatura;
- relaciones salientes;
- relaciones entrantes;
- eventos asociados;
- lugares asociados por rol;
- nivel de evidencia de las relaciones;
- notas curatoriales.

---

### 10.4 Grafo

Función: mostrar la estructura relacional.

Debe incluir:

- interruptor `Solo demo / Corpus completo`;
- nodos por tipo;
- aristas con predicados controlados;
- estilo de línea por confianza;
- filtro por cadena;
- filtro por tipo de entidad;
- filtro por predicado;
- filtro por confianza;
- panel lateral para nodo o relación seleccionada.

Regla del interruptor:

```text
Solo demo = mostrar relaciones include_demo = yes y nodos conectados.
Corpus completo = mostrar todas las entidades y relaciones visibles.
```

Convención visual:

```text
documentada → línea continua
inferida    → línea punteada
hipotetica  → línea discontinua
```

El grafo es la vista más importante de la demo. Debe mostrar que la tipificación de relaciones es una operación interpretativa.

---

### 10.5 Mapa

Función: mostrar geografías de mediación, no un simple itinerario.

Debe incluir:

- interruptor `Solo demo / Corpus completo`;
- filtros por `place_role`;
- popups con lugar, rol, entidades asociadas y cadena;
- distinción entre lugar representado, producción/observación, publicación, custodia, digitalización, circulación y comparación.

Capas:

```text
representación
producción / observación
publicación
custodia
digitalización
comparación
circulación
```

Pregunta del mapa:

> ¿Dónde se produce, observa, representa, publica, conserva, digitaliza, compara o reorienta una fuente?

---

### 10.6 Línea de tiempo / capas

Función: mostrar cambios de función histórica.

Debe incluir:

- interruptor `Solo demo / Corpus completo`;
- cuatro o cinco estratos;
- eventos por capa;
- conexión con entidades.

Capas principales:

```text
siglo XIX científico-comparativo
mediación republicana
circulación editorial
patrimonialización siglo XX
digitalización siglo XXI
```

Cada evento debe mostrar:

- fecha;
- etiqueta;
- capa;
- entidades asociadas;
- breve descripción.

---

### 10.7 Grados de confianza

No será necesariamente una ruta separada en la primera versión. Debe funcionar como filtro transversal en repositorio, grafo y detalle.

Valores:

```text
documentada
inferida
hipotetica
```

Ejemplo clave para la demo:

```text
Place de St. Victorin → comparte_motivo_con → Mujer con balde
confianza: hipotetica
```

Mensaje historiográfico:

> Modelar la incertidumbre es parte del rigor histórico, no una concesión a la imprecisión.

---

## 11. Diseño visual

El sitio debe respetar la estética sobria de la presentación, sin parecer una plataforma genérica ni un dashboard técnico.

### Paleta

```text
fondo:      #F4EFE6
texto:      #1A1814
secundario: #6B6661
acento:     #8C3B22
línea:      #D8CFC2
```

### Tipografía

Usar fuentes del sistema para evitar dependencia inicial:

```css
--font-serif: Georgia, "Times New Roman", serif;
--font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
```

### Estilo

- fondo claro;
- filete superior siena;
- tarjetas sobrias;
- signaturas en monoespaciada;
- poco color;
- énfasis en jerarquía tipográfica;
- evitar estética de dashboard corporativo;
- evitar logos institucionales como decoración;
- créditos discretos en el pie.

---

## 12. Bibliotecas recomendadas

### Primera versión

```text
SvelteKit
vis-network para grafo
Leaflet para mapa
CSS propio para línea de tiempo
```

### No usar todavía

```text
vis-timeline
MapLibre
Cytoscape
Tailwind si retrasa la implementación
base de datos externa
```

---

## 13. Despliegue

### GitHub Pages con SvelteKit estático

Pasos:

```text
1. Configurar adapter-static.
2. Definir base path si el sitio se despliega en /atlas-mediaciones.
3. Ejecutar npm run build.
4. Publicar carpeta generada en GitHub Pages.
5. Probar URL pública.
```

URL esperada:

```text
https://usuario.github.io/atlas-mediaciones/
```

### Respaldo

Aunque no sea indispensable el modo offline, se recomienda guardar:

```text
capturas PNG de cada vista
exportación ZIP del repositorio
versión local ejecutable con npm run preview
```

---

## 14. Flujo de trabajo con modelos y agentes

### ChatGPT fuerte

Usar para:

```text
modelo de datos
diccionario de campos
criterios curatoriales
revisión conceptual
guion de demo
prompts para agentes de código
```

### Claude Opus

Usar para:

```text
revisión teórica
consistencia con la sustentación
formulación elegante de notas curatoriales
evaluación de si el prototipo comunica la tesis
```

### Claude Code

Usar para:

```text
crear estructura SvelteKit
implementar rutas
crear componentes
conectar datos procesados
depurar interfaz
mantener coherencia multiarchivo
```

### Codex

Usar para:

```text
scripts de transformación
grafo con vis-network
mapa con Leaflet
revisión de errores
preparación de GitHub Pages
```

### OpenCode

Usar como alternativa o respaldo para:

```text
ediciones pequeñas
refactorización local
corrección de errores puntuales
uso flexible de distintos modelos
```

Regla para todos los agentes:

> No modificar el modelo de datos ni los nombres de columnas. Si hace falta un cambio estructural, proponerlo primero y esperar aprobación.

---

## 15. Plan de implementación inmediato

### Bloque 1 — Preparación

```text
- crear proyecto SvelteKit minimal en JavaScript
- configurar adapter-static
- crear carpetas data/raw, scripts, static/data, docs
- copiar CSV v2/v3 a data/raw
- copiar este plan a docs/
```

### Bloque 2 — Scripts

```text
- implementar scripts/build-data.js
- leer todos los CSV de data/raw
- validar referencias
- generar entities.json
- generar relations.json
- generar graph.json
- generar map.geojson
- generar timeline.json
- generar vocabularies.json
- generar manifest.json
- generar JSON-LD mínimo
```

### Bloque 3 — Repositorio

```text
- crear ruta /repositorio
- crear SourceCard
- crear filtro solo demo / corpus completo
- crear filtros por tipo, cadena y confianza
- crear ruta /fuente/[id]
```

### Bloque 4 — Grafo

```text
- instalar vis-network si hace falta
- implementar GraphView
- cargar graph.json
- implementar toggle demo/completo
- diferenciar nodos por tipo
- diferenciar aristas por confianza
- crear panel lateral
```

### Bloque 5 — Mapa

```text
- instalar Leaflet si hace falta
- implementar MapView
- cargar map.geojson
- crear filtros por place_role
- crear popup con entidades asociadas
```

### Bloque 6 — Línea de tiempo

```text
- implementar TimelineLayers con HTML/CSS/SVG simple
- usar timeline.json
- mostrar capas temporales
- conectar eventos con entidades
```

### Bloque 7 — Cierre

```text
- ajustar diseño
- revisar rutas
- ejecutar npm run build
- probar npm run preview
- desplegar en GitHub Pages
- tomar capturas
- escribir guion de demo de 4–5 minutos
```

---

## 16. Prompt maestro actualizado para Claude Code o Codex

```text
Crea la estructura inicial para un proyecto SvelteKit estático llamado “Atlas de mediaciones”.

Contexto:
El sitio debe servir como plataforma mínima de investigación y como demo para una sustentación oral. El primer corpus es “Roulin: imágenes, mediaciones y circulación visual”, pero la arquitectura debe poder escalar a otros corpus.

Arquitectura:
- data/raw/*.csv será la capa de recolección.
- scripts/build-data.js convertirá CSV a archivos JSON en static/data/.
- La aplicación SvelteKit solo debe consumir static/data/*.json.
- No uses backend.
- No uses base de datos.
- No cambies los nombres de campos de los CSV.
- No modifiques el modelo de datos sin proponerlo primero.

CSV iniciales:
- entities.csv
- relations.csv
- agents.csv
- places.csv
- institutions.csv
- entity_places.csv
- events.csv
- vocab_relations.csv
- vocab_place_roles.csv
- vocab_confidence.csv

Archivos derivados:
- static/data/entities.json
- static/data/relations.json
- static/data/graph.json
- static/data/map.geojson
- static/data/timeline.json
- static/data/vocabularies.json
- static/data/manifest.json
- static/data/roulin.jsonld

Rutas:
- /
- /repositorio
- /grafo
- /mapa
- /linea-tiempo
- /fuente/[id]

Componentes:
- SourceCard
- ConfidenceBadge
- RelationBadge
- EntityPanel
- GraphView
- MapView
- TimelineLayers
- ChainFilter
- DemoToggle

Funciones obligatorias:
- toggle “Solo demo / Corpus completo” en repositorio, grafo, mapa y línea de tiempo.
- en modo demo, mostrar solo relaciones include_demo = yes y nodos conectados.
- en modo completo, mostrar todo el corpus visible.
- mapa por roles de lugar desde entity_places.csv.
- grafo con estilos de línea según confidence.

Diseño:
Sobrio, académico, compatible con una presentación de sustentación.

Paleta:
- fondo #F4EFE6
- texto #1A1814
- secundario #6B6661
- acento #8C3B22
- línea #D8CFC2

Criterio historiográfico:
El sitio debe mostrar que las imágenes y textos funcionan como una red de mediaciones. Las relaciones tienen grados de confianza: documentada, inferida, hipotetica. La base de datos debe aparecer como laboratorio histórico, no como simple inventario.

Prioridad:
1. estructura de datos
2. scripts de transformación
3. repositorio
4. página de detalle
5. grafo
6. mapa
7. línea de tiempo
8. JSON-LD mínimo
```

---

## 17. Guion de demo para la sustentación

Duración máxima: 4–5 minutos.

### 1. Entrada

> Este prototipo no es un repositorio completo, sino una plataforma mínima de investigación. Está construido para mostrar cómo un corpus pequeño puede modelarse como red de mediaciones.

### 2. Repositorio

Mostrar 3–4 fuentes.

> La unidad de trabajo no es solo el ítem. Cada fuente entra al sistema como nodo de una red: tiene agentes, lugares, instituciones, eventos y relaciones.

### 3. Grafo

Seleccionar relación Roulin–Giast o tapir–Cuvier.

> Aquí se ve la estructura sujeto-propiedad-objeto. Las relaciones no son neutras: están tipificadas y tienen grados de confianza.

### 4. Mapa

Activar capas de producción, publicación y conservación.

> El mapa no representa simplemente un itinerario. Representa geografías superpuestas de mediación: dónde se observa, dónde se publica, dónde se conserva y desde dónde se vuelve comparable.

### 5. Línea de tiempo

Mostrar las capas temporales.

> El mismo objeto cambia de función cuando pasa de la empresa científica del siglo XIX a la mediación republicana, la patrimonialización del siglo XX y la digitalización contemporánea.

### 6. Cierre

> La base de datos no elimina la mediación; la hace explícita. Por eso el prototipo no es decoración: es una forma de hacer discutible una interpretación histórica.

---

## 18. Qué no incluir en esta fase

```text
no endpoint SPARQL
no login
no usuarios
no comentarios
no búsqueda full-text compleja
no backend
no CMS
no Omeka S todavía
no Wikibase todavía
no animaciones decorativas
no dashboards genéricos
no rehacer el modelo de datos desde el código
```

---

## 19. Roadmap posterior a la sustentación

### Fase 1 — Consolidación

```text
- limpiar CSV
- documentar modelo de datos
- ampliar corpus Roulin
- revisar vocabulario de relaciones
- mejorar exportación JSON-LD
```

### Fase 2 — Investigación

```text
- incorporar más archivos
- crear nuevas cadenas de mediación
- añadir transcripciones
- vincular imágenes IIIF
- añadir notas curatoriales extensas
- enriquecer referencias bibliográficas
```

### Fase 3 — Interoperabilidad

```text
- definir URIs estables
- mapear vocabulario a DCTERMS, PROV-O, SKOS, Schema.org, PROV-O y eventualmente CIDOC CRM
- exportar Turtle validado
- evaluar migración parcial a Omeka S o Wikibase
```

### Fase 4 — Plataforma propia

```text
- diseño visual más elaborado
- búsqueda avanzada
- visualizaciones comparativas
- modo curatorial
- dossiers temáticos
- publicación de datasets
- documentación para fellowships
```

---

## 20. Frase de cierre del plan

El prototipo debe poder defenderse así:

> Una plataforma mínima, construida en SvelteKit estático, que recolecta datos en CSV, los transforma en JSON para visualización y los exporta como JSON-LD/RDF para hacer explícita una red de mediaciones históricas. Sirve para la demo de la sustentación, pero está diseñada para crecer como infraestructura de investigación.

O, en versión más breve:

> **No es una maqueta desechable: es la primera versión de una plataforma de investigación.**
