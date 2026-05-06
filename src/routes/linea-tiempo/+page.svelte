<script>
	import DemoToggle from '$lib/components/DemoToggle.svelte';
	import TimelineLayers from '$lib/components/TimelineLayers.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Línea de tiempo — Atlas de mediaciones</title>
</svelte:head>

<div class="page-header">
	<div>
		<h1>Línea de tiempo</h1>
		<p class="subtitle">
			Capas de mediación histórica del corpus Roulin: de la ciencia del siglo XIX a la digitalización.
		</p>
	</div>
	<DemoToggle />
</div>

<TimelineLayers events={data.events} entityMap={data.entityMap} />

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
