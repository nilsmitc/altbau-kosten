<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { formatCents, formatDatum } from '$lib/format';
	import { KATEGORIEN } from '$lib/domain';

	let { data }: { data: PageData } = $props();

	function gewerkName(id: string): string {
		return data.gewerke.find((g) => g.id === id)?.name ?? id;
	}

	function raumName(id: string | null): string {
		if (!id) return '—';
		const r = data.raeume.find((r) => r.id === id);
		return r ? `${r.name} (${r.geschoss})` : id;
	}

	function applyFilter(key: string, value: string) {
		const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
		if (value) params.set(key, value);
		else params.delete(key);
		goto(`/buchungen?${params.toString()}`);
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Buchungen</h1>
		<a href="/buchungen/neu" class="btn-primary">
			Neue Buchung
		</a>
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap gap-3 bg-white p-3 rounded-lg shadow-sm border">
		<input
			type="search"
			placeholder="Suche in Beschreibung & Rechnung…"
			value={data.filter.suche ?? ''}
			oninput={(e) => applyFilter('suche', e.currentTarget.value)}
			class="input-sm flex-1 min-w-48"
		/>
		<select onchange={(e) => applyFilter('gewerk', e.currentTarget.value)} class="input-sm">
			<option value="">Alle Gewerke</option>
			{#each data.gewerke as g}
				<option value={g.id} selected={data.filter.gewerk === g.id}>{g.name}</option>
			{/each}
		</select>

		<select onchange={(e) => applyFilter('raum', e.currentTarget.value)} class="input-sm">
			<option value="">Alle Räume</option>
			{#each data.raeume as r}
				<option value={r.id} selected={data.filter.raum === r.id}>{r.name} ({r.geschoss})</option>
			{/each}
		</select>

		<select onchange={(e) => applyFilter('kategorie', e.currentTarget.value)} class="input-sm">
			<option value="">Alle Kategorien</option>
			{#each KATEGORIEN as k}
				<option value={k} selected={data.filter.kategorie === k}>{k}</option>
			{/each}
		</select>
	</div>


	<!-- Table -->
	<div class="bg-white rounded-lg shadow-sm border overflow-x-auto">
		<table class="w-full">
			<thead>
				<tr class="border-b text-left text-sm text-gray-500">
					<th class="px-4 py-3">Datum</th>
					<th class="px-4 py-3">Beschreibung</th>
					<th class="px-4 py-3">Gewerk</th>
					<th class="px-4 py-3">Raum</th>
					<th class="px-4 py-3">Kategorie</th>
					<th class="px-4 py-3 text-right">Betrag</th>
					<th class="px-4 py-3 w-24"></th>
				</tr>
			</thead>
			<tbody>
				{#each data.buchungen as buchung (buchung.id)}
					<tr class="border-b last:border-b-0 hover:bg-gray-50">
						<td class="px-4 py-3 text-sm">{formatDatum(buchung.datum)}</td>
						<td class="px-4 py-3 text-sm">
							<div class="flex items-center gap-1.5">
								{buchung.beschreibung}
								{#if buchung.belege?.length}
									<a href="/buchungen/{buchung.id}" class="text-gray-400 hover:text-blue-500 transition-colors" title="{buchung.belege.length} Beleg(e)">
										<svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
										{buchung.belege.length}
									</a>
								{/if}
							</div>
							{#if buchung.rechnungsreferenz}
								<div class="text-xs text-gray-400">{buchung.rechnungsreferenz}</div>
							{/if}
						</td>
						<td class="px-4 py-3 text-sm">{gewerkName(buchung.gewerk)}</td>
						<td class="px-4 py-3 text-sm">{raumName(buchung.raum)}</td>
						<td class="px-4 py-3 text-sm">{buchung.kategorie}</td>
						<td class="px-4 py-3 text-sm text-right font-mono">{formatCents(buchung.betrag)}</td>
						<td class="px-4 py-3 text-sm text-right">
							<a href="/buchungen/{buchung.id}" class="text-blue-600 hover:underline">Bearbeiten</a>
						</td>
					</tr>
				{/each}
				{#if data.buchungen.length === 0}
					<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">Keine Buchungen gefunden</td></tr>
				{/if}
			</tbody>
		</table>
	</div>

	{#if data.buchungen.length > 0}
		<div class="text-sm text-gray-500 text-right">
			{data.buchungen.length} Buchungen, Summe: {formatCents(data.buchungen.reduce((s, b) => s + b.betrag, 0))}
		</div>
	{/if}
</div>
