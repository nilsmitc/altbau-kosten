import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { leseBelegRechnung, contentType, leseRechnungen } from '$lib/dataStore';

export const GET: RequestHandler = ({ params }) => {
	// Sicherheitscheck: Dateiname muss im Abschlag registriert sein (verhindert Path Traversal)
	const rechnungen = leseRechnungen();
	const rechnung = rechnungen.find((r) => r.id === params.id);
	const abschlag = rechnung?.abschlaege.find((a) => a.id === params.abschlagId);
	if (!abschlag || abschlag.beleg !== params.dateiname) {
		throw error(404, 'Beleg nicht gefunden');
	}

	const buffer = leseBelegRechnung(params.id, params.abschlagId, params.dateiname);
	if (!buffer) throw error(404, 'Beleg nicht gefunden');

	const safeName = encodeURIComponent(params.dateiname);
	return new Response(new Uint8Array(buffer), {
		headers: {
			'Content-Type': contentType(params.dateiname),
			'Content-Disposition': `inline; filename*=UTF-8''${safeName}`
		}
	});
};
