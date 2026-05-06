import { base } from '$app/paths';

export async function load({ fetch }) {
	try {
		const res = await fetch(`${base}/data/manifest.json`);
		if (res.ok) return { manifest: await res.json() };
	} catch {
		// manifest not available at build time
	}
	return { manifest: null };
}
