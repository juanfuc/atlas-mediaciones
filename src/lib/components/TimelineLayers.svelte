<script>
	import { base } from '$app/paths';
	import { demoOnly } from '$lib/stores/demo.js';

	let { events, entityMap } = $props();

	let selected = $state(null);

	// ── Layer configuration ───────────────────────────────────────────────────────

	const LAYER_ORDER = [
		'siglo_xix_cientifico_comparativo',
		'circulacion_editorial',
		'mediacion_republicana',
		'patrimonializacion_siglo_xx',
		'mediacion_digital_siglo_xxi'
	];

	const LAYER_NAMES = {
		siglo_xix_cientifico_comparativo: 'Siglo XIX — Científico comparativo',
		circulacion_editorial: 'Circulación editorial',
		mediacion_republicana: 'Mediación republicana',
		patrimonializacion_siglo_xx: 'Patrimonialización — siglo XX',
		mediacion_digital_siglo_xxi: 'Mediación digital — siglo XXI'
	};

	const LAYER_COLORS = {
		siglo_xix_cientifico_comparativo: '#C9A07A',
		circulacion_editorial: '#9DA88C',
		mediacion_republicana: '#8CAAA8',
		patrimonializacion_siglo_xx: '#B4A0B0',
		mediacion_digital_siglo_xxi: '#A8B0C4'
	};

	// ── Timeline scale: 1800–2026, ticks every 25 years ─────────────────────────

	const YEAR_MIN = 1800;
	const YEAR_MAX = 2026;
	const TICKS = [1825, 1850, 1875, 1900, 1925, 1950, 1975, 2000];

	function yearToPct(year) {
		return ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100;
	}

	// ── Reactive derived values ───────────────────────────────────────────────────

	const filteredEvents = $derived.by(() => {
		if (!$demoOnly) return events;
		// Filter by include_demo if the field exists; else show all
		const demo = events.filter((e) => e.include_demo === true);
		return demo.length > 0 ? demo : events;
	});

	const eventsByLayer = $derived.by(() => {
		const byLayer = {};
		for (const ev of filteredEvents) {
			const l = ev.layer;
			(byLayer[l] ??= []).push(ev);
		}
		for (const l in byLayer) {
			byLayer[l].sort((a, b) => parseInt(a.date_start) - parseInt(b.date_start));
		}
		return byLayer;
	});

	const visibleLayers = $derived.by(() => {
		const known = LAYER_ORDER.filter((l) => eventsByLayer[l]?.length > 0);
		const extra = Object.keys(eventsByLayer).filter((l) => !LAYER_ORDER.includes(l));
		return [...known, ...extra];
	});

	const visibleEventCount = $derived(filteredEvents.length);
	const visibleLayerCount = $derived(visibleLayers.length);

	// ── Helpers ───────────────────────────────────────────────────────────────────

	function entityLabel(eid) {
		return entityMap[eid]?.label ?? eid;
	}

	function isNavigable(eid) {
		return eid in entityMap;
	}

	function formatDate(ev) {
		if (!ev.date_end || ev.date_start === ev.date_end) return ev.date_start;
		return `${ev.date_start}–${ev.date_end}`;
	}

	function layerName(l) {
		return LAYER_NAMES[l] ?? l.replace(/_/g, ' ');
	}

	function layerColor(l) {
		return LAYER_COLORS[l] ?? '#9E9890';
	}

	function selectEvent(ev) {
		selected = selected?.id === ev.id ? null : ev;
	}

	function closePanel() {
		selected = null;
	}

	function placeLabel(pid) {
		return pid.replace(/^plc_/, '').replace(/_/g, ' ');
	}
</script>

