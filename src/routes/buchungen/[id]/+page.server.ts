import type { Actions, PageServerLoad } from './$types';
import { leseProjekt, leseBuchungen, schreibeBuchungen, speicherBeleg, loescheBeleg, loescheBelegeOrdner } from '$lib/dataStore';
import { validateBuchung, KATEGORIEN, type Kategorie } from '$lib/domain';
import { parseCentsFromInput } from '$lib/format';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = ({ params }) => {
	const projekt = leseProjekt();
	const buchungen = leseBuchungen();
	const buchung = buchungen.find((b) => b.id === params.id);

	if (!buchung) throw error(404, 'Buchung nicht gefunden');

	return {
		buchung,
		gewerke: projekt.gewerke,
		raeume: projekt.raeume,
		kategorien: KATEGORIEN
	};
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const form = await request.formData();

		const betrag = parseCentsFromInput(form.get('betrag') as string);
		const data = {
			datum: form.get('datum') as string,
			betrag,
			gewerk: form.get('gewerk') as string,
			raum: (form.get('raum') as string) || null,
			kategorie: form.get('kategorie') as Kategorie,
			beschreibung: (form.get('beschreibung') as string)?.trim(),
			rechnungsreferenz: (form.get('rechnungsreferenz') as string)?.trim() || ''
		};

		const projekt = leseProjekt();
		const errors = validateBuchung(data, projekt.gewerke);
		if (errors.length > 0) {
			return fail(400, { error: errors.join(', '), values: data });
		}

		const buchungen = leseBuchungen();
		const idx = buchungen.findIndex((b) => b.id === params.id);
		if (idx === -1) return fail(404, { error: 'Buchung nicht gefunden' });

		// Neue Belege verarbeiten
		const neueBelege = [...buchungen[idx].belege];
		const dateien = form.getAll('belege') as File[];
		for (const datei of dateien) {
			if (datei.size > 0 && datei.name) {
				const buffer = Buffer.from(await datei.arrayBuffer());
				const name = speicherBeleg(params.id, datei.name, buffer);
				if (!neueBelege.includes(name)) {
					neueBelege.push(name);
				}
			}
		}

		buchungen[idx] = {
			...buchungen[idx],
			...data,
			belege: neueBelege,
			geaendert: new Date().toISOString()
		};
		schreibeBuchungen(buchungen);

		throw redirect(303, '/buchungen');
	},

	deleteBeleg: async ({ request, params }) => {
		const form = await request.formData();
		const dateiname = form.get('dateiname') as string;

		const buchungen = leseBuchungen();
		const idx = buchungen.findIndex((b) => b.id === params.id);
		if (idx === -1) return fail(404, { error: 'Buchung nicht gefunden' });

		loescheBeleg(params.id, dateiname);
		buchungen[idx].belege = buchungen[idx].belege.filter((b) => b !== dateiname);
		buchungen[idx].geaendert = new Date().toISOString();
		schreibeBuchungen(buchungen);
	},

	delete: async ({ params }) => {
		loescheBelegeOrdner(params.id);
		const buchungen = leseBuchungen();
		const filtered = buchungen.filter((b) => b.id !== params.id);
		schreibeBuchungen(filtered);
		throw redirect(303, '/buchungen');
	}
};
