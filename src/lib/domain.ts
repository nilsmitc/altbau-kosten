// === Types ===

export interface Gewerk {
	id: string;
	name: string;
	farbe: string;
	sortierung: number;
}

export interface Raum {
	id: string;
	name: string;
	geschoss: string;
	sortierung: number;
}

export type Kategorie = 'Material' | 'Arbeitslohn' | 'Sonstiges';

export const KATEGORIEN: Kategorie[] = ['Material', 'Arbeitslohn', 'Sonstiges'];

export interface Buchung {
	id: string;
	datum: string;
	betrag: number; // cents
	gewerk: string;
	raum: string | null;
	kategorie: Kategorie;
	beschreibung: string;
	rechnungsreferenz: string;
	belege: string[];
	erstellt: string;
	geaendert: string;
}

export interface Budget {
	gewerk: string;
	geplant: number; // cents
	notiz: string;
}

export interface ProjektData {
	gewerke: Gewerk[];
	raeume: Raum[];
	budgets: Budget[];
}

// === Aggregated Views ===

export interface GewerkSummary {
	gewerk: Gewerk;
	ist: number;
	material: number;
	arbeitslohn: number;
	sonstiges: number;
	budget: number;
	differenz: number;
	anzahl: number;
}

export interface RaumSummary {
	raum: Raum;
	ist: number;
	nachGewerk: Record<string, number>;
}

export interface DashboardData {
	gesamtIst: number;
	gesamtBudget: number;
	gewerkSummaries: GewerkSummary[];
	raumSummaries: RaumSummary[];
	letzteBuchungen: Buchung[];
}

// === Factories ===

export function createGewerk(name: string, farbe: string, sortierung: number): Gewerk {
	return { id: slugify(name), name, farbe, sortierung };
}

export function createRaum(name: string, geschoss: string, sortierung: number): Raum {
	return { id: slugify(`${name}-${geschoss}`), name, geschoss, sortierung };
}

export function createBuchung(
	data: Omit<Buchung, 'id' | 'belege' | 'erstellt' | 'geaendert'>
): Buchung {
	const now = new Date().toISOString();
	return {
		...data,
		id: crypto.randomUUID(),
		belege: [],
		erstellt: now,
		geaendert: now
	};
}

// === Validation ===

export function validateBuchung(
	data: Partial<Buchung>,
	gewerke: Gewerk[]
): string[] {
	const errors: string[] = [];
	if (!data.datum) errors.push('Datum ist erforderlich');
	if (!data.betrag || data.betrag <= 0) errors.push('Betrag muss größer als 0 sein');
	if (!data.gewerk) errors.push('Gewerk ist erforderlich');
	if (data.gewerk && !gewerke.find((g) => g.id === data.gewerk))
		errors.push('Unbekanntes Gewerk');
	if (!data.kategorie || !KATEGORIEN.includes(data.kategorie))
		errors.push('Ungültige Kategorie');
	if (!data.beschreibung?.trim()) errors.push('Beschreibung ist erforderlich');
	return errors;
}

// === Aggregation ===

export function berechneGewerkSummaries(
	buchungen: Buchung[],
	gewerke: Gewerk[],
	budgets: Budget[]
): GewerkSummary[] {
	return gewerke
		.sort((a, b) => a.sortierung - b.sortierung)
		.map((gewerk) => {
			const gb = buchungen.filter((b) => b.gewerk === gewerk.id);
			const budget = budgets.find((b) => b.gewerk === gewerk.id)?.geplant ?? 0;
			const ist = gb.reduce((s, b) => s + b.betrag, 0);
			return {
				gewerk,
				ist,
				material: gb.filter((b) => b.kategorie === 'Material').reduce((s, b) => s + b.betrag, 0),
				arbeitslohn: gb
					.filter((b) => b.kategorie === 'Arbeitslohn')
					.reduce((s, b) => s + b.betrag, 0),
				sonstiges: gb
					.filter((b) => b.kategorie === 'Sonstiges')
					.reduce((s, b) => s + b.betrag, 0),
				budget,
				differenz: budget - ist,
				anzahl: gb.length
			};
		});
}

export function berechneRaumSummaries(
	buchungen: Buchung[],
	raeume: Raum[]
): RaumSummary[] {
	return raeume
		.sort((a, b) => a.sortierung - b.sortierung)
		.map((raum) => {
			const rb = buchungen.filter((b) => b.raum === raum.id);
			const nachGewerk: Record<string, number> = {};
			for (const b of rb) {
				nachGewerk[b.gewerk] = (nachGewerk[b.gewerk] ?? 0) + b.betrag;
			}
			return {
				raum,
				ist: rb.reduce((s, b) => s + b.betrag, 0),
				nachGewerk
			};
		});
}

export function berechneDashboard(
	buchungen: Buchung[],
	projekt: ProjektData
): DashboardData {
	const gewerkSummaries = berechneGewerkSummaries(
		buchungen,
		projekt.gewerke,
		projekt.budgets
	);
	const raumSummaries = berechneRaumSummaries(buchungen, projekt.raeume);

	return {
		gesamtIst: buchungen.reduce((s, b) => s + b.betrag, 0),
		gesamtBudget: projekt.budgets.reduce((s, b) => s + b.geplant, 0),
		gewerkSummaries,
		raumSummaries,
		letzteBuchungen: [...buchungen].sort((a, b) => b.erstellt.localeCompare(a.erstellt)).slice(0, 10)
	};
}

// === Helpers ===

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[äÄ]/g, 'ae')
		.replace(/[öÖ]/g, 'oe')
		.replace(/[üÜ]/g, 'ue')
		.replace(/ß/g, 'ss')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

export { slugify };
