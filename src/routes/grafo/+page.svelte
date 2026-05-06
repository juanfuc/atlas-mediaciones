<script>
	import DemoToggle from '$lib/components/DemoToggle.svelte';
	import GraphView from '$lib/components/GraphView.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Grafo de relaciones — Atlas de mediaciones</title>
</svelte:head>

<div class="page-header">
	<div>
		<h1>Grafo de relaciones</h1>
		<p class="subtitle">Red de conexiones entre entidades, agentes, lugares e instituciones del corpus Roulin.</p>
	</div>
	<DemoToggle />
</div>

<GraphView nodes={data.nodes} edges={data.edges} relationMap={data.relationMap} />

<style>
	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
		flex-wrap: wrap;
	}

	h1 {
		font-size: 1.6rem;
		margin-bottom: 0.25rem;
	}

	.subtitle {
		color: var(--c-secondary);
		font-size: 0.9rem;
		max-width: 60ch;
	}
</style>
