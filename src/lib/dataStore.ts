import { readFileSync, writeFileSync, mkdirSync, unlinkSync, rmSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { ProjektData, Buchung } from './domain.js';
import { berechneGewerkSummaries, berechneRaumSummaries } from './domain.js';

const DATA_DIR = join(process.cwd(), 'data');

function projektPath(): string {
	return join(DATA_DIR, 'projekt.json');
}

function buchungenPath(): string {
	return join(DATA_DIR, 'buchungen.json');
}

function summaryPath(): string {
	return join(DATA_DIR, 'summary.json');
}

// === Read ===

export function leseProjekt(): ProjektData {
	try {
		return JSON.parse(readFileSync(projektPath(), 'utf-8'));
	} catch {
		throw new Error(`projekt.json konnte nicht gelesen werden – Datei fehlt oder ist beschädigt`);
	}
}

export function leseBuchungen(): Buchung[] {
	try {
		const raw = JSON.parse(readFileSync(buchungenPath(), 'utf-8'));
		// Migration: bestehende Buchungen ohne belege-Feld bekommen leeres Array
		return raw.map((b: any) => ({ belege: [], ...b }));
	} catch {
		throw new Error(`buchungen.json konnte nicht gelesen werden – Datei fehlt oder ist beschädigt`);
	}
}

// === Write ===

export function schreibeProjekt(data: ProjektData): void {
	writeFileSync(projektPath(), JSON.stringify(data, null, 2) + '\n', 'utf-8');
	aktualisiereSummary();
}

export function schreibeBuchungen(buchungen: Buchung[]): void {
	writeFileSync(buchungenPath(), JSON.stringify(buchungen, null, 2) + '\n', 'utf-8');
	aktualisiereSummary();
}

// === Belege ===

export function belegePfad(buchungId: string): string {
	return join(DATA_DIR, 'belege', buchungId);
}

export function speicherBeleg(buchungId: string, dateiname: string, buffer: Buffer): string {
	const dir = belegePfad(buchungId);
	mkdirSync(dir, { recursive: true });
	// Dateiname sanitizen
	const safe = dateiname.replace(/[^a-zA-Z0-9._-]/g, '_');
	writeFileSync(join(dir, safe), buffer);
	return safe;
}

export function leseBeleg(buchungId: string, dateiname: string): Buffer | null {
	const pfad = join(belegePfad(buchungId), dateiname);
	if (!existsSync(pfad)) return null;
	return readFileSync(pfad);
}

export function loescheBeleg(buchungId: string, dateiname: string): void {
	const pfad = join(belegePfad(buchungId), dateiname);
	if (existsSync(pfad)) unlinkSync(pfad);
}

export function loescheBelegeOrdner(buchungId: string): void {
	const dir = belegePfad(buchungId);
	if (existsSync(dir)) rmSync(dir, { recursive: true });
}

export function contentType(dateiname: string): string {
	const ext = extname(dateiname).toLowerCase();
	const types: Record<string, string> = {
		'.pdf': 'application/pdf',
		'.jpg': 'image/jpeg',
		'.jpeg': 'image/jpeg',
		'.png': 'image/png'
	};
	return types[ext] ?? 'application/octet-stream';
}

// === Summary ===

function aktualisiereSummary(): void {
	const projekt = leseProjekt();
	const buchungen = leseBuchungen();
	const gewerkSummaries = berechneGewerkSummaries(buchungen, projekt.gewerke, projekt.budgets);
	const raumSummaries = berechneRaumSummaries(buchungen, projekt.raeume);

	const summary = {
		generiert: new Date().toISOString(),
		gesamt: {
			ist: buchungen.reduce((s, b) => s + b.betrag, 0),
			budget: projekt.budgets.reduce((s, b) => s + b.geplant, 0)
		},
		gewerke: gewerkSummaries.map((g) => ({
			id: g.gewerk.id,
			name: g.gewerk.name,
			ist: g.ist,
			budget: g.budget,
			differenz: g.differenz,
			anzahl: g.anzahl
		})),
		raeume: raumSummaries
			.filter((r) => r.ist > 0)
			.map((r) => ({
				id: r.raum.id,
				name: r.raum.name,
				geschoss: r.raum.geschoss,
				ist: r.ist
			})),
		letzteBuchungen: [...buchungen]
			.sort((a, b) => b.erstellt.localeCompare(a.erstellt))
			.slice(0, 5)
			.map((b) => ({
				datum: b.datum,
				betrag: b.betrag,
				gewerk: b.gewerk,
				beschreibung: b.beschreibung
			}))
	};

	writeFileSync(summaryPath(), JSON.stringify(summary, null, 2) + '\n', 'utf-8');
}
