<script>
	import { base } from '$app/paths';
	import ConfidenceBadge from './ConfidenceBadge.svelte';

	/** @type {{ entity: object, confidences: string[] }} */
	let { entity, confidences = [] } = $props();

	let imgError = $state(false);

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

	const date = $derived(formatDate(entity.date_start, entity.date_end));
	const creator = $derived(
		entity.creator_display || (entity.agent_ids?.length ? entity.agent_ids[0] : null)
	);
</script>

<a href="{base}/fuente/{entity.id}/" class="card">
	<div class="card-thumb">
		{#if entity.image_url && !imgError}
			<img
				src="{base}{entity.image_url}"
				alt={entity.label}
				loading="lazy"
				onerror={() => {
					imgError = true;
				}}
			/>
		{:else}
			<div class="placeholder" aria-hidden="true"></div>
		{/if}
	</div>

	<div class="card-body">
		<p class="card-title" title={entity.label}>{entity.label}</p>

		<div class="badges">
			{#if entity.type}
				<span class="badge badge-type">{entity.type}</span>
			{/if}
			{#if entity.subtype}
				<span class="badge badge-subtype">{entity.subtype}</span>
			{/if}
			{#if entity.include_demo}
				<span class="badge badge-demo">demo</span>
			{/if}
			{#each confidences as conf (conf)}
				<ConfidenceBadge {conf} />
			{/each}
		</div>

		<dl class="meta">
			{#if date}
				<div><dt>Fecha</dt><dd>{date}</dd></div>
			{/if}
			{#if creator}
				<div><dt>Autor</dt><dd>{creator}</dd></div>
			{/if}
			{#if entity.institution_id}
				<div><dt>Inst.</dt><dd>{entity.institution_id}</dd></div>
			{/if}
			{#if entity.chain}
				<div><dt>Cadena</dt><dd>{entity.chain}</dd></div>
			{/if}
			{#if entity.signature}
				<div><dt>Sign.</dt><dd class="mono">{entity.signature}</dd></div>
			{/if}
		</dl>
	</div>
</a>

<style>
	.card {
		display: flex;
		gap: var(--sp-md);
		border: 1px solid var(--c-line);
		border-radius: var(--radius);
		padding: var(--sp-md);
		color: var(--c-text);
		text-decoration: none;
		align-items: flex-start;
		transition: border-color 0.15s;
	}

	.card:hover {
		border-color: var(--c-accent);
	}

	/* ── Thumbnail ── */
	.card-thumb {
		flex-shrink: 0;
		width: 64px;
		height: 64px;
		border-radius: var(--radius);
		overflow: hidden;
	}

	.card-thumb img {
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

	/* ── Body ── */
	.card-body {
		flex: 1;
		min-width: 0;
	}

	.card-title {
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.35rem;
		line-height: 1.35;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* ── Badges ── */
	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem;
		margin-bottom: 0.4rem;
	}

	.badge {
		font-size: 0.7rem;
		padding: 0.1rem 0.35rem;
		border-radius: 2px;
		white-space: nowrap;
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

	.badge-demo {
		background: var(--c-accent);
		color: #fff;
		font-weight: 600;
	}

	/* ── Meta ── */
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.meta > div {
		display: flex;
		gap: 0.4rem;
		font-size: 0.75rem;
		line-height: 1.4;
	}

	.meta dt {
		color: var(--c-secondary);
		flex-shrink: 0;
		width: 2.8rem;
	}

	.meta dd {
		color: var(--c-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mono {
		font-family: var(--f-mono);
		font-size: 0.7rem;
	}
</style>
