import type { Actions, PageServerLoad } from './$types';
import { leseProjekt, schreibeProjekt } from '$lib/dataStore';
import { type PlanungStatus } from '$lib/domain';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = () => {
	const projekt = leseProjekt();
	return {
		gewerke: projekt.gewerke,
		planung: projekt.planung
	};
};

export const actions: Actions = {
	update: async ({ request }) => {
		const form = await request.formData();
		const gewerk = form.get('gewerk') as string;
		const start = (form.get('start') as string) || '';
		const ende = (form.get('ende') as string) || '';
		const status = (form.get('status') as PlanungStatus) || 'geplant';
		const nachGewerk = form.getAll('nachGewerk') as string[];

		if (!gewerk) return fail(400, { error: 'Gewerk fehlt' });

		const validStatus: PlanungStatus[] = ['geplant', 'aktiv', 'fertig'];
		if (!validStatus.includes(status)) return fail(400, { error: 'Ungültiger Status' });

		if (start && ende && start > ende) {
			return fail(400, { error: 'Startdatum muss vor dem Enddatum liegen' });
		}

		const projekt = leseProjekt();
		if (!projekt.gewerke.find((g) => g.id === gewerk)) {
			return fail(400, { error: 'Unbekanntes Gewerk' });
		}

		const idx = projekt.planung.findIndex((p) => p.gewerk === gewerk);
		const eintrag = { gewerk, start, ende, status, nachGewerk };
		if (idx >= 0) {
			projekt.planung[idx] = eintrag;
		} else {
			projekt.planung.push(eintrag);
		}
		schreibeProjekt(projekt);
		return { success: true };
	},

	remove: async ({ request }) => {
		const form = await request.formData();
		const gewerk = form.get('gewerk') as string;

		const projekt = leseProjekt();
		projekt.planung = projekt.planung.filter((p) => p.gewerk !== gewerk);
		schreibeProjekt(projekt);
		return { success: true };
	}
};
