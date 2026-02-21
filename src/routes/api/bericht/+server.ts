import type { RequestHandler } from './$types';
import { leseProjekt, leseBuchungen, leseRechnungen, leseLieferanten } from '$lib/dataStore';
import { erstelleBauleiterbericht } from '$lib/pdfReport';
import { leseAnalyse } from '$lib/aiAnalyse';

export const GET: RequestHandler = async ({ url }) => {
	const mitAi = url.searchParams.get('ai') === 'true';

	const projekt = leseProjekt();
	const buchungen = leseBuchungen();
	const rechnungen = leseRechnungen();
	const lieferantenData = leseLieferanten();

	const analyseDatei = mitAi ? leseAnalyse() : null;

	const pdfBuffer = await erstelleBauleiterbericht(
		projekt, buchungen, rechnungen, lieferantenData,
		analyseDatei?.analyse ?? null, mitAi
	);

	const datum = new Date().toISOString().slice(0, 10);
	return new Response(pdfBuffer as unknown as BodyInit, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="bauleiter-bericht-${datum}.pdf"`,
			'Content-Length': pdfBuffer.byteLength.toString()
		}
	});
};
