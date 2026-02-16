import type { Actions, PageServerLoad } from './$types';
import { leseProjekt, schreibeProjekt, leseBuchungen } from '$lib/dataStore';
import { berechneGewerkSummaries } from '$lib/domain';
import { parseCentsFromInput } from '$lib/format';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = () => {
	const projekt = leseProjekt();
	const buchungen = leseBuchungen();
	const summaries = berechneGewerkSummaries(buchungen, projekt.gewerke, projekt.budgets);

	const gesamtBudget = projekt.budgets.reduce((s, b) => s + b.geplant, 0);
	const gesamtIst = buchungen.reduce((s, b) => s + b.betrag, 0);
	const notizen = Object.fromEntries(projekt.budgets.map((b) => [b.gewerk, b.notiz]));

	return { summaries, gesamtBudget, gesamtIst, notizen };
};

export const actions: Actions = {
	update: async ({ request }) => {
		const form = await request.formData();
		const gewerk = form.get('gewerk') as string;
		const geplant = parseCentsFromInput(form.get('geplant') as string);
		const notiz = (form.get('notiz') as string)?.trim() || '';

		if (!gewerk) return fail(400, { error: 'Gewerk fehlt' });
		if (isNaN(geplant) || geplant < 0) return fail(400, { error: 'Budget muss >= 0 sein' });

		const projekt = leseProjekt();
		if (!projekt.gewerke.find((g) => g.id === gewerk))
			return fail(400, { error: 'Unbekanntes Gewerk' });

		const budget = projekt.budgets.find((b) => b.gewerk === gewerk);
		if (budget) {
			budget.geplant = geplant;
			budget.notiz = notiz;
		} else {
			projekt.budgets.push({ gewerk, geplant, notiz });
		}
		schreibeProjekt(projekt);
		return { success: true };
	}
};
