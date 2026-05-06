<script>
	let { conf } = $props();

	const labels = { documentada: 'doc.', inferida: 'inf.', hipotetica: 'hip.' };
</script>

<span class="badge confidence-{conf}" title={conf}>
	{labels[conf] ?? conf}
</span>

<style>
	.badge {
		font-size: 0.7rem;
		font-family: var(--f-sans);
		padding: 0.1rem 0.35rem;
		border-radius: 2px;
		white-space: nowrap;
		border: 1px solid transparent;
	}

	.confidence-documentada {
		border-color: var(--c-line);
		color: var(--c-secondary);
	}

	.confidence-inferida {
		border-color: var(--c-secondary);
		color: var(--c-secondary);
		border-style: dashed;
	}

	.confidence-hipotetica {
		border-color: var(--c-secondary);
		color: var(--c-secondary);
		border-style: dotted;
		font-style: italic;
	}
</style>
