import type { PageServerLoad } from './$types';
import { leseProjekt, leseBuchungen, leseLieferanten } from '$lib/dataStore';

export const load: PageServerLoad = ({ url }) => {
	const projekt = leseProjekt();
	let buchungen = leseBuchungen();

	// Filters
	const gewerk = url.searchParams.get('gewerk');
	const raum = url.searchParams.get('raum');
	const geschoss = url.searchParams.get('geschoss'); // alle Buchungen eines Stockwerks
	const kategorie = url.searchParams.get('kategorie');
	const suche = url.searchParams.get('suche')?.trim() || null;
	const monat = url.searchParams.get('monat'); // "YYYY-MM" vom Verlauf-Link
	const herkunft = url.searchParams.get('herkunft'); // 'direkt' | 'rechnung' | null
	const lieferantFilter = url.searchParams.get('lieferant'); // Lieferant-ID
	const lieferungFilter = url.searchParams.get('lieferung'); // Lieferung-ID

	if (gewerk) buchungen = buchungen.filter((b) => b.gewerk === gewerk);
	if (raum) buchungen = buchungen.filter((b) => b.raum === raum);
	if (geschoss) {
		buchungen = buchungen.filter(
			(b) =>
				b.raum === `@${geschoss}` ||
				(b.raum !== null &&
					!b.raum.startsWith('@') &&
					projekt.raeume.find((r) => r.id === b.raum)?.geschoss === geschoss)
		);
	}
	if (kategorie) buchungen = buchungen.filter((b) => b.kategorie === kategorie);
	if (monat) buchungen = buchungen.filter((b) => b.datum.startsWith(monat));
	if (herkunft === 'direkt') buchungen = buchungen.filter((b) => !b.rechnungId);
	if (herkunft === 'rechnung') buchungen = buchungen.filter((b) => !!b.rechnungId);
	if (herkunft === 'lieferung') buchungen = buchungen.filter((b) => !!b.lieferungId);
	if (lieferungFilter) {
		buchungen = buchungen.filter((b) => b.lieferungId === lieferungFilter);
	} else if (lieferantFilter) {
		// Alle Lieferungs-IDs des Lieferanten ermitteln
		const { lieferungen } = leseLieferanten();
		const ids = new Set(lieferungen.filter((lu) => lu.lieferantId === lieferantFilter).map((lu) => lu.id));
		buchungen = buchungen.filter((b) => b.lieferungId && ids.has(b.lieferungId));
	}
	if (suche) {
		const q = suche.toLowerCase();
		buchungen = buchungen.filter(
			(b) =>
				b.beschreibung.toLowerCase().includes(q) ||
				(b.rechnungsreferenz ?? '').toLowerCase().includes(q)
		);
	}

	// Sort by date descending
	buchungen.sort((a, b) => b.datum.localeCompare(a.datum) || b.erstellt.localeCompare(a.erstellt));

	const { lieferanten, lieferungen } = leseLieferanten();

	return {
		buchungen,
		gewerke: projekt.gewerke,
		raeume: projekt.raeume,
		lieferanten,
		lieferungen,
		filter: { gewerk, raum, geschoss, kategorie, suche, herkunft, lieferant: lieferantFilter, lieferung: lieferungFilter }
	};
};
