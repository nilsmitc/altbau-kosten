import type { Actions, PageServerLoad } from './$types';
import { leseProjekt, leseBuchungen, schreibeBuchungen, speicherBeleg } from '$lib/dataStore';
import { createBuchung, validateBuchung, KATEGORIEN, type Kategorie } from '$lib/domain';
import { parseCentsFromInput } from '$lib/format';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = () => {
	const projekt = leseProjekt();
	return {
		gewerke: projekt.gewerke,
		raeume: projekt.raeume,
		kategorien: KATEGORIEN
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
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

		const buchung = createBuchung(data);

		// Belege verarbeiten
		const ERLAUBTE_TYPEN = ['application/pdf', 'image/jpeg', 'image/png'];
		const MAX_GROESSE = 10 * 1024 * 1024; // 10 MB
		const dateien = form.getAll('belege') as File[];
		for (const datei of dateien) {
			if (datei.size === 0 || !datei.name) continue;
			if (datei.size > MAX_GROESSE) {
				return fail(400, { error: `Datei "${datei.name}" ist zu groß (max. 10 MB)`, values: data });
			}
			if (!ERLAUBTE_TYPEN.includes(datei.type)) {
				return fail(400, { error: `Datei "${datei.name}" hat einen nicht erlaubten Typ (nur PDF, JPG, PNG)`, values: data });
			}
			const buffer = Buffer.from(await datei.arrayBuffer());
			const name = speicherBeleg(buchung.id, datei.name, buffer);
			buchung.belege.push(name);
		}

		const buchungen = leseBuchungen();
		buchungen.push(buchung);
		schreibeBuchungen(buchungen);

		throw redirect(303, '/buchungen');
	}
};
