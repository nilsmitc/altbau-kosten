import type { PageServerLoad } from './$types';
import { leseProjekt, leseBuchungen } from '$lib/dataStore';
import { berechneDashboard } from '$lib/domain';

export const load: PageServerLoad = () => {
	const projekt = leseProjekt();
	const buchungen = leseBuchungen();
	const dashboard = berechneDashboard(buchungen, projekt);

	const anzahlMonate = new Set(buchungen.map((b) => b.datum.slice(0, 7))).size;
	const avgProMonat = anzahlMonate > 0 ? Math.round(dashboard.gesamtIst / anzahlMonate) : 0;

	return { ...dashboard, avgProMonat, anzahlMonate };
};
