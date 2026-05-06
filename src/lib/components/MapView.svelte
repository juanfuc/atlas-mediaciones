<script>
	import { onMount, onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import { demoOnly } from '$lib/stores/demo.js';
	import 'leaflet/dist/leaflet.css';

	let { features, entityMap } = $props();

	// DOM ref — Leaflet attaches its map here
	let mapContainer;

	// Leaflet instances (plain vars — not $state — Leaflet owns the DOM)
	let L = null;
	let map = null;
	let markersLayer = null;

	// Reactive state
	let ready = $state(false);
	let selRole = $state('');
	let visiblePlaces = $state(0);
	let visibleAssoc = $state(0);

	// Roles actually present in the data, normalized to canonical values
	const allRoles = $derived(
		[...new Set(features.flatMap((f) => (f.properties.place_roles ?? []).map(normalizeRole)))].sort()
	);

	// Normalize legacy hybrid role to canonical represented_place
	function normalizeRole(r) {
		return r === 'represented_or_discussed_place' ? 'represented_place' : r;
	}

	// Sobrio, warm-academic palette — one colour per role
	const ROLE_COLOR = {
		represented_place:  '#C9A07A',
		custody_place:      '#8CAAA8',
		publication_place:  '#9DA88C',
		production_place:   '#B4A0B0',
		observation_place:  '#A8B0C4',
		circulation_place:  '#BCA882',
		digitization_place: '#B0ACAC',
		comparison_place:   '#C8B4A0',
		provenance_place:   '#C4B49A'
	};

	const ROLE_LABELS = {
		represented_place:  'Lugar representado',
		publication_place:  'Publicación',
		custody_place:      'Custodia',
		digitization_place: 'Digitalización',
		provenance_place:   'Procedencia',
		comparison_place:   'Comparación',
		circulation_place:  'Circulación',
		observation_place:  'Observación',
		production_place:   'Producción'
	};

	function roleColor(roles) {
		for (const r of roles.map(normalizeRole)) {
			if (ROLE_COLOR[r]) return ROLE_COLOR[r];
		}
		return '#9E9890';
	}

	function roleName(r) {
		return ROLE_LABELS[normalizeRole(r)] ?? r.replace(/_/g, ' ');
	}

	// ── Marker update ────────────────────────────────────────────────────────────

	function updateMarkers() {
		if (!L || !map || !markersLayer) return;

		markersLayer.clearLayers();

		const demo = $demoOnly;
		const bounds = [];

		const filtered = features.filter((f) => {
			const coords = f.geometry?.coordinates;
			if (!Array.isArray(coords) || coords.length < 2) return false;
			const [lng, lat] = coords;
			if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat))
				return false;
			if (demo && !f.properties.include_demo) return false;
			if (selRole && !(f.properties.place_roles ?? []).map(normalizeRole).includes(selRole)) return false;
			return true;
		});

		let totalAssoc = 0;

		filtered.forEach((f) => {
			const { label, place_roles = [], entities = [], chains = [] } = f.properties;
			const [lng, lat] = f.geometry.coordinates;

			// In demo mode, show only entities flagged include_demo
			const visEntities = demo
				? entities.filter((eid) => entityMap[eid]?.include_demo === true)
				: [...entities];

			totalAssoc += visEntities.length;

			const color = roleColor(place_roles);

			const marker = L.circleMarker([lat, lng], {
				radius: 9,
				fillColor: color,
				color: '#5A4A38',
				weight: 1.5,
				fillOpacity: 0.82
			});

			// Popup uses inline styles — Leaflet renders outside Svelte's scoped CSS
			const rolesHtml = place_roles
				.map(
					(r) =>
						`<span style="display:inline-block;padding:1px 7px;margin:2px 2px 0 0;border-radius:3px;` +
						`background:#f0ebe3;font-size:0.71rem;border:1px solid #d8cfc2;color:#5A4A38;">${roleName(r)}</span>`
				)
				.join('');

			const chainsHtml = chains.length
				? `<div style="font-size:0.74rem;color:#7A6E64;margin-top:5px;">${chains.join(' · ')}</div>`
				: '';

			const entitiesHtml = visEntities.length
				? `<div style="margin-top:7px;border-top:1px solid #e0d8cc;padding-top:6px;">` +
					visEntities
						.map((eid) => {
							const ent = entityMap[eid];
							const lbl = ent?.label ?? eid;
							return (
								`<div style="margin:2px 0;">` +
								`<a href="${base}/fuente/${eid}/" ` +
								`style="color:#8C3B22;font-size:0.79rem;text-decoration:none;border-bottom:1px solid currentColor;">${lbl}</a>` +
								`</div>`
							);
						})
						.join('') +
					`</div>`
				: '';

			const popupHtml =
				`<div style="font-family:system-ui,sans-serif;max-width:260px;line-height:1.4;">` +
				`<strong style="font-size:0.9rem;display:block;margin-bottom:5px;">${label}</strong>` +
				`<div>${rolesHtml}</div>` +
				chainsHtml +
				entitiesHtml +
				`</div>`;

			marker.bindPopup(popupHtml, { maxWidth: 280, className: 'atlas-popup' });
			bounds.push([lat, lng]);
			marker.addTo(markersLayer);
		});

		visiblePlaces = filtered.length;
		visibleAssoc = totalAssoc;

		if (bounds.length > 0) {
			try {
				map.fitBounds(bounds, { padding: [48, 48], maxZoom: 10 });
			} catch (_) {}
		}
	}

	// ── Reactivity ────────────────────────────────────────────────────────────────

	$effect(() => {
		if (!ready) return;
		void $demoOnly;
		void selRole;
		updateMarkers();
	});

	// ── Lifecycle ─────────────────────────────────────────────────────────────────

	onMount(async () => {
		const mod = await import('leaflet');
		L = mod.default ?? mod;

		map = L.map(mapContainer, {
			center: [10, -30],
			zoom: 3,
			zoomControl: true
		});

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 18
		}).addTo(map);

		markersLayer = L.layerGroup().addTo(map);

		ready = true;
	});

	onDestroy(() => {
		map?.remove();
		map = null;
	});
