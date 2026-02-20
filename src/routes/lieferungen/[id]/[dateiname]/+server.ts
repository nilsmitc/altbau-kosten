import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { leseBelegLieferung, contentType, leseLieferanten } from '$lib/dataStore';

export const GET: RequestHandler = ({ params }) => {
	// Sicherheitscheck: Dateiname muss in der Lieferung registriert sein (verhindert Path Traversal)
	const { lieferungen } = leseLieferanten();
	const lieferung = lieferungen.find((l) => l.id === params.id);
	if (!lieferung || !lieferung.belege.includes(params.dateiname)) {
		throw error(404, 'Beleg nicht gefunden');
	}

	const buffer = leseBelegLieferung(params.id, params.dateiname);
	if (!buffer) throw error(404, 'Beleg nicht gefunden');

	const safeName = encodeURIComponent(params.dateiname);
	return new Response(new Uint8Array(buffer), {
		headers: {
			'Content-Type': contentType(params.dateiname),
			'Content-Disposition': `inline; filename*=UTF-8''${safeName}`
		}
	});
};
