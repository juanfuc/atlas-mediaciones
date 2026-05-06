/**
 * Devuelve solo los ítems con include_demo === true cuando demoOnly es verdadero.
 * Los items pueden ser entidades, relaciones, nodos, aristas o eventos.
 */
export function applyDemo(items, demoOnly) {
	if (!demoOnly) return items;
	return items.filter((item) => item.include_demo === true);
}

/**
 * Filtra por cadena de mediación (campo `chain`).
 * Pasa null o '' para no filtrar.
 */
export function filterByChain(items, chain) {
	if (!chain) return items;
	return items.filter((item) => item.chain === chain);
}

/**
 * Filtra por tipo de entidad (campo `type`).
 * Pasa null o '' para no filtrar.
 */
export function filterByType(items, type) {
	if (!type) return items;
	return items.filter((item) => item.type === type);
}

/**
 * Filtra por grado de confianza (campo `confidence`).
 * Aplica a relaciones y aristas de grafo.
 * Pasa null o '' para no filtrar.
 */
export function filterByConfidence(items, confidence) {
	if (!confidence) return items;
	return items.filter((item) => item.confidence === confidence);
}

/**
 * Filtra por predicado (campo `predicate`).
 * Aplica a relaciones y aristas de grafo.
 * Pasa null o '' para no filtrar.
 */
export function filterByPredicate(items, predicate) {
	if (!predicate) return items;
	return items.filter((item) => item.predicate === predicate);
}

/**
 * Filtra por rol de lugar.
 * Acepta tanto registros de entity_places (campo `place_role`)
 * como features GeoJSON (campo `place_roles` como array).
 * Pasa null o '' para no filtrar.
 */
export function filterByRole(items, role) {
	if (!role) return items;
	return items.filter((item) => {
		if (Array.isArray(item.place_roles)) return item.place_roles.includes(role);
		return item.place_role === role;
	});
}
