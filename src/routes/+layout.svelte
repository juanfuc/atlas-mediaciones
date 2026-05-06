<script>
	import '$lib/styles/tokens.css';
	import { base } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const navLinks = [
		{ href: `${base}/repositorio`, label: 'Repositorio' },
		{ href: `${base}/grafo`,       label: 'Grafo' },
		{ href: `${base}/mapa`,        label: 'Mapa' },
		{ href: `${base}/linea-tiempo`, label: 'Línea de tiempo' }
	];
</script>

<svelte:head>
	<title>Atlas de mediaciones</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<div id="app">
	<header>
		<div class="nav-inner">
			<a class="site-title" href="{base}/">Atlas de mediaciones</a>
			<nav aria-label="Navegación principal">
				<ul class="nav-links">
					{#each navLinks as link}
						<li><a href={link.href}>{link.label}</a></li>
					{/each}
				</ul>
			</nav>
		</div>
	</header>

	<main>
		{@render children()}
	</main>

	<footer>
		<p>Atlas de mediaciones · Plataforma mínima de investigación</p>
	</footer>
</div>

<style>
	#app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	header {
		border-top: 2px solid var(--c-accent);
		border-bottom: 1px solid var(--c-line);
		background: var(--c-bg);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.nav-inner {
		max-width: var(--max-w);
		margin: 0 auto;
		padding: 0.8rem 1.5rem;
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.5rem 2rem;
	}

	.site-title {
		font-family: var(--f-serif);
		font-size: 0.95rem;
		color: var(--c-text);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.site-title:hover {
		color: var(--c-accent);
		text-decoration: none;
	}

	.nav-links {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1.5rem;
		margin-left: auto;
	}

	.nav-links a {
		font-size: 0.875rem;
		color: var(--c-secondary);
		letter-spacing: 0.01em;
	}

	.nav-links a:hover {
		color: var(--c-text);
		text-decoration: none;
	}

	main {
		flex: 1;
	}

	footer {
		border-top: 1px solid var(--c-line);
		padding: 1.25rem 1.5rem;
		font-size: 0.8125rem;
		color: var(--c-secondary);
		text-align: center;
	}
</style>
