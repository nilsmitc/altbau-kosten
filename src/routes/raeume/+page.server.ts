import type { Actions, PageServerLoad } from './$types';
import { leseProjekt, schreibeProjekt, leseBuchungen } from '$lib/dataStore';
import { slugify } from '$lib/domain';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = () => {
	const projekt = leseProjekt();
	return { raeume: projekt.raeume };
};

export const actions: Actions = {
	add: async ({ request }) => {
		const form = await request.formData();
		const name = (form.get('name') as string)?.trim();
		const geschoss = (form.get('geschoss') as string)?.trim();

		if (!name) return fail(400, { error: 'Name ist erforderlich' });
		if (!geschoss) return fail(400, { error: 'Geschoss ist erforderlich' });

		const projekt = leseProjekt();
		const id = slugify(`${name}-${geschoss}`);

		if (projekt.raeume.find((r) => r.id === id)) {
			return fail(400, { error: 'Raum existiert bereits' });
		}

		const sortierung = projekt.raeume.length;
		projekt.raeume.push({ id, name, geschoss, sortierung });
		schreibeProjekt(projekt);
		return { success: true };
	},

	update: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id') as string;
		const name = (form.get('name') as string)?.trim();
		const geschoss = (form.get('geschoss') as string)?.trim();

		if (!name || !geschoss) return fail(400, { error: 'Name und Geschoss sind erforderlich' });

		const projekt = leseProjekt();
		const raum = projekt.raeume.find((r) => r.id === id);
		if (!raum) return fail(404, { error: 'Raum nicht gefunden' });

		raum.name = name;
		raum.geschoss = geschoss;
		schreibeProjekt(projekt);
		return { success: true };
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id') as string;

		const buchungen = leseBuchungen();
		if (buchungen.some((b) => b.raum === id)) {
			return fail(400, { error: 'Raum hat noch Buchungen und kann nicht gelöscht werden' });
		}

		const projekt = leseProjekt();
		projekt.raeume = projekt.raeume.filter((r) => r.id !== id);
		schreibeProjekt(projekt);
		return { success: true };
	}
};
