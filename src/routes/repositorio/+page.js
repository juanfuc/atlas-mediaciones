import { base } from '$app/paths';

export async function load({ fetch }) {
	const [entities, relations] = await Promise.all([
		fetch(`${base}/data/entities.json`).then((r) => r.json()),
		fetch(`${base}/data/relations.json`).then((r) => r.json())
	]);
	return { entities, relations };
}
