import { base } from '$app/paths';

export async function load({ fetch }) {
	const [geojson, entities] = await Promise.all([
		fetch(`${base}/data/map.geojson`).then((r) => r.json()),
		fetch(`${base}/data/entities.json`).then((r) => r.json())
	]);
	const entityMap = Object.fromEntries(entities.map((e) => [e.id, e]));
	return { features: geojson.features, entityMap };
}
