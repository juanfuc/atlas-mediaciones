<script>
	import { demoOnly } from '$lib/stores/demo.js';
</script>

<button
	class="demo-toggle"
	class:active={$demoOnly}
	onclick={() => demoOnly.update((v) => !v)}
	aria-pressed={$demoOnly}
>
	{$demoOnly ? 'Solo demo' : 'Corpus completo'}
</button>

<style>
	.demo-toggle {
		font-family: var(--f-sans);
		font-size: 0.8125rem;
		padding: 0.3rem 0.75rem;
		border: 1px solid var(--c-line);
		border-radius: var(--radius);
		background: transparent;
		color: var(--c-secondary);
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
		white-space: nowrap;
	}

	.demo-toggle:hover {
		border-color: var(--c-accent);
		color: var(--c-text);
	}

	.demo-toggle.active {
		border-color: var(--c-accent);
		color: var(--c-accent);
	}
</style>
