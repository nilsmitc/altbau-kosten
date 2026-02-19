import type { PageServerLoad } from './$types';
import { leseBuchungen, leseProjekt, leseRechnungen } from '$lib/dataStore';
import { abschlagEffektivStatus } from '$lib/domain';

export const load: PageServerLoad = () => {
	const buchungen = leseBuchungen();
	const projekt = leseProjekt();

	const gesamtBudget = projekt.budgets.reduce((s, b) => s + b.geplant, 0);

	// Gebundene Mittel: offene Abschläge aus Rechnungen
	const rechnungen = leseRechnungen();
	let gebundeneMittelGesamt = 0;
	const gebundenNachGewerk: Record<string, number> = {};
	for (const r of rechnungen) {
		for (const a of r.abschlaege) {
			const s = abschlagEffektivStatus(a);
			if (s === 'offen' || s === 'ueberfaellig') {
				gebundeneMittelGesamt += a.rechnungsbetrag;
				gebundenNachGewerk[r.gewerk] = (gebundenNachGewerk[r.gewerk] ?? 0) + a.rechnungsbetrag;
			}
		}
	}

	if (buchungen.length === 0) {
		return {
			keineDaten: true,
			burnRateMonatlich: 0,
			gesamtIst: 0,
			gesamtBudget,
			restBudget: gesamtBudget,
			restMonate: null as number | null,
			anzahlMonate: 0,
			anzahlBuchungen: 0,
			konfidenz: 'niedrig' as const,
			erschoepfungsDatum: null as string | null,
			chartLabels: [] as string[],
			chartIst: [] as (number | null)[],
			chartPrognose: [] as (number | null)[],
			chartBudget: [] as number[],
			gewerkPrognosen: [] as GewerkPrognose[],
			gebundeneMittelGesamt,
			gebundenNachGewerk
		};
	}

	// Monatsdaten aggregieren
	const map = new Map<string, number>();
	for (const b of buchungen) {
		const monat = b.datum.slice(0, 7);
		map.set(monat, (map.get(monat) ?? 0) + b.betrag);
	}
	const sortedMonate = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));

	let kumuliert = 0;
	const monate = sortedMonate.map(([monat, ausgaben]) => {
		kumuliert += ausgaben;
		const [year, month] = monat.split('-').map(Number);
		const label = new Date(year, month - 1, 1).toLocaleDateString('de-DE', {
			month: 'long',
			year: 'numeric'
		});
		return { monat, label, ausgaben, kumuliert };
	});

	const gesamtIst = kumuliert;
	const anzahlMonate = monate.length;
	const anzahlBuchungen = buchungen.length;

	// Burn Rate
	const burnRateMonatlich = Math.round(gesamtIst / anzahlMonate);

	// Restbudget & Erschöpfungsdatum
	const restBudget = gesamtBudget - gesamtIst;
	const restMonate = burnRateMonatlich > 0 && restBudget > 0
		? Math.ceil(restBudget / burnRateMonatlich)
		: null;

	let erschoepfungsDatum: string | null = null;
	if (restMonate !== null) {
		const letzterMonat = monate[monate.length - 1].monat;
		const [ly, lm] = letzterMonat.split('-').map(Number);
		const datum = new Date(ly, lm - 1 + restMonate, 1);
		erschoepfungsDatum = datum.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
	}

	// Konfidenz-Indikator
	let konfidenz: 'niedrig' | 'mittel' | 'hoch';
	if (anzahlMonate < 2) konfidenz = 'niedrig';
	else if (anzahlMonate < 4) konfidenz = 'mittel';
	else konfidenz = 'hoch';

	// Chart-Datenpunkte aufbauen
	const letzterHistorisch = monate[monate.length - 1];
	const [lastYear, lastMonth] = letzterHistorisch.monat.split('-').map(Number);
	const maxPrognoseMonate = Math.min(restMonate ?? 18, 18);

	const chartLabels: string[] = monate.map((m) => m.label);
	// Ist: Werte für historische Monate
	const chartIst: (number | null)[] = monate.map((m) => m.kumuliert);
	// Prognose: nur ab letztem Ist-Monat (Überlappung für nahtlosen Übergang)
	const chartPrognose: (number | null)[] = monate.map((_, i) =>
		i === monate.length - 1 ? letzterHistorisch.kumuliert : null
	);
	// Budget-Linie: konstant
	const chartBudget: number[] = monate.map(() => gesamtBudget);

	for (let i = 1; i <= maxPrognoseMonate; i++) {
		const datum = new Date(lastYear, lastMonth - 1 + i, 1);
		const label = datum.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
		const progKumuliert = gesamtIst + burnRateMonatlich * i;

		chartLabels.push(label);
		chartIst.push(null);
		chartPrognose.push(Math.min(progKumuliert, gesamtBudget));
		chartBudget.push(gesamtBudget);

		if (progKumuliert >= gesamtBudget) break;
	}

	// Gewerk-Prognosen (proportionale Hochrechnung)
	const gewerkPrognosen: GewerkPrognose[] = projekt.gewerke
		.sort((a, b) => a.sortierung - b.sortierung)
		.map((gewerk) => {
			const gb = buchungen.filter((b) => b.gewerk === gewerk.id);
			const ist = gb.reduce((s, b) => s + b.betrag, 0);
			const budget = projekt.budgets.find((b) => b.gewerk === gewerk.id)?.geplant ?? 0;

			let hochgerechnet: number | null = null;
			let differenz: number | null = null;
			let status: 'ok' | 'warnung' | 'kritisch' = 'ok';

			if (ist > 0 && gesamtIst > 0) {
				// Anteil dieses Gewerks an Gesamtkosten bleibt konstant → proportionale Hochrechnung
				hochgerechnet = Math.round((ist / gesamtIst) * gesamtBudget);
				differenz = budget - hochgerechnet;

				if (budget === 0) {
					status = hochgerechnet > 0 ? 'warnung' : 'ok';
				} else if (hochgerechnet > budget) {
					status = 'kritisch';
				} else if (hochgerechnet > budget * 0.8) {
					status = 'warnung';
				} else {
					status = 'ok';
				}
			}

			return { gewerk, budget, ist, hochgerechnet, differenz, status, gebunden: gebundenNachGewerk[gewerk.id] ?? 0 };
		});

	return {
		keineDaten: false,
		burnRateMonatlich,
		gesamtIst,
		gesamtBudget,
		restBudget,
		restMonate,
		anzahlMonate,
		anzahlBuchungen,
		konfidenz,
		erschoepfungsDatum,
		chartLabels,
		chartIst,
		chartPrognose,
		chartBudget,
		gewerkPrognosen,
		gebundeneMittelGesamt,
		gebundenNachGewerk
	};
};

interface GewerkPrognose {
	gewerk: { id: string; name: string; farbe: string; sortierung: number };
	budget: number;
	ist: number;
	hochgerechnet: number | null;
	differenz: number | null;
	status: 'ok' | 'warnung' | 'kritisch';
	gebunden: number;
}