<div class="tl-wrap">

	<!-- Counter + note -->
	<div class="tl-top">
		<span class="counter">
			eventos visibles: {visibleEventCount} · capas: {visibleLayerCount}
		</span>
	</div>

	<p class="tl-note">
		La línea de tiempo no ordena solo fechas de producción; muestra capas de reorientación histórica
		del corpus.
	</p>

	<!-- SVG overview: axis, ticks, and per-layer event dots ───────────────────── -->
	<div class="overview-wrap">
		<!-- Dot rows (one row per layer, HTML-positioned) -->
		<div class="dot-rows" aria-hidden="true">
			{#each visibleLayers as layer, li}
				<div class="dot-row">
					{#each (eventsByLayer[layer] ?? []) as ev}
						<span
							class="ev-dot"
							style="left:{yearToPct(parseInt(ev.date_start))}%;background:{layerColor(layer)};"
							title="{ev.date_start} — {ev.label}"
						></span>
					{/each}
				</div>
			{/each}
		</div>

		<!-- SVG axis line and tick marks only (no text — avoids distortion) -->
		<svg
			viewBox="0 0 100 8"
			preserveAspectRatio="none"
			class="axis-svg"
			aria-hidden="true"
		>
			<line x1="0" y1="4" x2="100" y2="4" stroke="#D8CFC2" stroke-width="0.4" />
			{#each TICKS as tick}
				{@const x = yearToPct(tick)}
				<line x1={x} y1="1" x2={x} y2="7" stroke="#D8CFC2" stroke-width="0.4" />
			{/each}
		</svg>

		<!-- Tick labels as HTML (avoids SVG text distortion) -->
		<div class="tick-labels" aria-hidden="true">
			{#each TICKS as tick}
				<span class="tick-label" style="left:{yearToPct(tick)}%">{tick}</span>
			{/each}
		</div>
	</div>

	<!-- Layer legend ─────────────────────────────────────────────────────────────  -->
	<div class="layer-legend">
		{#each visibleLayers as l}
			<span class="leg-layer">
				<span class="leg-dot" style="background:{layerColor(l)};"></span>
				{layerName(l)}
			</span>
		{/each}
	</div>

	<!-- Main: event list + detail panel ─────────────────────────────────────────  -->
	<div class="main">
		<div class="layers">
			{#each visibleLayers as layer}
				<section class="layer-band" style="--layer-c:{layerColor(layer)}">
					<div class="layer-header">
						<span class="layer-accent" style="background:{layerColor(layer)};"></span>
						<h3 class="layer-title">{layerName(layer)}</h3>
					</div>
					<ul class="event-list">
						{#each eventsByLayer[layer] as ev}
							<li
								class="event-item"
								class:active={selected?.id === ev.id}
								onclick={() => selectEvent(ev)}
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && selectEvent(ev)}
							>
								<span class="event-year">{formatDate(ev)}</span>
								<span class="event-label">{ev.label}</span>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>

		{#if selected}
			<aside class="panel">
				<button class="close" onclick={closePanel} aria-label="Cerrar panel">✕</button>

				<p class="panel-date">{formatDate(selected)}</p>
				<h3 class="panel-title">{selected.label}</h3>

				<span
					class="panel-layer-tag"
					style="background:{layerColor(selected.layer)}22;color:{layerColor(selected.layer)};"
				>
					{layerName(selected.layer)}
				</span>

				{#if selected.description}
					<p class="panel-desc">{selected.description}</p>
				{/if}

				{#if selected.entity_ids?.length}
					<div class="panel-section">
						<h4 class="panel-section-title">Entidades</h4>
						{#each selected.entity_ids as eid}
							<div class="entity-row">
								{#if isNavigable(eid)}
									<a href="{base}/fuente/{eid}/" class="entity-link">{entityLabel(eid)}</a>
								{:else}
									<span class="entity-nolink">{entityLabel(eid)}</span>
								{/if}
							</div>
						{/each}
					</div>
				{/if}

				{#if selected.place_ids?.length}
					<div class="panel-section">
						<h4 class="panel-section-title">Lugares</h4>
						{#each selected.place_ids as pid}
							<div class="place-row">{placeLabel(pid)}</div>
						{/each}
					</div>
				{/if}

				<p class="panel-id">{selected.id}</p>
			</aside>
		{/if}
	</div>

</div>

<style>
	.tl-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* Top bar */
	.tl-top {
		display: flex;
		align-items: center;
	}

	.counter {
		font-size: 0.8rem;
		color: var(--c-secondary);
	}

	.tl-note {
		font-size: 0.78rem;
		color: var(--c-secondary);
		font-style: italic;
		background: var(--c-surface);
		border: 1px solid var(--c-line);
		border-radius: var(--radius);
		padding: 0.35rem 0.75rem;
		margin: 0;
	}

	/* ── Overview strip ──────────────────────────────────────────────────────── */

	.overview-wrap {
		position: relative;
		padding-bottom: 1.4rem; /* room for tick labels */
	}

	/* One dot row per layer, with dots at proportional left positions */
	.dot-rows {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 3px;
		margin-bottom: 2px;
	}

	.dot-row {
		position: relative;
		height: 14px;
	}

	.ev-dot {
		position: absolute;
		width: 11px;
		height: 11px;
		border-radius: 50%;
		top: 1px;
		transform: translateX(-50%);
		border: 1px solid rgba(255, 255, 255, 0.7);
		cursor: default;
		transition: transform 0.12s;
	}

	.ev-dot:hover {
		transform: translateX(-50%) scale(1.45);
		border-color: rgba(255, 255, 255, 0.9);
	}

	/* SVG axis: just the line and tick marks, no text */
	.axis-svg {
		display: block;
		width: 100%;
		height: 10px;
		overflow: visible;
	}

	/* Tick labels as HTML positioned below the axis */
	.tick-labels {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 1.2rem;
	}

	.tick-label {
		position: absolute;
		transform: translateX(-50%);
		font-size: 0.67rem;
		color: var(--c-secondary);
		white-space: nowrap;
		line-height: 1;
	}

	/* ── Layer legend ────────────────────────────────────────────────────────── */

	.layer-legend {
		display: flex;
		gap: 0.5rem 1rem;
		flex-wrap: wrap;
		align-items: center;
		font-size: 0.76rem;
		color: var(--c-secondary);
	}

	.leg-layer {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}

	.leg-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.15);
		flex-shrink: 0;
	}

	/* ── Main: layers list + panel ───────────────────────────────────────────── */

	.main {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.layers {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Layer band */
	.layer-band {
		border: 1px solid var(--c-line);
		border-radius: var(--radius);
		background: var(--c-bg);
		overflow: hidden;
	}

	.layer-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.85rem;
		background: var(--c-surface);
		border-bottom: 1px solid var(--c-line);
	}

	.layer-accent {
		width: 4px;
		min-height: 1rem;
		border-radius: 2px;
		flex-shrink: 0;
		align-self: stretch;
	}

	.layer-title {
		font-size: 0.82rem;
		font-weight: 500;
		margin: 0;
		color: var(--c-text);
	}

	/* Event rows */
	.event-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.event-item {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		padding: 0.45rem 0.85rem;
		cursor: pointer;
		border-bottom: 1px solid var(--c-line);
		transition: background 0.1s;
		border-left: 3px solid transparent;
	}

	.event-item:last-child {
		border-bottom: none;
	}

	.event-item:hover {
		background: var(--c-surface);
		border-left-color: var(--layer-c, var(--c-accent));
	}

	.event-item.active {
		background: var(--c-surface);
		border-left-color: var(--layer-c, var(--c-accent));
	}

	.event-year {
		font-family: var(--f-mono);
		font-size: 0.74rem;
		color: var(--c-secondary);
		white-space: nowrap;
		min-width: 3.8rem;
		flex-shrink: 0;
	}

	.event-label {
		font-size: 0.875rem;
		color: var(--c-text);
		line-height: 1.4;
	}

	/* ── Detail panel ─────────────────────────────────────────────────────────── */

	.panel {
		width: 280px;
		flex-shrink: 0;
		border: 1px solid var(--c-line);
		border-radius: var(--radius);
		background: var(--c-bg);
		padding: 1rem;
		position: sticky;
		top: 1rem;
		max-height: calc(100vh - 5rem);
		overflow-y: auto;
	}

	.close {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--c-secondary);
		font-size: 0.8rem;
		padding: 0.25rem;
		line-height: 1;
	}
	.close:hover { color: var(--c-text); }

	.panel-date {
		font-family: var(--f-mono);
		font-size: 0.78rem;
		color: var(--c-secondary);
		margin: 0 0 0.2rem;
	}

	.panel-title {
		font-size: 0.9rem;
		line-height: 1.4;
		margin: 0 1.5rem 0.5rem 0;
	}

	.panel-layer-tag {
		display: inline-block;
		font-size: 0.71rem;
		padding: 2px 8px;
		border-radius: 3px;
		margin-bottom: 0.75rem;
		font-weight: 500;
	}

	.panel-desc {
		font-size: 0.82rem;
		color: var(--c-text);
		line-height: 1.55;
		margin: 0 0 0.5rem;
		border-top: 1px solid var(--c-line);
		padding-top: 0.6rem;
	}

	.panel-section {
		margin-top: 0.6rem;
	}

	.panel-section-title {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--c-secondary);
		margin: 0 0 0.35rem;
		font-weight: 500;
	}

	.entity-row,
	.place-row {
		padding: 0.15rem 0;
	}

	.entity-link {
		color: var(--c-accent);
		text-decoration: none;
		border-bottom: 1px solid currentColor;
		font-size: 0.8rem;
	}
	.entity-link:hover { opacity: 0.75; }

	.entity-nolink {
		color: var(--c-secondary);
		font-size: 0.8rem;
	}

	.place-row {
		color: var(--c-secondary);
		font-size: 0.8rem;
		text-transform: capitalize;
	}

	.panel-id {
		font-family: var(--f-mono);
		font-size: 0.67rem;
		color: var(--c-secondary);
		margin: 0.75rem 0 0;
		padding-top: 0.5rem;
		border-top: 1px solid var(--c-line);
	}
</style>
