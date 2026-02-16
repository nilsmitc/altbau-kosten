import type { PageServerLoad } from './$types';
import { leseProjekt, leseBuchungen } from '$lib/dataStore';

export const load: PageServerLoad = ({ url }) => {
	const projekt = leseProjekt();
	let buchungen = leseBuchungen();

	// Filters
	const gewerk = url.searchParams.get('gewerk');
	const raum = url.searchParams.get('raum');
	const kategorie = url.searchParams.get('kategorie');
	const suche = url.searchParams.get('suche')?.trim() || null;
	const monat = url.searchParams.get('monat'); // "YYYY-MM" vom Verlauf-Link

	if (gewerk) buchungen = buchungen.filter((b) => b.gewerk === gewerk);
	if (raum) buchungen = buchungen.filter((b) => b.raum === raum);
	if (kategorie) buchungen = buchungen.filter((b) => b.kategorie === kategorie);
	if (monat) buchungen = buchungen.filter((b) => b.datum.startsWith(monat));
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

	return {
		buchungen,
		gewerke: projekt.gewerke,
		raeume: projekt.raeume,
		filter: { gewerk, raum, kategorie, suche }
	};
};
