<script>
	import DemoToggle from '$lib/components/DemoToggle.svelte';
	import MapView from '$lib/components/MapView.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Mapa de mediaciones — Atlas de mediaciones</title>
</svelte:head>

<div class="page-header">
	<div>
		<h1>Mapa de mediaciones</h1>
		<p class="subtitle">
			Geografías de representación, producción, publicación, custodia y circulación del corpus Roulin.
		</p>
	</div>
	<DemoToggle />
</div>

<MapView features={data.features} entityMap={data.entityMap} />

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
