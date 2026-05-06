import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const RAW = join(ROOT, 'data', 'raw');

// ── Schema definitions ───────────────────────────────────────────────────────

const REQUIRED_CSVS = [
  'entities.csv',
  'relations.csv',
  'agents.csv',
  'places.csv',
  'institutions.csv',
  'entity_places.csv',
  'events.csv',
  'vocab_relations.csv',
  'vocab_place_roles.csv',
  'vocab_confidence.csv'
];

const CRITICAL_COLUMNS = {
  'entities.csv':          ['id', 'label', 'type', 'include_demo'],
  'relations.csv':         ['id', 'subject_id', 'predicate', 'object_id', 'confidence'],
  'agents.csv':            ['id', 'label', 'type'],
  'places.csv':            ['id', 'label', 'lat', 'lng'],
  'institutions.csv':      ['id', 'label'],
  'entity_places.csv':     ['id', 'entity_id', 'place_id', 'place_role'],
  'events.csv':            ['id', 'label', 'date_start', 'layer'],
  'vocab_relations.csv':   ['id', 'label'],
  'vocab_place_roles.csv': ['id'],
  'vocab_confidence.csv':  ['id']
};

// ── Accumulators ─────────────────────────────────────────────────────────────

const warnings = {};
function warn(category, msg) {
  (warnings[category] ??= []).push(msg);
}

let hasFatal = false;
function fatal(msg) {
  hasFatal = true;
  console.error('[FATAL]', msg);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseCsv(filename) {
  const filepath = join(RAW, filename);
  let content;
  try {
    content = readFileSync(filepath, 'utf-8');
  } catch (e) {
    fatal(`Cannot read ${filename}: ${e.message}`);
    return null;
  }
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim()
  });
  result.errors.forEach((e) =>
    warn('parse_error', `${filename}: ${e.message} (row ${e.row})`)
  );
  return result.data;
}

function toBool(val) {
  return String(val ?? '').trim().toLowerCase() === 'yes';
}

function toArray(val) {
  if (!val) return [];
  return String(val).split(';').map((s) => s.trim()).filter(Boolean);
}

// Returns true if valid year (YYYY or YYYY.0), false if invalid, null if empty
function isValidYear(val) {
  if (val === undefined || val === null || String(val).trim() === '') return null;
  return /^\d{4}(\.0)?$/.test(String(val).trim());
}

// ── Step 1: Required CSV files ───────────────────────────────────────────────

console.log('── Checking required CSV files ──');
const missingFiles = REQUIRED_CSVS.filter((f) => !existsSync(join(RAW, f)));
missingFiles.forEach((f) => fatal(`Missing required CSV: data/raw/${f}`));

if (missingFiles.length) {
  console.error(`\n${missingFiles.length} required CSV(s) missing. Cannot continue.`);
  process.exit(1);
}
console.log(`  ${REQUIRED_CSVS.length}/${REQUIRED_CSVS.length} required files present`);

// ── Step 2: Parse all CSVs ───────────────────────────────────────────────────

console.log('\n── Parsing CSV files ──');
const csvMap = {};
for (const f of REQUIRED_CSVS) {
  const rows = parseCsv(f);
  if (rows === null) continue;
  csvMap[f] = rows;
  console.log(`  ${f}: ${rows.length} rows`);
}

if (hasFatal) {
  console.error('\nFatal parse errors. Cannot continue.');
  process.exit(1);
}

// ── Step 3: Critical columns ─────────────────────────────────────────────────

console.log('\n── Checking critical columns ──');
for (const [file, cols] of Object.entries(CRITICAL_COLUMNS)) {
  if (!csvMap[file]) continue;
  const headers = csvMap[file].length > 0 ? Object.keys(csvMap[file][0]) : [];
  cols
    .filter((c) => !headers.includes(c))
    .forEach((c) => fatal(`${file}: missing critical column "${c}"`));
}

if (hasFatal) {
  console.error('\nCritical columns missing. Cannot continue.');
  process.exit(1);
}
console.log('  All critical columns present');

// ── Step 4: Build lookup sets ────────────────────────────────────────────────

const entities      = csvMap['entities.csv'];
const relations     = csvMap['relations.csv'];
const agents        = csvMap['agents.csv'];
const places        = csvMap['places.csv'];
const entityPlaces  = csvMap['entity_places.csv'];
const events        = csvMap['events.csv'];
const vocabRelations    = csvMap['vocab_relations.csv'];
const vocabPlaceRoles   = csvMap['vocab_place_roles.csv'];

const entityIds      = new Set(entities.map((e) => e.id));
const agentIds       = new Set(agents.map((a) => a.id));
const placeIds       = new Set(places.map((p) => p.id));
const allNodeIds     = new Set([
  ...entityIds,
  ...agentIds,
  ...placeIds,
  ...csvMap['institutions.csv'].map((i) => i.id)
]);
const vocabRelIds        = new Set(vocabRelations.map((v) => v.id));
const vocabPlaceRoleIds  = new Set(vocabPlaceRoles.map((v) => v.id));

// ── Step 5: Data-level validations ───────────────────────────────────────────

console.log('\n── Running data validations ──');

// 5a. Broken refs in relations (subject_id, object_id)
relations.forEach((r) => {
  if (!r.subject_id || r.subject_id.trim() === '') {
    warn('broken_ref', `relations.csv (${r.id}): subject_id is empty`);
  } else if (!allNodeIds.has(r.subject_id)) {
    warn('broken_ref', `relations.csv (${r.id}): subject_id "${r.subject_id}" not found in any table`);
  }
  if (!r.object_id || r.object_id.trim() === '') {
    warn('broken_ref', `relations.csv (${r.id}): object_id is empty`);
  } else if (!allNodeIds.has(r.object_id)) {
    warn('broken_ref', `relations.csv (${r.id}): object_id "${r.object_id}" not found in any table`);
  }
});