</script>

<div class="map-wrap">

	<!-- Controls -->
	<div class="controls">
		<label>
			<span>Rol de lugar</span>
			<select bind:value={selRole}>
				<option value="">Todos los roles</option>
				{#each allRoles as r}
					<option value={r}>{roleName(r)}</option>
				{/each}
			</select>
		</label>

		<span class="counter">
			{#if ready}
				lugares visibles: {visiblePlaces} · asociaciones visibles: {visibleAssoc}
			{/if}
		</span>
	</div>

	<!-- Map container — Leaflet mounts inside this div -->
	<div class="map-container" bind:this={mapContainer}>
		{#if !ready}
			<p class="map-loading">Cargando mapa…</p>
		{/if}
	</div>

	<!-- Note -->
	<p class="map-note">
		El mapa muestra geografías de mediación: representación, producción, publicación, custodia y
		circulación. No representa un itinerario lineal.
	</p>

	<!-- Role legend -->
	<div class="legend">
		<strong>Roles:</strong>
		{#each allRoles as r}
			<span class="leg-role">
				<span class="leg-dot" style="background:{roleColor([r])};"></span>
				{roleName(r)}
			</span>
		{/each}
	</div>

</div>

<style>
	.map-wrap {
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
		min-width: 210px;
	}

	.counter {
		margin-left: auto;
		align-self: flex-end;
		font-size: 0.8rem;
		color: var(--c-secondary);
		white-space: nowrap;
		padding-bottom: 0.3rem;
	}

	/* Map container — Leaflet needs explicit height */
	.map-container {
		height: 620px;
		min-height: 480px;
		border: 1px solid var(--c-line);
		border-radius: var(--radius);
		background: var(--c-surface);
		position: relative;
		overflow: hidden;
	}

	.map-loading {
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

	/* Descriptive note */
	.map-note {
		font-size: 0.78rem;
		color: var(--c-secondary);
		font-style: italic;
		background: var(--c-surface);
		border: 1px solid var(--c-line);
		border-radius: var(--radius);
		padding: 0.35rem 0.75rem;
	}

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

	.leg-role {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}

	.leg-dot {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 1px solid rgba(90, 74, 56, 0.3);
		flex-shrink: 0;
	}

	/* Override Leaflet defaults to match site palette */
	:global(.atlas-popup .leaflet-popup-content-wrapper) {
		border-radius: 4px;
		border: 1px solid var(--c-line, #d8cfc2);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
	}

	:global(.leaflet-control-attribution) {
		font-size: 0.68rem;
	}
</style>
