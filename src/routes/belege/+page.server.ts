import type { PageServerLoad } from './$types';
import { leseProjekt, leseBuchungen } from '$lib/dataStore';

export const load: PageServerLoad = ({ url }) => {
	const projekt = leseProjekt();
	const buchungen = leseBuchungen();

	const gewerk = url.searchParams.get('gewerk');

	let mitBelegen = buchungen.filter((b) => b.belege.length > 0);
	if (gewerk) mitBelegen = mitBelegen.filter((b) => b.gewerk === gewerk);

	mitBelegen.sort((a, b) => b.datum.localeCompare(a.datum) || b.erstellt.localeCompare(a.erstellt));

	const eintraege = mitBelegen.map((b) => ({
		buchungId: b.id,
		datum: b.datum,
		beschreibung: b.beschreibung,
		gewerk: b.gewerk,
		gewerkName: projekt.gewerke.find((g) => g.id === b.gewerk)?.name ?? b.gewerk,
		betrag: b.betrag,
		belege: b.belege
	}));

	return {
		eintraege,
		gewerke: projekt.gewerke,
		filter: { gewerk }
	};
};
