<script>
	import { onMount, onDestroy } from 'svelte';

	let { imageUrl = '', iiifUrl = '', title = '' } = $props();

	let container;
	let viewer = null;

	onMount(async () => {
		const src = iiifUrl || imageUrl;
		if (!src || !container) return;

		const OSD = (await import('openseadragon')).default;

		const tileSource = iiifUrl
			? iiifUrl
			: { type: 'image', url: imageUrl };

		viewer = OSD({
			element: container,
			tileSources: tileSource,
			showNavigationControl: true,
			showFullPageControl: false,
			showHomeControl: true,
			showZoomControl: true,
			navigationControlAnchor: OSD.ControlAnchor.BOTTOM_RIGHT,
			animationTime: 0.5,
			blendTime: 0.1,
			constrainDuringPan: false,
			maxZoomPixelRatio: 6,
			minZoomImageRatio: 0.3,
			visibilityRatio: 0.5,
			gestureSettingsMouse: { clickToZoom: false },
			gestureSettingsTouch: { clickToZoom: false },
		});
	});

	onDestroy(() => {
		viewer?.destroy();
		viewer = null;
	});
</script>

<div
	class="osd-container"
	bind:this={container}
	role="img"
	aria-label={title}
></div>

<style>
	.osd-container {
		width: 100%;
		height: 620px;
		max-height: 72vh;
		min-height: 420px;
		border: 1px solid var(--c-line);
		background: var(--c-surface, #f5f1ec);
		border-radius: var(--radius, 4px);
		overflow: hidden;
	}

	/* OSD injects its own toolbar buttons — keep them readable */
	:global(.openseadragon-container) {
		background: var(--c-surface, #f5f1ec) !important;
	}
</style>
