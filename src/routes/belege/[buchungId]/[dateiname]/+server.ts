import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { leseBeleg, contentType, leseBuchungen } from '$lib/dataStore';

export const GET: RequestHandler = ({ params }) => {
	// Sicherheitscheck: Dateiname muss in der Buchung registriert sein (verhindert Path Traversal)
	const buchungen = leseBuchungen();
	const buchung = buchungen.find((b) => b.id === params.buchungId);
	if (!buchung || !buchung.belege.includes(params.dateiname)) {
		throw error(404, 'Beleg nicht gefunden');
	}

	const buffer = leseBeleg(params.buchungId, params.dateiname);
	if (!buffer) throw error(404, 'Beleg nicht gefunden');

	const safeName = encodeURIComponent(params.dateiname);
	return new Response(new Uint8Array(buffer), {
		headers: {
			'Content-Type': contentType(params.dateiname),
			'Content-Disposition': `inline; filename*=UTF-8''${safeName}`
		}
	});
};
