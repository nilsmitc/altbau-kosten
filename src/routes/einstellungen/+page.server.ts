import type { Actions, PageServerLoad } from './$types';
import { unzipSync } from 'fflate';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { schreibeBuchungen, schreibeProjekt } from '$lib/dataStore';
import { fail, redirect } from '@sveltejs/kit';

const DATA_DIR = join(process.cwd(), 'data');
const MAX_GROESSE = 200 * 1024 * 1024; // 200 MB

export const load: PageServerLoad = () => ({});

export const actions: Actions = {
	import: async ({ request }) => {
		const form = await request.formData();
		const datei = form.get('backup') as File;

		if (!datei || datei.size === 0) {
			return fail(400, { error: 'Keine Datei gewählt' });
		}
		if (datei.size > MAX_GROESSE) {
			return fail(400, { error: 'Datei zu groß (max. 200 MB)' });
		}
		if (!datei.name.endsWith('.zip') && datei.type !== 'application/zip') {
			return fail(400, { error: 'Nur ZIP-Dateien erlaubt' });
		}

		let eintraege: ReturnType<typeof unzipSync>;
		try {
			eintraege = unzipSync(new Uint8Array(await datei.arrayBuffer()));
		} catch {
			return fail(400, { error: 'ZIP-Datei konnte nicht gelesen werden (beschädigt?)' });
		}

		// Pflichtdateien prüfen
		if (!eintraege['projekt.json']) {
			return fail(400, { error: 'Ungültiges Backup: projekt.json fehlt' });
		}
		if (!eintraege['buchungen.json']) {
			return fail(400, { error: 'Ungültiges Backup: buchungen.json fehlt' });
		}

		// JSON-Inhalt validieren
		const decoder = new TextDecoder();
		let projektJson: unknown;
		let buchungenJson: unknown;
		try {
			projektJson = JSON.parse(decoder.decode(eintraege['projekt.json']));
			buchungenJson = JSON.parse(decoder.decode(eintraege['buchungen.json']));
		} catch {
			return fail(400, { error: 'Beschädigte Daten in projekt.json oder buchungen.json' });
		}

		if (!projektJson || typeof projektJson !== 'object') {
			return fail(400, { error: 'projekt.json hat ungültiges Format' });
		}
		if (!Array.isArray(buchungenJson)) {
			return fail(400, { error: 'buchungen.json muss ein Array sein' });
		}

		// Alten Beleg-Ordner löschen
		const belegeDir = join(DATA_DIR, 'belege');
		if (existsSync(belegeDir)) {
			rmSync(belegeDir, { recursive: true });
		}

		// Belege aus ZIP extrahieren
		for (const [pfad, inhalt] of Object.entries(eintraege)) {
			if (!pfad.startsWith('belege/')) continue;
			// Pfad-Traversal-Schutz: nur erlaubte Zeichen
			if (/\.\./.test(pfad)) continue;
			const ziel = join(DATA_DIR, pfad);
			mkdirSync(dirname(ziel), { recursive: true });
			writeFileSync(ziel, inhalt);
		}

		// JSONs schreiben (triggert automatisch aktualisiereSummary())
		schreibeProjekt(projektJson as Parameters<typeof schreibeProjekt>[0]);
		schreibeBuchungen(buchungenJson as Parameters<typeof schreibeBuchungen>[0]);

		throw redirect(303, '/einstellungen?success=1');
	}
};