// 5b. Unknown predicates
relations.forEach((r) => {
  if (r.predicate && !vocabRelIds.has(r.predicate)) {
    warn('unknown_predicate', `relations.csv (${r.id}): predicate "${r.predicate}" not in vocab_relations`);
  }
  if (!r.predicate) {
    warn('unknown_predicate', `relations.csv (${r.id}): predicate is empty`);
  }
});

// 5c. place_role outside vocab in entity_places
entityPlaces.forEach((ep) => {
  if (ep.place_role && !vocabPlaceRoleIds.has(ep.place_role)) {
    warn('unknown_place_role', `entity_places.csv (${ep.id}): place_role "${ep.place_role}" not in vocab_place_roles`);
  }
  if (!ep.place_role) {
    warn('unknown_place_role', `entity_places.csv (${ep.id}): place_role is empty`);
  }
});

// 5d. Broken refs in entity_places (entity_id, place_id)
entityPlaces.forEach((ep) => {
  if (ep.entity_id && !entityIds.has(ep.entity_id)) {
    warn('broken_ref', `entity_places.csv (${ep.id}): entity_id "${ep.entity_id}" not in entities`);
  }
  if (ep.place_id && !placeIds.has(ep.place_id)) {
    warn('broken_ref', `entity_places.csv (${ep.id}): place_id "${ep.place_id}" not in places`);
  }
});

// 5e. entity_ids and place_ids in events not found
events.forEach((ev) => {
  toArray(ev.entity_ids).forEach((eid) => {
    if (!entityIds.has(eid)) {
      warn('broken_ref', `events.csv (${ev.id}): entity_id "${eid}" not in entities`);
    }
  });
  toArray(ev.place_ids).forEach((pid) => {
    if (!placeIds.has(pid)) {
      warn('broken_ref', `events.csv (${ev.id}): place_id "${pid}" not in places`);
    }
  });
});

// 5f. Invalid coordinates in places (lat/lng range check)
places.forEach((p) => {
  const lat = parseFloat(p.lat);
  const lng = parseFloat(p.lng);
  if (isNaN(lat) || isNaN(lng)) {
    warn('invalid_coords', `places.csv (${p.id}): non-numeric lat/lng ("${p.lat}", "${p.lng}")`);
  } else {
    if (lat < -90 || lat > 90)
      warn('invalid_coords', `places.csv (${p.id}): lat ${lat} out of range [-90, 90]`);
    if (lng < -180 || lng > 180)
      warn('invalid_coords', `places.csv (${p.id}): lng ${lng} out of range [-180, 180]`);
  }
});

// 5g. include_demo=yes without demo_priority
[
  { file: 'entities.csv',  rows: entities },
  { file: 'relations.csv', rows: relations },
  { file: 'events.csv',    rows: events }
].forEach(({ file, rows }) => {
  rows.forEach((row) => {
    if (toBool(row.include_demo)) {
      const dp = row.demo_priority;
      if (dp === undefined || dp === null || String(dp).trim() === '') {
        warn('missing_demo_priority', `${file} (${row.id}): include_demo=yes but demo_priority is empty`);
      }
    }
  });
});

// 5h. Malformed or inconsistent dates
entities.forEach((e) => {
  const ds = isValidYear(e.date_start);
  const de = isValidYear(e.date_end);
  if (ds === false)
    warn('malformed_date', `entities.csv (${e.id}): date_start "${e.date_start}" is not a valid year (YYYY)`);
  if (de === false)
    warn('malformed_date', `entities.csv (${e.id}): date_end "${e.date_end}" is not a valid year (YYYY)`);
  if (ds && de && parseInt(e.date_end) < parseInt(e.date_start))
    warn('malformed_date', `entities.csv (${e.id}): date_end (${e.date_end}) < date_start (${e.date_start})`);
});

events.forEach((ev) => {
  const ds = isValidYear(ev.date_start);
  const de = isValidYear(ev.date_end);
  if (ds === false || ds === null)
    warn('malformed_date', `events.csv (${ev.id}): date_start "${ev.date_start}" is not a valid year (YYYY)`);
  if (de === false)
    warn('malformed_date', `events.csv (${ev.id}): date_end "${ev.date_end}" is not a valid year (YYYY)`);
  if (ds && de && parseInt(ev.date_end) < parseInt(ev.date_start))
    warn('malformed_date', `events.csv (${ev.id}): date_end (${ev.date_end}) < date_start (${ev.date_start})`);
});

// ── Report ────────────────────────────────────────────────────────────────────

const totalWarnings = Object.values(warnings).reduce((s, a) => s + a.length, 0);
console.log('\n── Validation report ──');

if (totalWarnings === 0) {
  console.log('  No warnings — data looks clean.');
} else {
  for (const cat of Object.keys(warnings).sort()) {
    const items = warnings[cat];
    console.log(`\n  [${cat}] ${items.length} issue(s):`);
    items.forEach((w) => console.log(`    · ${w}`));
  }
  console.log(
    `\n  Total: ${totalWarnings} warning(s) across ${Object.keys(warnings).length} category(ies).`
  );
  console.log('  (exit 0 — warnings do not block build)');
}

process.exit(0);
