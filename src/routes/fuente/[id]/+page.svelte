<script>
	import { base } from '$app/paths';
	import ConfidenceBadge from '$lib/components/ConfidenceBadge.svelte';
	import ImageViewer from '$lib/components/ImageViewer.svelte';

	let { data } = $props();

	const entityIdSet = $derived(new Set(data.entityIds));

	let imgError = $state(false);
	let viewerOpen = $state(false);

	const hasViewer = $derived(
		!!(data.entity.image_url || data.entity.iiif_url)
	);
	const imageFullUrl = $derived(
		data.entity.iiif_url
			? data.entity.iiif_url
			: data.entity.image_url
				? `${base}${data.entity.image_url}`
				: ''
	);

	function formatDate(start, end) {
		const fmt = (v) => {
			if (!v) return null;
			const n = parseFloat(v);
			return isNaN(n) ? String(v) : String(Math.round(n));
		};
		const s = fmt(start);
		const e = fmt(end);
		if (!s && !e) return null;
		if (s && e && s !== e) return `${s} – ${e}`;
		return s || e;
	}

	const date = $derived(formatDate(data.entity.date_start, data.entity.date_end));

	const creator = $derived(
		data.entity.creator_display ||
			(data.entity.agent_ids?.length ? data.entity.agent_ids.join('; ') : null)
	);
</script>

<svelte:head>
	<title>{data.entity.label} · Atlas de mediaciones</title>
</svelte:head>

