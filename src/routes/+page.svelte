<script>
	import { base } from '$app/paths';

	let { data } = $props();

	const views = [
		{
			href: `${base}/repositorio`,
			title: 'Repositorio',
			desc: 'Tarjetas de fuentes con filtros por tipo, cadena y confianza.'
		},
		{
			href: `${base}/grafo`,
			title: 'Grafo',
			desc: 'Red de relaciones entre entidades, predicados y grados de evidencia.'
		},
		{
			href: `${base}/mapa`,
			title: 'Mapa',
			desc: 'Geografías de mediación superpuestas por rol de lugar.'
		},
		{
			href: `${base}/linea-tiempo`,
			title: 'Línea de tiempo',
			desc: 'Capas históricas del corpus desde el siglo XIX hasta la digitalización.'
		}
	];

	const confidence = [
		{
			id: 'documentada',
			label: 'Documentada',
			desc: 'Sustentada explícitamente por fuente, catálogo, signatura o referencia localizable.'
		},
		{
			id: 'inferida',
			label: 'Inferida',
			desc: 'Sustentada por comparación, contexto editorial, atribución historiográfica o encadenamiento razonado.'
		},
		{
			id: 'hipotetica',
			label: 'Hipotética',
			desc: 'Propuesta como hipótesis interpretativa; debe leerse como discutible.'
		}
	];
</script>

<div class="container">

	<!-- ── Hero ──────────────────────────────────────────────── -->
	<section class="hero">
		<h1>Atlas de mediaciones</h1>
		<p class="subtitle">Corpus Roulin: imágenes, mediaciones y circulación visual</p>
		<p class="intro">
			Este prototipo modela un corpus acotado de fuentes históricas como una red de mediaciones.
			No busca reunir objetos aislados, sino registrar las relaciones entre imágenes, textos,
			agentes, lugares, instituciones e instrumentos, distinguiendo grados de evidencia, roles
			geográficos y capas de reorientación histórica.
		</p>
	</section>

	<!-- ── Vistas ────────────────────────────────────────────── -->
	<section class="views" aria-label="Vistas del atlas">
		{#each views as view}
			<a href={view.href} class="view-card">
				<h2>{view.title}</h2>
				<p>{view.desc}</p>
			</a>
		{/each}
	</section>

	<!-- ── Panel inferior ────────────────────────────────────── -->
	<div class="panels">

		<!-- Clave de lectura -->
		<aside class="panel" aria-label="Clave de lectura">
			<h3 class="panel-title">Clave de lectura</h3>
			<dl class="confidence-list">
				{#each confidence as c}
					<div class="confidence-item confidence-{c.id}">
						<dt>{c.label}</dt>
						<dd>{c.desc}</dd>
					</div>
				{/each}
			</dl>
		</aside>

		<!-- Estado del corpus -->
		{#if data.manifest}
			<aside class="panel" aria-label="Estado del corpus">
				<h3 class="panel-title">Estado del corpus</h3>
				<dl class="counts">
					<div><dt>Entidades</dt><dd>{data.manifest.counts.entities}</dd></div>
					<div><dt>Demo</dt><dd>{data.manifest.counts.entities_demo}</dd></div>
					<div><dt>Relaciones</dt><dd>{data.manifest.counts.relations}</dd></div>
					<div><dt>Relaciones demo</dt><dd>{data.manifest.counts.relations_demo}</dd></div>
					<div><dt>Lugares</dt><dd>{data.manifest.counts.geojson_features}</dd></div>
					<div><dt>Eventos</dt><dd>{data.manifest.counts.events}</dd></div>
					{#if data.manifest.warnings.length > 0}
						<div class="count-warnings">
							<dt>Advertencias</dt>
							<dd>{data.manifest.warnings.length}</dd>
						</div>
					{/if}
				</dl>
				<p class="generated-at">
					Generado: {new Date(data.manifest.generated_at).toLocaleDateString('es', {
						day: 'numeric', month: 'long', year: 'numeric'
					})}
				</p>
			</aside>
		{/if}
	</div>

</div>

<style>
	.container {
		max-width: var(--max-w);
		margin: 0 auto;
		padding: var(--sp-xl) var(--sp-lg);
	}

	/* ── Hero ── */
	.hero {
		margin-bottom: var(--sp-xl);
		padding-bottom: var(--sp-xl);
		border-bottom: 1px solid var(--c-line);
		max-width: 760px;
	}

	.hero h1 {
		font-size: clamp(1.75rem, 3vw, 2.5rem);
		color: var(--c-text);
		margin-bottom: 0.4rem;
	}

	.subtitle {
		font-family: var(--f-serif);
		font-size: 1.05rem;
		color: var(--c-secondary);
		margin-bottom: var(--sp-lg);
		font-style: italic;
	}

	.intro {
		font-size: 0.95rem;
		color: var(--c-secondary);
		max-width: 680px;
		line-height: 1.7;
	}

	/* ── Vistas ── */
	.views {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: var(--sp-md);
		margin-bottom: var(--sp-xl);
	}

	.view-card {
		display: block;
		border: 1px solid var(--c-line);
		border-radius: var(--radius);
		padding: var(--sp-lg);
		color: var(--c-text);
		transition: border-color 0.15s;
	}

	.view-card:hover {
		border-color: var(--c-accent);
		text-decoration: none;
	}

	.view-card h2 {
		font-family: var(--f-serif);
		font-size: 1.1rem;
		margin-bottom: 0.4rem;
		color: var(--c-text);
	}

	.view-card p {
		font-size: 0.875rem;
		color: var(--c-secondary);
		margin: 0;
		line-height: 1.5;
	}

	/* ── Paneles ── */
	.panels {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--sp-md);
		padding-top: var(--sp-xl);
		border-top: 1px solid var(--c-line);
	}

	.panel {
		background: var(--c-surface);
		border: 1px solid var(--c-line);
		border-radius: var(--radius);
		padding: var(--sp-lg);
	}

	.panel-title {
		font-family: var(--f-sans);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--c-secondary);
		margin-bottom: var(--sp-md);
	}

	/* ── Clave de lectura ── */
	.confidence-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.confidence-item dt {
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.15rem;
	}

	.confidence-item dd {
		font-size: 0.8125rem;
		color: var(--c-secondary);
		line-height: 1.5;
	}

	.confidence-documentada dt { color: var(--c-text); }
	.confidence-inferida    dt { color: var(--c-secondary); }
	.confidence-hipotetica  dt {
		color: var(--c-secondary);
		font-style: italic;
	}

	/* ── Estado del corpus ── */
	.counts {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.4rem 1rem;
		margin-bottom: var(--sp-md);
	}

	.counts > div {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.5rem;
	}

	.counts dt {
		font-size: 0.8125rem;
		color: var(--c-secondary);
	}

	.counts dd {
		font-family: var(--f-mono);
		font-size: 0.875rem;
		color: var(--c-text);
	}

	.count-warnings dd {
		color: var(--c-accent);
	}

	.generated-at {
		font-size: 0.75rem;
		color: var(--c-secondary);
		margin: 0;
	}
</style>
