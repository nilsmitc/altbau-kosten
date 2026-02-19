import type { PageServerLoad } from './$types';
import { leseProjekt, leseBuchungen, leseRechnungen } from '$lib/dataStore';
import { berechneDashboard, abschlagEffektivStatus } from '$lib/domain';

export const load: PageServerLoad = () => {
	const projekt = leseProjekt();
	const buchungen = leseBuchungen();
	const dashboard = berechneDashboard(buchungen, projekt);

	const anzahlMonate = new Set(buchungen.map((b) => b.datum.slice(0, 7))).size;
	const avgProMonat = anzahlMonate > 0 ? Math.round(dashboard.gesamtIst / anzahlMonate) : 0;

	// Offene / überfällige Abschläge für Dashboard-KPI
	const rechnungen = leseRechnungen();
	let offeneAbschlaegeAnzahl = 0;
	let offeneAbschlaegeBetrag = 0;
	let hatUeberfaellige = false;
	for (const r of rechnungen) {
		for (const a of r.abschlaege) {
			const s = abschlagEffektivStatus(a);
			if (s === 'offen' || s === 'ueberfaellig') {
				offeneAbschlaegeAnzahl++;
				offeneAbschlaegeBetrag += a.rechnungsbetrag;
				if (s === 'ueberfaellig') hatUeberfaellige = true;
			}
		}
	}

	return {
		...dashboard,
		avgProMonat,
		anzahlMonate,
		offeneAbschlaegeAnzahl,
		offeneAbschlaegeBetrag,
		hatUeberfaellige
	};
};
