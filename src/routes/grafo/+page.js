import { base } from '$app/paths';

export async function load({ fetch }) {
	const [graph, relations] = await Promise.all([
		fetch(`${base}/data/graph.json`).then((r) => r.json()),
		fetch(`${base}/data/relations.json`).then((r) => r.json())
	]);
	const relationMap = Object.fromEntries(relations.map((r) => [r.id, r]));
	return { nodes: graph.nodes, edges: graph.edges, relationMap };
}
