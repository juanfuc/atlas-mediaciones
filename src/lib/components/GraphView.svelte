<script>
	import { onMount, onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import { demoOnly } from '$lib/stores/demo.js';

	let { nodes, edges, relationMap } = $props();

	// D3-owned refs — plain vars, NOT $state (avoids Svelte proxy on D3 internals)
	let container;
	let d3 = null;
	let svgEl = null;   // d3 selection of the <svg>
	let gRoot = null;   // d3 selection of the root <g> (zoom target)
	let zoomBeh = null; // d3.zoom instance
	let sim = null;     // d3.forceSimulation instance

	let ready = $state(false);
	let notice = $state('');
	let visibleCount = $state({ nodes: 0, edges: 0 });
	let selected = $state(null);

	// Filters
	let selChain = $state('');
	let selPredicate = $state('');
	let selConfidence = $state('');
	let selNodeType = $state('');

	// Derived filter option lists (full dataset, never filtered)
	const entityIdSet = $derived(new Set(nodes.filter((n) => n.source === 'entity').map((n) => n.id)));
	const uniqueChains = $derived([...new Set(edges.map((e) => e.chain).filter(Boolean))].sort());
	const uniquePredicates = $derived([...new Set(edges.map((e) => e.predicate))].sort());
	const predicateLabels = $derived(Object.fromEntries(edges.map((e) => [e.predicate, e.label])));
	const uniqueNodeTypes = $derived([...new Set(nodes.map((n) => n.type).filter(Boolean))].sort());

	// ── Visual constants ─────────────────────────────────────────────────────────

	const NODE_COLORS = {
		entity:      { fill: '#D4C5B2', stroke: '#8C3B22' },
		agent:       { fill: '#B8CECA', stroke: '#4E7A74' },
		place:       { fill: '#C4BCCE', stroke: '#6A5E80' },
		institution: { fill: '#CACAB0', stroke: '#72724A' },
		unknown:     { fill: '#D8CFC2', stroke: '#9E9890' }
	};

	// Labels always visible above this degree; others appear only on hover
	const LABEL_MIN_DEGREE = 4;

	// ── Graph filtering ───────────────────────────────────────────────────────────

	function computeGraph() {
		const demo = $demoOnly;
		let fe = [...edges];
		let noticeText = '';

		if (demo) fe = fe.filter((e) => e.include_demo);
		if (selChain) fe = fe.filter((e) => e.chain === selChain);
		if (selPredicate) fe = fe.filter((e) => e.predicate === selPredicate);
		if (selConfidence) fe = fe.filter((e) => e.confidence === selConfidence);

		const connIds = new Set();
		fe.forEach((e) => { connIds.add(e.from); connIds.add(e.to); });
		let fn = nodes.filter((n) => connIds.has(n.id));

		if (selNodeType) {
			fn = fn.filter((n) => n.type === selNodeType);
			const nids = new Set(fn.map((n) => n.id));
			fe = fe.filter((e) => nids.has(e.from) && nids.has(e.to));
		}

		return { filteredNodes: fn, filteredEdges: fe, noticeText };
	}

	// Radius proportional to degree
	function nodeRadius(deg) {
		return Math.pow(deg, 0.6) + 5;
	}

	// ── Force-directed rendering ──────────────────────────────────────────────────

	function drawGraph() {
		if (!d3 || !gRoot) return;

		// Stop and discard old simulation before rebuilding
		sim?.stop();
		sim = null;

		const { filteredNodes, filteredEdges, noticeText } = computeGraph();
		notice = noticeText;
		visibleCount = { nodes: filteredNodes.length, edges: filteredEdges.length };
		selected = null;

		gRoot.selectAll('*').remove();

		const W = container.clientWidth || 900;
		const H = container.clientHeight || 720;

		// Re-center view on every redraw so the graph starts visible
		svgEl.call(zoomBeh.transform, d3.zoomIdentity.translate(W / 2, H / 2));

		if (filteredNodes.length === 0) return;

		// ── Degree computation (in + out) ──
		const degree = Object.fromEntries(filteredNodes.map((n) => [n.id, 0]));
		filteredEdges.forEach((e) => {
			degree[e.from] = (degree[e.from] ?? 0) + 1;
			degree[e.to]   = (degree[e.to]   ?? 0) + 1;
		});

		// Simulation data — deep-copy so D3 can mutate x/y/vx/vy freely
		const simNodes = filteredNodes.map((n) => ({ ...n }));
		const simLinks = filteredEdges.map((e) => ({
			...e,
			source: e.from,
			target: e.to
		}));

		// Adaptive force parameters by graph size
		const chargeStr = filteredNodes.length > 60 ? -300 : -220;
		const linkDist  = filteredNodes.length > 60 ? 95    : 78;

		// Draw order: links below nodes below labels
		const linkG  = gRoot.append('g').attr('class', 'links');
		const nodeG  = gRoot.append('g').attr('class', 'nodes');
		const labelG = gRoot.append('g').attr('class', 'labels');

		// ── Links ──
		const linkSel = linkG.selectAll('line')
			.data(simLinks)
			.join('line')
			.attr('stroke', (d) =>
				d.confidence === 'documentada' ? '#8C3B22'
				: d.confidence === 'inferida'  ? '#6B6661'
				: '#8A8480'
			)
			.attr('stroke-width', (d) => d.confidence === 'documentada' ? 1.5 : 1)
			.attr('stroke-dasharray', (d) =>
				d.confidence === 'inferida'    ? '6,4'
				: d.confidence === 'hipotetica' ? '3,4'
				: null
			)
			.attr('stroke-opacity', (d) => d.confidence === 'hipotetica' ? 0.35 : 0.55)
			.style('cursor', 'pointer')
			.on('click', function (event, d) {
				event.stopPropagation();
				const rel = relationMap[d.id];
				selected = rel ? { kind: 'edge', data: rel } : null;
			});

		// ── Nodes ──
		const nodeSel = nodeG.selectAll('circle')
			.data(simNodes)
			.join('circle')
			.attr('r', (d) => nodeRadius(degree[d.id] ?? 0))
			.attr('fill', (d) => (NODE_COLORS[d.source] ?? NODE_COLORS.unknown).fill)
			.attr('stroke', (d) => (NODE_COLORS[d.source] ?? NODE_COLORS.unknown).stroke)
			.attr('stroke-width', 1.5)
			.style('cursor', 'pointer')
			.attr('title', (d) => entityIdSet.has(d.id) ? 'Ctrl+clic para abrir ficha' : null)
			.on('mouseover', function (event, d) {
				// Compute neighbor set from simLinks (after forceLink, source/target are objects)
				const neighbors = new Set();
				simLinks.forEach((l) => {
					const sId = typeof l.source === 'object' ? l.source.id : l.source;
					const tId = typeof l.target === 'object' ? l.target.id : l.target;
					if (sId === d.id) neighbors.add(tId);
					if (tId === d.id) neighbors.add(sId);
				});

				nodeSel.attr('opacity', (n) => n.id === d.id || neighbors.has(n.id) ? 1 : 0.1);
				linkSel.attr('stroke-opacity', (l) => {
					const sId = typeof l.source === 'object' ? l.source.id : l.source;
					const tId = typeof l.target === 'object' ? l.target.id : l.target;
					return sId === d.id || tId === d.id
						? (l.confidence === 'hipotetica' ? 0.65 : 0.9)
						: 0.04;
				});
				// Show labels for hovered node and its neighbors; hide others
				labelSel.attr('opacity', (n) => n.id === d.id || neighbors.has(n.id) ? 1 : 0);
			})
			.on('mouseout', function () {
				nodeSel.attr('opacity', 1);
				linkSel.attr('stroke-opacity', (d) => d.confidence === 'hipotetica' ? 0.35 : 0.55);
				labelSel.attr('opacity', (n) => (degree[n.id] ?? 0) >= LABEL_MIN_DEGREE ? 1 : 0);
			})
			.on('click', function (event, d) {
				event.stopPropagation();
				// Ctrl/Cmd + click navigates to entity page
				if ((event.ctrlKey || event.metaKey) && entityIdSet.has(d.id)) {
					window.location.href = `${base}/fuente/${d.id}/`;
					return;
				}
				selected = { kind: 'node', data: d };
			});

		// ── Labels (only for high-degree nodes by default) ──
		const labelSel = labelG.selectAll('text')
			.data(simNodes)
			.join('text')
			.attr('text-anchor', 'middle')
			.attr('font-size', (d) => (degree[d.id] ?? 0) >= 10 ? '10px' : '8px')
			.attr('font-family', 'system-ui, sans-serif')
			.attr('fill', '#1A1814')
			.attr('pointer-events', 'none')
			.attr('opacity', (d) => (degree[d.id] ?? 0) >= LABEL_MIN_DEGREE ? 1 : 0)
			.text((d) => d.label.length > 24 ? d.label.slice(0, 23) + '…' : d.label);

		// ── Force simulation ──
		sim = d3.forceSimulation(simNodes)
			.force('link',    d3.forceLink(simLinks).id((d) => d.id).distance(linkDist).strength(0.6))
			.force('charge',  d3.forceManyBody().strength(chargeStr))
			.force('center',  d3.forceCenter(0, 0))
			.force('collide', d3.forceCollide((d) => nodeRadius(degree[d.id] ?? 0) + 5))
			.on('tick', () => {
				linkSel
					.attr('x1', (d) => d.source.x)
					.attr('y1', (d) => d.source.y)
					.attr('x2', (d) => d.target.x)
					.attr('y2', (d) => d.target.y);
				nodeSel
					.attr('cx', (d) => d.x)
					.attr('cy', (d) => d.y);
				labelSel
					.attr('x', (d) => d.x)
					.attr('y', (d) => d.y - nodeRadius(degree[d.id] ?? 0) - 4);
			});

		// ── Drag — pins node while dragging, releases on mouseup ──
		nodeSel.call(
			d3.drag()
				.on('start', (event, d) => {
					if (!event.active) sim.alphaTarget(0.3).restart();
					d.fx = d.x;
					d.fy = d.y;
				})
				.on('drag', (event, d) => {
					d.fx = event.x;
					d.fy = event.y;
				})
				.on('end', (event, d) => {
					if (!event.active) sim.alphaTarget(0);
					// Keep node pinned where user left it (d.fx/fy remain set)
				})
		);
	}

	// ── Reactivity ────────────────────────────────────────────────────────────────

	$effect(() => {
		if (!ready) return;
		void $demoOnly;
		void selChain;
		void selPredicate;
		void selConfidence;
		void selNodeType;
		drawGraph();
	});

	// ── Lifecycle ─────────────────────────────────────────────────────────────────

	onMount(async () => {
		d3 = await import('d3');

		const svg = d3.select(container).append('svg')
			.attr('width', '100%')
			.attr('height', '100%');
		svgEl = svg;

		gRoot = svg.append('g');

		zoomBeh = d3.zoom()
			.scaleExtent([0.05, 8])
			.on('zoom', (event) => gRoot.attr('transform', event.transform));
		svg.call(zoomBeh);

		svg.on('click', () => { selected = null; });

		ready = true;
	});

	onDestroy(() => {
		sim?.stop();
	});

	function closePanel() {
		selected = null;
	}
</script>

<div class="graph-wrap">

	<!-- Controls -->
	<div class="controls">
		<label>
			<span>Cadena</span>
			<select bind:value={selChain}>
				<option value="">Todas</option>
				{#each uniqueChains as c}
					<option value={c}>{c}</option>
				{/each}
			</select>
		</label>
		<label>
			<span>Relación</span>
			<select bind:value={selPredicate}>
				<option value="">Todas</option>
				{#each uniquePredicates as p}
					<option value={p}>{predicateLabels[p] ?? p}</option>
				{/each}
			</select>
		</label>
		<label>
			<span>Certeza</span>
			<select bind:value={selConfidence}>
				<option value="">Todas</option>
				<option value="documentada">documentada</option>
				<option value="inferida">inferida</option>
				<option value="hipotetica">hipotética</option>
			</select>
		</label>
		<label>
			<span>Tipo de nodo</span>
			<select bind:value={selNodeType}>
				<option value="">Todos</option>
				{#each uniqueNodeTypes as t}
					<option value={t}>{t}</option>
				{/each}
			</select>
		</label>

		<span class="counter">
			{#if ready}
				nodos visibles: {visibleCount.nodes} · relaciones visibles: {visibleCount.edges}
			{/if}
		</span>
	</div>

	{#if notice}
		<p class="notice">{notice}</p>
	{/if}

	<!-- Graph canvas + panel -->
	<div class="main">
		<div class="canvas" bind:this={container}>
			{#if !ready}
				<p class="loading">Cargando grafo…</p>
			{:else if visibleCount.nodes === 0}
				<p class="loading">No hay datos visibles con los filtros seleccionados.</p>
			{/if}
			{#if ready && visibleCount.nodes > 0}
				<p class="hint">Ctrl+clic en un nodo de entidad para abrir su ficha.</p>
			{/if}
		</div>

		{#if selected}
			<aside class="panel">
				<button class="close" onclick={closePanel} aria-label="Cerrar panel">✕</button>

				{#if selected.kind === 'node'}
					{@const n = selected.data}
					<h3 class="panel-title">{n.label}</h3>
					<dl>
						{#if n.type}<dt>Tipo</dt><dd>{n.type}</dd>{/if}
						{#if n.subtype}<dt>Subtipo</dt><dd>{n.subtype}</dd>{/if}
						{#if n.chain}<dt>Cadena</dt><dd>{n.chain}</dd>{/if}
						<dt>Clase</dt><dd>{n.source}</dd>
						<dt>Demo</dt><dd>{n.include_demo ? 'sí' : 'no'}</dd>
						<dt>ID</dt><dd class="mono">{n.id}</dd>
					</dl>
					{#if entityIdSet.has(n.id)}
						<a href="{base}/fuente/{n.id}/" class="panel-link">Ver ficha →</a>
					{/if}
				{:else}
					{@const r = selected.data}
					<div class="triple">
						<span class="subject">{r.subject_label}</span>
						<span class="predicate">{r.predicate_label}</span>
						<span class="object">{r.object_label}</span>
					</div>
					<dl>
						<dt>Certeza</dt>
						<dd class="conf conf-{r.confidence}">{r.confidence}</dd>
						{#if r.asserted_by}<dt>Asertado por</dt><dd>{r.asserted_by}</dd>{/if}
						{#if r.assertion_basis}<dt>Base</dt><dd>{r.assertion_basis}</dd>{/if}
						{#if r.evidence_source}<dt>Fuente</dt><dd>{r.evidence_source}</dd>{/if}
						{#if r.page_or_folio}<dt>Folio</dt><dd>{r.page_or_folio}</dd>{/if}
						{#if r.note}<dt>Nota</dt><dd>{r.note}</dd>{/if}
						{#if r.chain}<dt>Cadena</dt><dd>{r.chain}</dd>{/if}
						<dt>ID</dt><dd class="mono">{r.id}</dd>
					</dl>
				{/if}
			</aside>
		{/if}
	</div>

	<!-- Legend -->
	<div class="legend">
		<strong>Nodos:</strong>
		<span class="leg-node entity">entidad</span>
		<span class="leg-node agent">agente</span>
		<span class="leg-node place">lugar</span>
		<span class="leg-node institution">institución</span>
		<span class="sep">·</span>
		<strong>Relaciones:</strong>
		<span class="leg-edge doc">documentada</span>
		<span class="leg-edge inf">inferida</span>
		<span class="leg-edge hip">hipotética</span>
		<span class="sep">·</span>
		<span class="leg-note">Tamaño proporcional al número de relaciones</span>
	</div>

</div>

<style>
	.graph-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	/* Controls */
	.controls {
		display: flex;
		gap: 0.75rem 1.25rem;
		flex-wrap: wrap;
		align-items: flex-end;
	}

	.controls label {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.controls label span {
		font-size: 0.72rem;
		color: var(--c-secondary);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.controls select {
		font-size: 0.85rem;
		padding: 0.28rem 0.5rem;
		border: 1px solid var(--c-line);
		background: var(--c-bg);
		color: var(--c-text);
		border-radius: var(--radius);
		min-width: 130px;
	}

	.counter {
		margin-left: auto;
		align-self: flex-end;
		font-size: 0.8rem;
		color: var(--c-secondary);
		white-space: nowrap;
		padding-bottom: 0.3rem;
	}

	/* Notice */
	.notice {
		font-size: 0.78rem;
		color: var(--c-secondary);
		font-style: italic;
		background: var(--c-surface);
		border: 1px solid var(--c-line);
		border-radius: var(--radius);
		padding: 0.35rem 0.75rem;
	}

	/* Main area */
	.main {
		display: flex;
		gap: 0.75rem;
	}

	/* Canvas — D3 appends the <svg> here */
	.canvas {
		flex: 1;
		height: 720px;
		min-height: 560px;
		border: 1px solid var(--c-line);
		border-radius: var(--radius);
		background: var(--c-surface);
		position: relative;
		overflow: hidden;
	}

	.loading {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--c-secondary);
		font-style: italic;
		font-size: 0.9rem;
		pointer-events: none;
	}

	.hint {
		position: absolute;
		bottom: 0.5rem;
		left: 50%;
		transform: translateX(-50%);
		font-size: 0.72rem;
		color: var(--c-secondary);
		pointer-events: none;
		white-space: nowrap;
		opacity: 0.7;
	}

	/* Side panel */
	.panel {
		width: 272px;
		flex-shrink: 0;
		height: 720px;
		min-height: 560px;
		border: 1px solid var(--c-line);
		border-radius: var(--radius);
		background: var(--c-bg);
		padding: 1rem;
		overflow-y: auto;
		position: relative;
	}

	.panel-title {
		font-size: 0.92rem;
		line-height: 1.4;
		margin-bottom: 0.75rem;
		padding-right: 1.5rem;
	}

	.triple {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		margin-bottom: 0.75rem;
		padding-right: 1.5rem;
	}

	.triple .subject,
	.triple .object {
		font-family: var(--f-serif);
		font-size: 0.9rem;
	}

	.triple .predicate {
		font-size: 0.78rem;
		color: var(--c-secondary);
		font-style: italic;
		padding-left: 0.75rem;
	}

	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.2rem 0.65rem;
		font-size: 0.8rem;
	}

	dt {
		color: var(--c-secondary);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding-top: 0.15rem;
		white-space: nowrap;
	}

	dd {
		color: var(--c-text);
		word-break: break-word;
	}

	.mono {
		font-family: var(--f-mono);
		font-size: 0.72rem;
		color: var(--c-secondary);
	}

	.conf-documentada { color: var(--c-accent); font-weight: 500; }
	.conf-inferida    { color: var(--c-secondary); }
	.conf-hipotetica  { color: var(--c-secondary); font-style: italic; }

	.panel-link {
		display: inline-block;
		margin-top: 0.85rem;
		font-size: 0.82rem;
		color: var(--c-accent);
		text-decoration: none;
		border-bottom: 1px solid currentColor;
	}
	.panel-link:hover { opacity: 0.75; }

	.close {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--c-secondary);
		font-size: 0.8rem;
		line-height: 1;
		padding: 0.25rem;
	}
	.close:hover { color: var(--c-text); }

	/* Legend */
	.legend {
		display: flex;
		gap: 0.5rem 1rem;
		flex-wrap: wrap;
		align-items: center;
		font-size: 0.76rem;
		color: var(--c-secondary);
	}

	.legend strong {
		font-weight: 500;
		color: var(--c-text);
		font-size: 0.76rem;
	}

	.sep { color: var(--c-line); }

	.leg-note {
		font-style: italic;
		font-size: 0.72rem;
	}

	.leg-node {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}
	.leg-node::before {
		content: '';
		display: inline-block;
		width: 11px;
		height: 11px;
		border-radius: 50%;
		border: 1.5px solid;
	}
	.leg-node.entity::before      { background: #D4C5B2; border-color: #8C3B22; }
	.leg-node.agent::before       { background: #B8CECA; border-color: #4E7A74; }
	.leg-node.place::before       { background: #C4BCCE; border-color: #6A5E80; }
	.leg-node.institution::before { background: #CACAB0; border-color: #72724A; }

	.leg-edge {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}
	.leg-edge::before {
		content: '';
		display: inline-block;
		width: 24px;
		height: 2px;
	}
	.leg-edge.doc::before { background: #8C3B22; }
	.leg-edge.inf::before {
		background: repeating-linear-gradient(
			to right,
			#6B6661 0 6px,
			transparent 6px 10px
		);
	}
	.leg-edge.hip::before {
		background: repeating-linear-gradient(
			to right,
			#8A8480 0 3px,
			transparent 3px 7px
		);
		opacity: 0.7;
	}
</style>