<div class="container">

	<!-- ── Breadcrumb ─────────────────────────────────────────── -->
	<nav class="breadcrumb" aria-label="Ruta de navegación">
		<a href="{base}/repositorio/">← Repositorio</a>
	</nav>

	<!-- ── Cabecera ──────────────────────────────────────────── -->
	<header class="entity-header">
		<div class="entity-thumb">
			{#if data.entity.image_url && !imgError}
				{#if hasViewer}
					<button
						class="thumb-btn"
						onclick={() => { viewerOpen = true; }}
						aria-label="Ampliar imagen: {data.entity.label}"
					>
						<img
							src="{base}{data.entity.image_url}"
							alt={data.entity.label}
							loading="eager"
							onerror={() => { imgError = true; }}
						/>
						<span class="thumb-hint">Clic para ampliar</span>
					</button>
				{:else}
					<img
						src="{base}{data.entity.image_url}"
						alt={data.entity.label}
						loading="eager"
						onerror={() => { imgError = true; }}
					/>
				{/if}
			{:else}
				<div class="placeholder" aria-hidden="true"></div>
			{/if}
		</div>

		<div class="entity-meta">
			<h1>{data.entity.label}</h1>

			<div class="badges">
				{#if data.entity.type}
					<span class="badge badge-type">{data.entity.type}</span>
				{/if}
				{#if data.entity.subtype}
					<span class="badge badge-subtype">{data.entity.subtype}</span>
				{/if}
				{#if data.entity.chain}
					<span class="badge badge-chain">{data.entity.chain}</span>
				{/if}
				{#if data.entity.include_demo}
					<span class="badge badge-demo">demo</span>
				{/if}
			</div>

			<dl class="meta-grid">
				{#if date}
					<div><dt>Fecha</dt><dd>{date}</dd></div>
				{/if}
				{#if creator}
					<div><dt>Autor</dt><dd>{creator}</dd></div>
				{/if}
				{#if data.entity.institution_id}
					<div><dt>Institución</dt><dd>{data.entity.institution_id}</dd></div>
				{/if}
				{#if data.entity.signature}
					<div><dt>Signatura</dt><dd class="mono">{data.entity.signature}</dd></div>
				{/if}
				{#if data.entity.model_cluster}
					<div><dt>Clúster</dt><dd>{data.entity.model_cluster}</dd></div>
				{/if}
				{#if data.entity.needs_review}
					<div><dt>Estado</dt><dd class="review-flag">Requiere revisión</dd></div>
				{/if}
			</dl>
		</div>
	</header>

	<!-- ── Visor de imagen ──────────────────────────────────── -->
	{#if hasViewer && viewerOpen}
		<section class="section viewer-section">
			<div class="viewer-bar">
				<button class="viewer-close" onclick={() => { viewerOpen = false; }}>
					Cerrar visor ✕
				</button>
				<a
					href={imageFullUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="viewer-new-tab"
				>
					Abrir imagen en pestaña nueva ↗
				</a>
			</div>
			<ImageViewer
				imageUrl={data.entity.iiif_url ? '' : imageFullUrl}
				iiifUrl={data.entity.iiif_url || ''}
				title={data.entity.label}
			/>
		</section>
	{/if}

	<!-- ── Descripción ───────────────────────────────────────── -->
	{#if data.entity.description}
		<section class="section">
			<h2 class="section-title">Descripción</h2>
			<p class="description">{data.entity.description}</p>
		</section>
	{/if}

	<!-- ── Referencia ────────────────────────────────────────── -->
	{#if data.entity.source_reference}
		<section class="section">
			<h2 class="section-title">Referencia de fuente</h2>
			<p class="reference">{data.entity.source_reference}</p>
		</section>
	{/if}

	<!-- ── Fuente y acceso ───────────────────────────────────── -->
	{#if data.entity.source_url}
		<section class="section">
			<h2 class="section-title">Fuente y acceso</h2>
			<a
				href={data.entity.source_url}
				target="_blank"
				rel="noreferrer"
				class="source-url-link"
			>Repositorio de custodia ↗</a>
		</section>
	{/if}

	<!-- ── Relaciones salientes ──────────────────────────────── -->
	{#if data.outgoing.length > 0}
		<section class="section">
			<h2 class="section-title">
				Relaciones salientes <span class="count">({data.outgoing.length})</span>
			</h2>
			<ul class="relations-list">
				{#each data.outgoing as rel (rel.id)}
					<li class="relation-item">
						<div class="relation-main">
							<ConfidenceBadge conf={rel.confidence} />
							<span class="rel-predicate">{rel.predicate_label}</span>
							<span class="rel-arrow">→</span>
							{#if entityIdSet.has(rel.object_id)}
								<a href="{base}/fuente/{rel.object_id}/" class="rel-entity-link">
									{rel.object_label ?? rel.object_id}
								</a>
							{:else}
								<span class="rel-entity">{rel.object_label ?? rel.object_id}</span>
							{/if}
						</div>
						{#if rel.asserted_by || rel.assertion_basis}
							<p class="rel-evidence">
								{#if rel.asserted_by}<span>{rel.asserted_by}</span>{/if}
								{#if rel.asserted_by && rel.assertion_basis} · {/if}
								{#if rel.assertion_basis}<span>{rel.assertion_basis}</span>{/if}
							</p>
						{/if}
						{#if rel.evidence_source}
							<p class="rel-source">
								{rel.evidence_source}{rel.page_or_folio ? `, ${rel.page_or_folio}` : ''}
							</p>
						{/if}
						{#if rel.note}
							<p class="rel-note">{rel.note}</p>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- ── Relaciones entrantes ──────────────────────────────── -->
	{#if data.incoming.length > 0}
		<section class="section">
			<h2 class="section-title">
				Relaciones entrantes <span class="count">({data.incoming.length})</span>
			</h2>
			<ul class="relations-list">
				{#each data.incoming as rel (rel.id)}
					<li class="relation-item">
						<div class="relation-main">
							{#if entityIdSet.has(rel.subject_id)}
								<a href="{base}/fuente/{rel.subject_id}/" class="rel-entity-link">
									{rel.subject_label ?? rel.subject_id}
								</a>
							{:else}
								<span class="rel-entity">{rel.subject_label ?? rel.subject_id}</span>
							{/if}
							<span class="rel-arrow">→</span>
							<span class="rel-predicate">{rel.predicate_label}</span>
							<ConfidenceBadge conf={rel.confidence} />
						</div>
						{#if rel.asserted_by || rel.assertion_basis}
							<p class="rel-evidence">
								{#if rel.asserted_by}<span>{rel.asserted_by}</span>{/if}
								{#if rel.asserted_by && rel.assertion_basis} · {/if}
								{#if rel.assertion_basis}<span>{rel.assertion_basis}</span>{/if}
							</p>
						{/if}
						{#if rel.evidence_source}
							<p class="rel-source">
								{rel.evidence_source}{rel.page_or_folio ? `, ${rel.page_or_folio}` : ''}
							</p>
						{/if}
						{#if rel.note}
							<p class="rel-note">{rel.note}</p>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- ── Eventos ───────────────────────────────────────────── -->
	{#if data.events.length > 0}
		<section class="section">
			<h2 class="section-title">
				Eventos asociados <span class="count">({data.events.length})</span>
			</h2>
			<ul class="events-list">
				{#each data.events as ev (ev.id)}
					<li class="event-item">
						<div class="event-header">
							<span class="event-date">
								{formatDate(ev.date_start, ev.date_end) ?? '—'}
							</span>
							<span class="event-layer">{ev.layer}</span>
						</div>
						<p class="event-label">{ev.label}</p>
						{#if ev.description}
							<p class="event-desc">{ev.description}</p>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- ── Lugares ───────────────────────────────────────────── -->
	{#if data.places.length > 0}
		<section class="section">
			<h2 class="section-title">
				Lugares asociados <span class="count">({data.places.length})</span>
			</h2>
			<ul class="places-list">
				{#each data.places as feat (feat.properties.id)}
					<li class="place-item">
						<span class="place-label">{feat.properties.label}</span>
						{#if feat.properties.place_roles.length > 0}
							<span class="place-roles">
								{feat.properties.place_roles.join(' · ')}
							</span>
						{/if}
						<span class="place-coords">
							{feat.geometry.coordinates[1].toFixed(4)},
							{feat.geometry.coordinates[0].toFixed(4)}
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

</div>

<style>
	.container {
		max-width: var(--max-w);
		margin: 0 auto;
		padding: var(--sp-xl) var(--sp-lg);
	}

	/* ── Breadcrumb ── */
	.breadcrumb {
		margin-bottom: var(--sp-lg);
		font-size: 0.875rem;
	}

	.breadcrumb a {
		color: var(--c-secondary);
	}

	.breadcrumb a:hover {
		color: var(--c-accent);
	}

	/* ── Cabecera ── */
	.entity-header {
		display: grid;
		grid-template-columns: 140px 1fr;
		gap: var(--sp-xl);
		margin-bottom: var(--sp-xl);
		padding-bottom: var(--sp-xl);
		border-bottom: 1px solid var(--c-line);
	}

	@media (max-width: 640px) {
		.entity-header {
			grid-template-columns: 1fr;
		}
	}

	.entity-thumb {
		width: 140px;
		height: 140px;
		border-radius: var(--radius);
		overflow: hidden;
		flex-shrink: 0;
	}

	.entity-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.placeholder {
		width: 100%;
		height: 100%;
		background: var(--c-surface);
		border: 1px solid var(--c-line);
		border-radius: var(--radius);
	}

	.entity-meta h1 {
		font-size: clamp(1.1rem, 2.5vw, 1.6rem);
		margin-bottom: var(--sp-sm);
		line-height: 1.3;
	}

	/* ── Badges ── */
	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-bottom: var(--sp-md);
	}

	.badge {
		font-size: 0.7rem;
		padding: 0.15rem 0.4rem;
		border-radius: 2px;
	}

	.badge-type {
		background: var(--c-surface);
		border: 1px solid var(--c-line);
		color: var(--c-secondary);
	}

	.badge-subtype {
		background: transparent;
		border: 1px solid var(--c-line);
		color: var(--c-secondary);
	}

	.badge-chain {
		background: transparent;
		border: 1px dashed var(--c-line);
		color: var(--c-secondary);
		font-style: italic;
	}

	.badge-demo {
		background: var(--c-accent);
		color: #fff;
		font-weight: 600;
	}

	/* ── Meta grid ── */
	.meta-grid {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.meta-grid > div {
		display: flex;
		gap: var(--sp-sm);
		font-size: 0.8125rem;
		line-height: 1.4;
	}

	.meta-grid dt {
		color: var(--c-secondary);
		flex-shrink: 0;
		min-width: 5.5rem;
	}

	.meta-grid dd {
		color: var(--c-text);
	}

	.mono {
		font-family: var(--f-mono);
		font-size: 0.75rem;
	}

	.review-flag {
		color: var(--c-accent);
		font-style: italic;
	}

	/* ── Sections ── */
	.section {
		margin-bottom: var(--sp-xl);
		padding-top: var(--sp-xl);
		border-top: 1px solid var(--c-line);
	}

	.section-title {
		font-family: var(--f-sans);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--c-secondary);
		margin-bottom: var(--sp-md);
	}

	.count {
		font-weight: normal;
	}

	.description,
	.reference {
		font-size: 0.9rem;
		line-height: 1.75;
		color: var(--c-text);
		max-width: 740px;
	}

	.reference {
		font-style: italic;
		color: var(--c-secondary);
	}

	.source-url-link {
		font-size: 0.875rem;
		color: var(--c-secondary);
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition: color 0.15s, border-color 0.15s;
	}

	.source-url-link:hover {
		color: var(--c-accent);
		border-color: currentColor;
	}

	/* ── Relations ── */
	.relations-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--sp-sm);
	}

	.relation-item {
		background: var(--c-surface);
		border: 1px solid var(--c-line);
		border-radius: var(--radius);
		padding: var(--sp-sm) var(--sp-md);
	}

	.relation-main {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.3rem var(--sp-sm);
		margin-bottom: 0.2rem;
	}

	.rel-predicate {
		font-size: 0.8125rem;
		color: var(--c-secondary);
		font-style: italic;
	}

	.rel-arrow {
		font-size: 0.75rem;
		color: var(--c-secondary);
	}

	.rel-entity {
		font-size: 0.875rem;
		color: var(--c-text);
	}

	.rel-entity-link {
		font-size: 0.875rem;
		color: var(--c-accent);
	}

	.rel-entity-link:hover {
		text-decoration: underline;
	}

	.rel-evidence,
	.rel-source,
	.rel-note {
		font-size: 0.75rem;
		color: var(--c-secondary);
		margin: 0.15rem 0 0;
		line-height: 1.45;
	}

	.rel-note {
		color: var(--c-text);
		font-style: italic;
	}

	/* ── Events ── */
	.events-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--sp-sm);
	}

	.event-item {
		border-left: 2px solid var(--c-line);
		padding-left: var(--sp-md);
	}

	.event-header {
		display: flex;
		gap: var(--sp-md);
		margin-bottom: 0.2rem;
	}

	.event-date {
		font-family: var(--f-mono);
		font-size: 0.8rem;
		color: var(--c-secondary);
		white-space: nowrap;
	}

	.event-layer {
		font-size: 0.75rem;
		color: var(--c-secondary);
		font-style: italic;
	}

	.event-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--c-text);
		margin: 0;
	}

	.event-desc {
		font-size: 0.8125rem;
		color: var(--c-secondary);
		margin: 0.25rem 0 0;
		line-height: 1.5;
		max-width: 640px;
	}

	/* ── Places ── */
	.places-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--sp-sm);
	}

	.place-item {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--sp-sm) var(--sp-md);
		font-size: 0.875rem;
	}

	.place-label {
		font-weight: 600;
		color: var(--c-text);
	}

	.place-roles {
		color: var(--c-secondary);
		font-style: italic;
		font-size: 0.8125rem;
	}

	.place-coords {
		font-family: var(--f-mono);
		font-size: 0.75rem;
		color: var(--c-secondary);
	}

	/* ── Thumb interactivo ── */
	.thumb-btn {
		all: unset;
		display: block;
		width: 100%;
		height: 100%;
		cursor: zoom-in;
		position: relative;
	}

	.thumb-btn img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.thumb-hint {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: rgba(26, 24, 20, 0.62);
		color: #f5f1ec;
		font-size: 0.65rem;
		text-align: center;
		padding: 3px 4px;
		letter-spacing: 0.03em;
		opacity: 0;
		transition: opacity 0.18s;
	}

	.thumb-btn:hover .thumb-hint,
	.thumb-btn:focus-visible .thumb-hint {
		opacity: 1;
	}

	/* ── Sección del visor ── */
	.viewer-section {
		padding-bottom: 0;
	}

	.viewer-bar {
		display: flex;
		align-items: center;
		gap: var(--sp-md, 0.75rem);
		margin-bottom: var(--sp-sm, 0.5rem);
		flex-wrap: wrap;
	}

	.viewer-close {
		all: unset;
		cursor: pointer;
		font-size: 0.8rem;
		color: var(--c-secondary);
		border: 1px solid var(--c-line);
		border-radius: var(--radius, 4px);
		padding: 0.25rem 0.6rem;
		background: var(--c-surface);
		transition: color 0.15s, border-color 0.15s;
	}

	.viewer-close:hover {
		color: var(--c-text);
		border-color: var(--c-secondary);
	}

	.viewer-new-tab {
		font-size: 0.8rem;
		color: var(--c-secondary);
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition: color 0.15s, border-color 0.15s;
	}

	.viewer-new-tab:hover {
		color: var(--c-accent);
		border-color: currentColor;
	}
</style>
