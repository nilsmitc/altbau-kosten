import type { RequestHandler } from './$types';
import { zipSync } from 'fflate';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'data');

export const GET: RequestHandler = () => {
	const files: Record<string, Uint8Array> = {};

	// JSON-Stammdateien
	files['projekt.json'] = readFileSync(join(DATA_DIR, 'projekt.json'));
	files['buchungen.json'] = readFileSync(join(DATA_DIR, 'buchungen.json'));

	// Belege rekursiv
	const belegeDir = join(DATA_DIR, 'belege');
	if (existsSync(belegeDir)) {
		for (const buchungId of readdirSync(belegeDir)) {
			const buchungDir = join(belegeDir, buchungId);
			try {
				for (const datei of readdirSync(buchungDir)) {
					files[`belege/${buchungId}/${datei}`] = readFileSync(join(buchungDir, datei));
				}
			} catch {
				// Einzelne defekte Ordner überspringen
			}
		}
	}

	// Rechnungen JSON
	const rechnungenJson = join(DATA_DIR, 'rechnungen.json');
	if (existsSync(rechnungenJson)) {
		files['rechnungen.json'] = readFileSync(rechnungenJson);
	}

	// Rechnungs-Belege rekursiv (data/rechnungen/{rechnungId}/{abschlagId}/{datei})
	const rechnungenBelegeDir = join(DATA_DIR, 'rechnungen');
	if (existsSync(rechnungenBelegeDir)) {
		for (const rechnungId of readdirSync(rechnungenBelegeDir)) {
			if (rechnungId.endsWith('.json')) continue;
			const rechnungDir = join(rechnungenBelegeDir, rechnungId);
			try {
				for (const abschlagId of readdirSync(rechnungDir)) {
					const abschlagDir = join(rechnungDir, abschlagId);
					try {
						for (const datei of readdirSync(abschlagDir)) {
							files[`rechnungen/${rechnungId}/${abschlagId}/${datei}`] = readFileSync(
								join(abschlagDir, datei)
							);
						}
					} catch {
						// Einzelne defekte Ordner überspringen
					}
				}
			} catch {
				// Einzelne defekte Ordner überspringen
			}
		}
	}

	const zip = zipSync(files, { level: 0 }); // level 0 = store only (PDFs/Bilder sind schon komprimiert)

	const datum = new Date().toISOString().slice(0, 10);
	const dateiname = `altbau-backup-${datum}.zip`;

	return new Response(zip.buffer as ArrayBuffer, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="${dateiname}"`,
			'Content-Length': zip.byteLength.toString()
		}
	});
};
