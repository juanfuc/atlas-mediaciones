import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const RAW = join(ROOT, 'data', 'raw');
const OUT = join(ROOT, 'static', 'data');

mkdirSync(OUT, { recursive: true });

// warnings is keyed by category for grouped reporting
const warnings = {};
const outputFiles = [];

function warn(category, msg) {
  (warnings[category] ??= []).push(msg);
  console.warn('[WARN]', msg);
}

function totalWarnings() {
  return Object.values(warnings).reduce((s, a) => s + a.length, 0);
}

function parseCsv(filename) {
  const filepath = join(RAW, filename);
  let content;
  try {
    content = readFileSync(filepath, 'utf-8');
  } catch (e) {
    console.error(`[ERROR] Cannot read ${filename}: ${e.message}`);
    process.exit(1);
  }
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim()
  });
  if (result.errors.length > 0) {
    result.errors.forEach((e) =>
      warn('parse_error', `${filename} parse error: ${e.message} (row ${e.row})`)
    );
  }
  return result.data;
}

function toBool(val) {
  return String(val ?? '').trim().toLowerCase() === 'yes';
}

function toArray(val) {
  if (!val) return [];
  return String(val)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

function toNum(val) {
  const n = Number(val);
  return isNaN(n) || val === '' ? null : n;
}

function writeJson(filename, data) {
  writeFileSync(join(OUT, filename), JSON.stringify(data, null, 2), 'utf-8');
  outputFiles.push(`static/data/${filename}`);
  console.log(`[OK] static/data/${filename}`);
}

// ── 1. Read all CSVs ────────────────────────────────────────────────────────
const INPUT_CSVS = [
  'entities.csv', 'relations.csv', 'agents.csv', 'places.csv',
  'institutions.csv', 'entity_places.csv', 'events.csv',
  'vocab_relations.csv', 'vocab_place_roles.csv', 'vocab_confidence.csv'
];

const rawEntities      = parseCsv('entities.csv');
const rawRelations     = parseCsv('relations.csv');
const rawAgents        = parseCsv('agents.csv');
const rawPlaces        = parseCsv('places.csv');
const rawInstitutions  = parseCsv('institutions.csv');
const rawEntityPlaces  = parseCsv('entity_places.csv');
const rawEvents        = parseCsv('events.csv');
const rawVocabRelations    = parseCsv('vocab_relations.csv');
const rawVocabPlaceRoles   = parseCsv('vocab_place_roles.csv');
const rawVocabConfidence   = parseCsv('vocab_confidence.csv');

// ── 2. Build lookup maps ────────────────────────────────────────────────────
const entityMap      = Object.fromEntries(rawEntities.map((e) => [e.id, e]));
const agentMap       = Object.fromEntries(rawAgents.map((a) => [a.id, a]));
const placeMap       = Object.fromEntries(rawPlaces.map((p) => [p.id, p]));
const institutionMap = Object.fromEntries(rawInstitutions.map((i) => [i.id, i]));
const vocabRelMap    = Object.fromEntries(rawVocabRelations.map((v) => [v.id, v]));
const vocabPlaceRoleSet = new Set(rawVocabPlaceRoles.map((v) => v.id));

function getLabel(id) {
  if (!id) return null;
  const r = entityMap[id] || agentMap[id] || placeMap[id] || institutionMap[id];
  return r ? r.label : null;
}

function getType(id) {
  if (!id) return null;
  if (entityMap[id]) return entityMap[id].type;
  if (agentMap[id]) return agentMap[id].type;
  if (placeMap[id]) return placeMap[id].type;
  if (institutionMap[id]) return institutionMap[id].type;
  return null;
}

// Returns the canonical URI for any node ID
function nodeUri(id) {
  if (!id) return null;
  if (entityMap[id])      return `https://atlas-mediaciones.github.io/fuente/${id}`;
  if (agentMap[id])       return `https://atlas-mediaciones.github.io/agente/${id}`;
  if (placeMap[id])       return `https://atlas-mediaciones.github.io/lugar/${id}`;
  if (institutionMap[id]) return `https://atlas-mediaciones.github.io/institucion/${id}`;
  return `https://atlas-mediaciones.github.io/recurso/${id}`;
}

// ── 3. entities.json ────────────────────────────────────────────────────────
const entities = rawEntities.map((e) => ({
  ...e,
  include_demo: toBool(e.include_demo),
  needs_review: toBool(e.needs_review),
  agent_ids: toArray(e.agent_ids),
  demo_priority: toNum(e.demo_priority)
}));
writeJson('entities.json', entities);

// ── 4. relations.json ───────────────────────────────────────────────────────
const relations = rawRelations.map((r) => {
  const subjectLabel = getLabel(r.subject_id);
  const objectLabel  = getLabel(r.object_id);
  const predicateEntry = vocabRelMap[r.predicate];

  if (!subjectLabel) {
    warn('broken_ref', `Broken ref in relations: subject_id "${r.subject_id}" not found (${r.id})`);
  }
  if (!objectLabel) {
    warn('broken_ref', `Broken ref in relations: object_id "${r.object_id}" not found (${r.id})`);
  }
  if (!predicateEntry) {
    warn('unknown_predicate', `Unknown predicate "${r.predicate}" not in vocab_relations (${r.id})`);
  }

  return {
    ...r,
    include_demo:    toBool(r.include_demo),
    needs_review:    toBool(r.needs_review),
    demo_priority:   toNum(r.demo_priority),
    subject_label:   subjectLabel,
    predicate_label: predicateEntry ? predicateEntry.label : r.predicate,
    object_label:    objectLabel
  };
});
writeJson('relations.json', relations);

// ── 5. graph.json ───────────────────────────────────────────────────────────
const allRelNodeIds = new Set();
rawRelations.forEach((r) => {
  if (r.subject_id) allRelNodeIds.add(r.subject_id);
  if (r.object_id)  allRelNodeIds.add(r.object_id);
});

const nodeMap = {};
rawEntities.forEach((e) => {
  nodeMap[e.id] = {
    id: e.id, label: e.label, type: e.type, chain: e.chain || null,
    include_demo: toBool(e.include_demo), source: 'entity'
  };
});

allRelNodeIds.forEach((id) => {
  if (nodeMap[id]) return;
  const a = agentMap[id];
  if (a) { nodeMap[id] = { id, label: a.label, type: a.type, chain: null, include_demo: false, source: 'agent' }; return; }
  const p = placeMap[id];
  if (p) { nodeMap[id] = { id, label: p.label, type: p.type, chain: null, include_demo: false, source: 'place' }; return; }
  const inst = institutionMap[id];
  if (inst) { nodeMap[id] = { id, label: inst.label, type: inst.type, chain: null, include_demo: false, source: 'institution' }; return; }
  nodeMap[id] = { id, label: id, type: 'unknown', chain: null, include_demo: false, source: 'unknown' };
});

rawRelations.forEach((r) => {
  if (!toBool(r.include_demo)) return;
  [r.subject_id, r.object_id].forEach((id) => {
    if (id && nodeMap[id] && nodeMap[id].source !== 'entity') {
      nodeMap[id].include_demo = true;
    }
  });
});

const edges = rawRelations.map((r) => {
  const predicateEntry = vocabRelMap[r.predicate];
  return {
    id: r.id,
    from: r.subject_id,
    to: r.object_id,
    label: predicateEntry ? predicateEntry.label : r.predicate,
    predicate: r.predicate,
    confidence: r.confidence || null,
    chain: r.chain || null,
    include_demo: toBool(r.include_demo)
  };
});

writeJson('graph.json', { nodes: Object.values(nodeMap), edges });

// ── 6. map.geojson ──────────────────────────────────────────────────────────
const placeAggr = {};

rawEntityPlaces.forEach((ep) => {
  const placeId = ep.place_id;
  if (!placeId) return;

  const role = ep.place_role;
  if (role && !vocabPlaceRoleSet.has(role)) {
    warn('unknown_place_role', `Unknown place_role "${role}" not in vocab_place_roles (entity_place ${ep.id})`);
  }

  if (!placeAggr[placeId]) {
    placeAggr[placeId] = { roles: new Set(), entities: new Set(), chains: new Set(), include_demo: false };
  }
  const agg = placeAggr[placeId];
  if (role) agg.roles.add(role);
  if (ep.entity_id) agg.entities.add(ep.entity_id);
  if (ep.chain) agg.chains.add(ep.chain);
  if (toBool(ep.include_demo)) agg.include_demo = true;
});

const features = [];
Object.entries(placeAggr).forEach(([placeId, agg]) => {
  const place = placeMap[placeId];
  if (!place) {
    warn('broken_ref', `entity_places references unknown place_id "${placeId}"`);
    return;
  }

  const lat = parseFloat(place.lat);
  const lng = parseFloat(place.lng);

  if (isNaN(lat) || isNaN(lng)) {
    warn('invalid_coords', `Place "${placeId}" has invalid lat/lng ("${place.lat}", "${place.lng}"); omitted from GeoJSON`);
    return;
  }

  features.push({
    type: 'Feature',
    properties: {
      id: placeId,
      label: place.label,
      place_roles: Array.from(agg.roles),
      entities: Array.from(agg.entities),
      chains: Array.from(agg.chains),
      include_demo: agg.include_demo
    },
    geometry: { type: 'Point', coordinates: [lng, lat] }
  });
});

writeJson('map.geojson', { type: 'FeatureCollection', features });

// ── 7. timeline.json ────────────────────────────────────────────────────────
const timeline = rawEvents.map((ev) => ({
  ...ev,
  include_demo:    toBool(ev.include_demo),
  demo_priority:   toNum(ev.demo_priority),
  entity_ids:      toArray(ev.entity_ids),
  place_ids:       toArray(ev.place_ids),
  institution_ids: toArray(ev.institution_ids)
}));
writeJson('timeline.json', timeline);

// ── 8. vocabularies.json ────────────────────────────────────────────────────
writeJson('vocabularies.json', {
  vocab_relations:   rawVocabRelations,
  vocab_place_roles: rawVocabPlaceRoles,
  vocab_confidence:  rawVocabConfidence
});

// ── 9. manifest.json ────────────────────────────────────────────────────────
const entitiesDemo  = entities.filter((e) => e.include_demo).length;
const relationsDemo = relations.filter((r) => r.include_demo).length;

const warningsList = Object.values(warnings).flat();

const manifest = {
  generated_at: new Date().toISOString(),
  files_processed: {
    inputs:  INPUT_CSVS.map((f) => `data/raw/${f}`),
    outputs: [] // filled after writeJson calls below
  },
  counts: {
    entities:         entities.length,
    entities_demo:    entitiesDemo,
    relations:        relations.length,
    relations_demo:   relationsDemo,
    agents:           rawAgents.length,
    places:           rawPlaces.length,
    institutions:     rawInstitutions.length,
    entity_places:    rawEntityPlaces.length,
    events:           timeline.length,
    geojson_features: features.length,
    graph_nodes:      Object.keys(nodeMap).length,
    graph_edges:      edges.length,
    vocab_relations:  rawVocabRelations.length,
    vocab_place_roles: rawVocabPlaceRoles.length,
    vocab_confidence: rawVocabConfidence.length
  },
  warnings: warningsList,           // flat array — consumed by homepage
  warnings_by_type: warnings,       // grouped by category
  warnings_total: warningsList.length
};

// ── 10. roulin.jsonld ───────────────────────────────────────────────────────

const jsonldContext = {
  dcterms:  'http://purl.org/dc/terms/',
  schema:   'https://schema.org/',
  skos:     'http://www.w3.org/2004/02/skos/core#',
  prov:     'http://www.w3.org/ns/prov#',
  atlas:    'https://atlas-mediaciones.github.io/vocab#',
  // Term shortcuts
  label:            'skos:prefLabel',
  note:             'skos:note',
  entityType:       'atlas:entityType',
  dateStart:        'dcterms:date',
  dateEnd:          'atlas:dateEnd',
  confidence:       'atlas:confidence',
  assertedBy:       'atlas:assertedBy',
  assertionBasis:   'atlas:assertionBasis',
  evidenceSource:   'atlas:evidenceSource',
  pageOrFolio:      'atlas:pageOrFolio',
  subject:          { '@id': 'atlas:subject',   '@type': '@id' },
  predicate:        'atlas:predicate',
  object:           { '@id': 'atlas:object',    '@type': '@id' }
};

// Entity nodes — all entities
const entityNodes = rawEntities.map((e) => {
  const node = {
    '@id':    `https://atlas-mediaciones.github.io/fuente/${e.id}`,
    '@type':  `atlas:${e.type}`,
    label:    e.label,
    entityType: e.type
  };
  if (e.date_start && String(e.date_start).trim()) node.dateStart = String(e.date_start).trim();
  if (e.date_end   && String(e.date_end).trim())   node.dateEnd   = String(e.date_end).trim();
  if (e.description && String(e.description).trim()) {
    node['dcterms:description'] = String(e.description).trim();
  }
  if (e.chain && String(e.chain).trim()) node['atlas:chain'] = String(e.chain).trim();
  return node;
});

// Relation nodes — all relations, expressed as named assertion nodes
const relationNodes = rawRelations.map((r) => {
  const node = {
    '@id':   `https://atlas-mediaciones.github.io/relacion/${r.id}`,
    '@type': 'atlas:Assertion',
    subject: nodeUri(r.subject_id),
    predicate: r.predicate,
    object:  nodeUri(r.object_id)
  };
  if (r.confidence      && r.confidence.trim())      node.confidence      = r.confidence.trim();
  if (r.asserted_by     && r.asserted_by.trim())     node.assertedBy      = r.asserted_by.trim();
  if (r.assertion_basis && r.assertion_basis.trim()) node.assertionBasis  = r.assertion_basis.trim();
  if (r.evidence_source && r.evidence_source.trim()) node.evidenceSource  = r.evidence_source.trim();
  if (r.page_or_folio   && r.page_or_folio.trim())   node.pageOrFolio     = r.page_or_folio.trim();
  if (r.note            && r.note.trim())             node.note            = r.note.trim();
  return node;
});

const jsonld = {
  '@context': jsonldContext,
  '@graph': [...entityNodes, ...relationNodes]
};

writeJson('roulin.jsonld', jsonld);

// Now that all outputs are known, fill files_processed.outputs
manifest.files_processed.outputs = [...outputFiles];
writeJson('manifest.json', manifest);

// ── Summary ─────────────────────────────────────────────────────────────────
const wTotal = totalWarnings();
console.log('\n=== build:data complete ===');
console.log(`Entities  : ${entities.length} total, ${entitiesDemo} demo`);
console.log(`Relations : ${relations.length} total, ${relationsDemo} demo`);
console.log(`Graph     : ${Object.keys(nodeMap).length} nodes, ${edges.length} edges`);
console.log(`GeoJSON   : ${features.length} features`);
console.log(`Timeline  : ${timeline.length} events`);
console.log(`JSON-LD   : ${entityNodes.length} entity nodes, ${relationNodes.length} relation nodes`);
console.log(`Warnings  : ${wTotal}`);
if (wTotal > 0) {
  console.log('\nWarnings by type:');
  for (const [cat, items] of Object.entries(warnings)) {
    console.log(`  [${cat}] ${items.length}`);
    items.forEach((w) => console.log(`    - ${w}`));
  }
}
