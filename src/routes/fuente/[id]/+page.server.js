import { error } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATA = join(process.cwd(), 'static', 'data');

function readJson(name) {
	return JSON.parse(readFileSync(join(DATA, name), 'utf-8'));
}

export function entries() {
	return readJson('entities.json').map((e) => ({ id: e.id }));
}

export function load({ params }) {
	const entities = readJson('entities.json');
	const entity = entities.find((e) => e.id === params.id);
	if (!entity) error(404, `Entidad no encontrada: ${params.id}`);

	const relations = readJson('relations.json');
	const timeline = readJson('timeline.json');
	const { features } = readJson('map.geojson');

	const outgoing = relations.filter((r) => r.subject_id === params.id);
	const incoming = relations.filter((r) => r.object_id === params.id);
	const events = timeline.filter((ev) => (ev.entity_ids ?? []).includes(params.id));
	const places = features.filter((f) => (f.properties.entities ?? []).includes(params.id));
	const entityIds = entities.map((e) => e.id);

	return { entity, outgoing, incoming, events, places, entityIds };
}
