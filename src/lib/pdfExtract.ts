import { PDFParse } from 'pdf-parse';
import type { LieferungPosition } from './domain.js';

export interface PdfExtractResult {
	datum?: string;              // "YYYY-MM-DD"
	rechnungsnummer?: string;
	lieferscheinnummer?: string;
	betrag?: number;             // Cents
	positionen: LieferungPosition[];
	rohtext: string;
	fehler?: string;
}

export async function extrahierePdfDaten(buffer: Buffer): Promise<PdfExtractResult> {
	let rohtext = '';
	try {
		const parser = new PDFParse({ data: buffer });
		const result = await parser.getText();
		rohtext = result.text ?? '';
	} catch {
		return { positionen: [], rohtext: '', fehler: 'PDF konnte nicht gelesen werden' };
	}

	if (!rohtext.trim()) {
		return { positionen: [], rohtext, fehler: 'scan' };
	}

	return {
		datum: extrahiereDatum(rohtext),
		rechnungsnummer: extrahiereRechnungsnummer(rohtext),
		lieferscheinnummer: extrahiereLieferscheinnummer(rohtext),
		betrag: extrahiereGesamtbetrag(rohtext),
		positionen: extrahierePositionen(rohtext),
		rohtext
	};
}

// ─── Datum ───────────────────────────────────────────────────────────────────

function extrahiereDatum(text: string): string | undefined {
	// Suche zuerst nach Datum mit Keyword
	const mitKeyword = [
		/(?:Rechnungsdatum|Leistungsdatum|Belegdatum|Datum|Bestelldatum)\s*[:\-]?\s*(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i,
		/vom\s+(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i,
		/Datum\s*:\s*(\d{1,2}\.\d{1,2}\.\d{4})/i
	];

	for (const re of mitKeyword) {
		const m = text.match(re);
		if (m) return normalisieresDatum(m[1]);
	}

	// Fallback: erstes vierstelliges Jahresdatum im Text
	const fallback = text.match(/\b(\d{1,2}[.\/-]\d{1,2}[.\/-]20\d{2})\b/);
	if (fallback) return normalisieresDatum(fallback[1]);

	return undefined;
}

function normalisieresDatum(raw: string): string {
	// Normalisiert DD.MM.YYYY → YYYY-MM-DD
	const parts = raw.split(/[.\/-]/);
	if (parts.length !== 3) return '';
	const [a, b, c] = parts;
	if (c.length === 4) {
		// DD.MM.YYYY
		return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
	} else if (a.length === 4) {
		// YYYY-MM-DD
		return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
	}
	return '';
}

// ─── Rechnungsnummer ─────────────────────────────────────────────────────────

function extrahiereRechnungsnummer(text: string): string | undefined {
	const patterns = [
		/(?:Rechnungsnummer|Rechnungs-?Nr\.?|Rg\.?-?Nr\.?|Re\.?-?Nr\.?|Belegnummer|Invoice\s*No\.?)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/_.]{3,30})/i,
		/(?:Rechnung\s+Nr\.?|Rechnung\s+Nummer)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/_.]{3,30})/i
	];
	for (const re of patterns) {
		const m = text.match(re);
		if (m && m[1]) return m[1].trim();
	}
	return undefined;
}

// ─── Lieferscheinnummer ───────────────────────────────────────────────────────

function extrahiereLieferscheinnummer(text: string): string | undefined {
	const patterns = [
		/(?:Lieferschein-?(?:Nr\.?|Nummer)|LS-?Nr\.?|Delivery\s*Note)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/_.]{3,30})/i,
		/Lieferschein\s+(?:Nr\.?:?\s*)([A-Z0-9][A-Z0-9\-\/_.]{3,30})/i
	];
	for (const re of patterns) {
		const m = text.match(re);
		if (m && m[1]) return m[1].trim();
	}
	return undefined;
}

// ─── Gesamtbetrag ─────────────────────────────────────────────────────────────

