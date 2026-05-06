import { base } from '$app/paths';

export async function load({ fetch }) {
	const [timeline, entities] = await Promise.all([
		fetch(`${base}/data/timeline.json`).then((r) => r.json()),
		fetch(`${base}/data/entities.json`).then((r) => r.json())
	]);
	const entityMap = Object.fromEntries(entities.map((e) => [e.id, e]));
	return { events: timeline, entityMap };
}
