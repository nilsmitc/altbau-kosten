import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { extrahierePdfDaten } from '$lib/pdfExtract';

const MAX_GROESSE = 10 * 1024 * 1024; // 10 MB

export const POST: RequestHandler = async ({ request }) => {
	const form = await request.formData();
	const datei = form.get('datei') as File | null;

	if (!datei || datei.size === 0) {
		throw error(400, 'Keine Datei angegeben');
	}
	if (datei.type !== 'application/pdf') {
		throw error(400, 'Nur PDF-Dateien werden unterstützt');
	}
	if (datei.size > MAX_GROESSE) {
		throw error(400, 'Datei zu groß (max. 10 MB)');
	}

	const buffer = Buffer.from(await datei.arrayBuffer());
	const ergebnis = await extrahierePdfDaten(buffer);

	if (ergebnis.fehler === 'scan') {
		return json(ergebnis, { status: 422 });
	}
	if (ergebnis.fehler) {
		return json(ergebnis, { status: 422 });
	}

	return json(ergebnis);
};
