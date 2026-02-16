import type { PageServerLoad } from './$types';
import { leseProjekt, leseBuchungen } from '$lib/dataStore';
import { berechneDashboard } from '$lib/domain';

export const load: PageServerLoad = () => {
	const projekt = leseProjekt();
	const buchungen = leseBuchungen();
	return berechneDashboard(buchungen, projekt);
};
