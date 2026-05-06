import { base } from '$app/paths';

const cache = {};

async function load(key, path) {
	if (cache[key] !== undefined) return cache[key];
	const res = await fetch(`${base}${path}`);
	if (!res.ok) throw new Error(`loadData: ${res.status} ${path}`);
	cache[key] = await res.json();
	return cache[key];
}

export const loadEntities     = () => load('entities',     '/data/entities.json');
export const loadRelations    = () => load('relations',    '/data/relations.json');
export const loadGraph        = () => load('graph',        '/data/graph.json');
export const loadMap          = () => load('map',          '/data/map.geojson');
export const loadTimeline     = () => load('timeline',     '/data/timeline.json');
export const loadVocabularies = () => load('vocabularies', '/data/vocabularies.json');
export const loadManifest     = () => load('manifest',     '/data/manifest.json');
