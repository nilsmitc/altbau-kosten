export function formatCents(cents: number): string {
	return (cents / 100).toLocaleString('de-DE', {
		style: 'currency',
		currency: 'EUR'
	});
}

export function parseCentsFromInput(value: string): number {
	// Input: "1234,56" or "1234.56" or "1234" → cents
	const cleaned = value.replace(/\s/g, '').replaceAll('.', '').replace(',', '.');
	const num = parseFloat(cleaned);
	if (isNaN(num)) return 0;
	return Math.round(num * 100);
}

export function centsToInputValue(cents: number): string {
	return (cents / 100).toFixed(2).replace('.', ',');
}

export function formatDatum(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
