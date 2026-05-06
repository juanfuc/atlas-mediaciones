<script>
	import { demoOnly } from '$lib/stores/demo.js';
	import { applyDemo, filterByType, filterByChain } from '$lib/utils/filters.js';
	import DemoToggle from '$lib/components/DemoToggle.svelte';
	import SourceCard from '$lib/components/SourceCard.svelte';

	let { data } = $props();

	// ── Filter state ──────────────────────────────────────────────
	let selectedType = $state('');
	let selectedChain = $state('');
	let selectedConfidence = $state('');

	// ── Precompute: entity id → unique confidence values ──────────
	const entityConfMap = $derived.by(() => {
		/** @type {Record<string, string[]>} */
		const map = {};
		for (const rel of data.relations) {
			for (const id of [rel.subject_id, rel.object_id]) {
				if (!id) continue;
				if (!map[id]) map[id] = [];
				if (rel.confidence && !map[id].includes(rel.confidence)) {
					map[id].push(rel.confidence);
				}
			}
		}
		return map;
	});

	const uniqueTypes = $derived(
		[...new Set(data.entities.map((e) => e.type).filter(Boolean))].sort()
	);

	const uniqueChains = $derived(
		[...new Set(data.entities.map((e) => e.chain).filter(Boolean))].sort()
	);

	// ── Filtered list (reactive) ──────────────────────────────────
	const filtered = $derived.by(() => {
		let items = data.entities;
		items = applyDemo(items, $demoOnly);
		if (selectedType) items = filterByType(items, selectedType);
		if (selectedChain) items = filterByChain(items, selectedChain);
		if (selectedConfidence) {
			items = items.filter((e) => (entityConfMap[e.id] ?? []).includes(selectedConfidence));
		}
		return items;
	});

	const hasFilters = $derived(!!selectedType || !!selectedChain || !!selectedConfidence);

	function clearFilters() {
		selectedType = '';
		selectedChain = '';
		selectedConfidence = '';
	}
</script>

<svelte:head>
	<title>Repositorio · Atlas de mediaciones</title>
</svelte:head>

<div class="container">

	<!-- ── Cabecera ─────────────────────────────────────────────── -->
	<div class="page-header">
		<div class="title-row">
			<h1>Repositorio</h1>
			<DemoToggle />
		</div>
		<p class="result-count">
			{filtered.length}
			{filtered.length === 1 ? 'entidad' : 'entidades'}
			·
			{$demoOnly ? 'modo demo' : 'corpus completo'}
		</p>
	</div>

	<!-- ── Filtros ──────────────────────────────────────────────── -->
	<div class="filters" role="search" aria-label="Filtros del repositorio">
		<label class="filter-group">
			<span class="filter-label">Tipo</span>
			<select bind:value={selectedType}>
				<option value="">Todos</option>
				{#each uniqueTypes as t}
					<option value={t}>{t}</option>
				{/each}
			</select>
		</label>

		<label class="filter-group">
			<span class="filter-label">Cadena</span>
			<select bind:value={selectedChain}>
				<option value="">Todas</option>
				{#each uniqueChains as c}
					<option value={c}>{c}</option>
				{/each}
			</select>
		</label>

		<label class="filter-group">
			<span class="filter-label">Confianza</span>
			<select bind:value={selectedConfidence}>
				<option value="">Todas</option>
				<option value="documentada">Documentada</option>
				<option value="inferida">Inferida</option>
				<option value="hipotetica">Hipotética</option>
			</select>
		</label>

		{#if hasFilters}
			<button class="clear-btn" onclick={clearFilters}>Limpiar filtros</button>
		{/if}
	</div>

	<!-- ── Resultados ───────────────────────────────────────────── -->
	{#if filtered.length === 0}
		<p class="empty">No hay entidades que coincidan con los filtros seleccionados.</p>
	{:else}
		<div class="grid">
			{#each filtered as entity (entity.id)}
				<SourceCard {entity} confidences={entityConfMap[entity.id] ?? []} />
			{/each}
		</div>
	{/if}

</div>

<style>
	.container {
		max-width: var(--max-w);
		margin: 0 auto;
		padding: var(--sp-xl) var(--sp-lg);
	}

	/* ── Cabecera ── */
	.page-header {
		margin-bottom: var(--sp-lg);
		padding-bottom: var(--sp-lg);
		border-bottom: 1px solid var(--c-line);
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: var(--sp-lg);
		flex-wrap: wrap;
		margin-bottom: 0.35rem;
	}

	.title-row h1 {
		font-size: 1.75rem;
	}

	.result-count {
		font-size: 0.875rem;
		color: var(--c-secondary);
		margin: 0;
	}

	/* ── Filtros ── */
	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: var(--sp-sm) var(--sp-md);
		margin-bottom: var(--sp-xl);
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.filter-label {
		font-size: 0.75rem;
		color: var(--c-secondary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.filters select {
		font-family: var(--f-sans);
		font-size: 0.875rem;
		padding: 0.3rem 0.6rem;
		border: 1px solid var(--c-line);
		border-radius: var(--radius);
		background: var(--c-bg);
		color: var(--c-text);
		cursor: pointer;
		min-width: 8rem;
	}

	.filters select:focus {
		outline: none;
		border-color: var(--c-accent);
	}

	.clear-btn {
		font-family: var(--f-sans);
		font-size: 0.8125rem;
		padding: 0.3rem 0.75rem;
		border: 1px solid var(--c-line);
		border-radius: var(--radius);
		background: transparent;
		color: var(--c-secondary);
		cursor: pointer;
		align-self: flex-end;
	}

	.clear-btn:hover {
		border-color: var(--c-accent);
		color: var(--c-accent);
	}

	/* ── Resultados ── */
	.empty {
		color: var(--c-secondary);
		font-style: italic;
		margin-top: var(--sp-xl);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--sp-md);
	}
</style>