function extrahiereGesamtbetrag(text: string): number | undefined {
	// Betrag-Patterns (in Cents umrechnen)
	const keywordPatterns = [
		/(?:Gesamtbetrag|Rechnungsbetrag|Rechnungssumme|Bruttobetrag|Gesamt\s+inkl\.?\s*(?:MwSt|USt)|Zu\s+zahlen|Zahlbetrag|Total|Summe\s+brutto)\s*[:\-]?\s*(?:EUR|€)?\s*([\d.,]+)\s*(?:EUR|€)?/i,
		/(?:EUR|€)\s*([\d.,]+)\s*(?:inkl\.?\s*MwSt|brutto)/i
	];

	for (const re of keywordPatterns) {
		const m = text.match(re);
		if (m) {
			const cents = parseBetragZuCents(m[1]);
			if (cents > 0) return cents;
		}
	}

	// Fallback: höchsten Eurobetrag im Text nehmen
	const allBetraege = [...text.matchAll(/(?:€|EUR)\s*([\d]{1,6}[.,][\d]{2})/gi)];
	if (allBetraege.length > 0) {
		const betraege = allBetraege.map((m) => parseBetragZuCents(m[1])).filter((b) => b > 0);
		if (betraege.length > 0) return Math.max(...betraege);
	}

	// Fallback: Betrag der letzten Zeile mit €-Zeichen
	const lines = text.split('\n');
	for (let i = lines.length - 1; i >= 0; i--) {
		if (lines[i].includes('€') || /EUR/i.test(lines[i])) {
			const m = lines[i].match(/([\d]{1,6}[.,][\d]{2})/);
			if (m) {
				const cents = parseBetragZuCents(m[1]);
				if (cents > 0) return cents;
			}
		}
	}

	return undefined;
}

function parseBetragZuCents(raw: string): number {
	// Deutsches Format: 1.234,56 oder 1234,56 oder 1234.56
	const cleaned = raw.trim().replace(/\s/g, '');
	let normalized: string;

	if (/^\d{1,3}(\.\d{3})*(,\d{2})$/.test(cleaned)) {
		// Deutsches Format: 1.234,56
		normalized = cleaned.replaceAll('.', '').replace(',', '.');
	} else if (/^\d+(,\d{2})$/.test(cleaned)) {
		// 1234,56
		normalized = cleaned.replace(',', '.');
	} else if (/^\d+(\.\d{2})$/.test(cleaned)) {
		// 1234.56
		normalized = cleaned;
	} else {
		// Generisch: letztes Komma/Punkt als Dezimaltrennzeichen
		normalized = cleaned.replaceAll('.', '').replace(',', '.');
	}

	const num = parseFloat(normalized);
	if (isNaN(num) || num <= 0) return 0;
	return Math.round(num * 100);
}

// ─── Positionen ───────────────────────────────────────────────────────────────

function extrahierePositionen(text: string): LieferungPosition[] {
	const positionen: LieferungPosition[] = [];
	const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

	// Einfache Heuristik: Zeilen die mit einem Betrag enden und einen Beschreibungstext links haben
	// Muster: "Beschreibung [optional: Menge] Betrag"
	const positionRe = /^(.{5,60?}?)\s+((?:\d+\s*[xX×]\s*)?[\d.,]+\s*(?:Stk|Stück|m|m²|m2|lfm|kg|l|Pck|Pkg|Rolle|St\.?)?)?\s+([\d]{1,6}[.,]\d{2})\s*(?:€|EUR)?$/;

	for (const line of lines) {
		// Überspringe Zeilen die wie Überschriften, Summen-Zeilen oder sehr kurze Zeilen aussehen
		if (line.length < 10) continue;
		if (/(?:gesamt|summe|mwst|steuer|netto|brutto|zwischensumme|total|zahlung|ust)/i.test(line)) continue;
		if (/^\s*%/.test(line)) continue;

		const m = line.match(positionRe);
		if (m) {
			const beschreibung = m[1].trim();
			const menge = m[2]?.trim() || undefined;
			const betrag = parseBetragZuCents(m[3]);

			if (beschreibung.length >= 4 && betrag > 0 && betrag < 10_000_000) {
				positionen.push({ beschreibung, menge, betrag });
			}
		}
	}

	// Maximal 30 Positionen zurückgeben
	return positionen.slice(0, 30);
}
