<script lang="ts">
	import { formatCents, formatDatum } from '$lib/format';
	import Charts from '$lib/components/Charts.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const verbleibend = $derived(data.gesamtBudget - data.gesamtIst);
	const prozent = $derived(data.gesamtBudget > 0 ? Math.round((data.gesamtIst / data.gesamtBudget) * 100) : 0);
	const topRaum = $derived([...data.raumSummaries].sort((a, b) => b.ist - a.ist)[0] ?? null);
	const warnungen = $derived(data.gewerkSummaries.filter((s) => s.budget > 0 && s.ist / s.budget >= 0.8));
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>

	<!-- KPIs -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
		<div class="kpi-card border-l-4 border-l-blue-500">
			<div class="text-sm text-gray-500">Gesamtbudget</div>
			<div class="text-xl font-bold font-mono">{formatCents(data.gesamtBudget)}</div>
		</div>
		<div class="kpi-card border-l-4 border-l-orange-400">
			<div class="text-sm text-gray-500">Ausgaben</div>
			<div class="text-xl font-bold font-mono">{formatCents(data.gesamtIst)}</div>
		</div>
		<div class="kpi-card border-l-4 {verbleibend < 0 ? 'border-l-red-500' : 'border-l-green-500'}">
			<div class="text-sm text-gray-500">Verbleibend</div>
			<div class="text-xl font-bold font-mono" class:text-red-600={verbleibend < 0}>{formatCents(verbleibend)}</div>
		</div>
		<div class="kpi-card border-l-4 border-l-gray-300">
			<div class="text-sm text-gray-500">Verbraucht</div>
			<div class="text-xl font-bold">{prozent}%</div>
			<div class="mt-1 w-full bg-gray-200 rounded-full h-2">
				<div
					class="h-2 rounded-full {prozent > 100 ? 'bg-red-500' : prozent >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}"
					style="width: {Math.min(prozent, 100)}%"
				></div>
			</div>
		</div>
		{#if topRaum}
			<a href="/buchungen?raum={topRaum.raum.id}" class="kpi-card border-l-4 border-l-purple-400 hover:bg-gray-50 transition-colors">
				<div class="text-sm text-gray-500">Top Raum</div>
				<div class="text-xl font-bold font-mono">{formatCents(topRaum.ist)}</div>
				<div class="text-xs text-gray-400 mt-0.5">{topRaum.raum.name} ({topRaum.raum.geschoss})</div>
			</a>
		{/if}
	</div>

	<!-- Budget-Warnungen -->
	{#if warnungen.length > 0}
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
			<div class="text-sm font-medium text-yellow-800 mb-2">Budget-Warnungen</div>
			<div class="flex flex-wrap gap-2">
				{#each warnungen as s}
					{@const pct = Math.round((s.ist / s.budget) * 100)}
					<a href="/budget" class="text-xs px-2 py-1 rounded-full {s.ist > s.budget ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}">
						{s.gewerk.name}: {pct}%
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Charts -->
	{#if data.gesamtIst > 0}
		<Charts summaries={data.gewerkSummaries} />
	{/if}

	<!-- Letzte Buchungen -->
	<div class="bg-white rounded-lg shadow-sm border">
		<div class="flex items-center justify-between px-4 py-3 border-b">
			<h2 class="text-sm font-medium text-gray-700">Letzte Buchungen</h2>
			<a href="/buchungen" class="text-blue-600 text-sm hover:underline">Alle anzeigen</a>
		</div>
		{#if data.letzteBuchungen.length > 0}
			<table class="w-full">
				<tbody>
					{#each data.letzteBuchungen as buchung (buchung.id)}
						<tr class="border-b last:border-b-0">
							<td class="px-4 py-3 text-sm text-gray-500">{formatDatum(buchung.datum)}</td>
							<td class="px-4 py-3 text-sm">{buchung.beschreibung}</td>
							<td class="px-4 py-3 text-sm text-right font-mono">{formatCents(buchung.betrag)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<div class="px-4 py-8 text-center text-gray-400">Noch keine Buchungen</div>
		{/if}
	</div>

	<!-- Gewerk-Übersicht -->
	{#if data.gewerkSummaries.some((s) => s.ist > 0)}
		<div class="bg-white rounded-lg shadow-sm border">
			<h2 class="text-sm font-medium text-gray-700 px-4 py-3 border-b">Gewerke-Übersicht</h2>
			<div class="divide-y">
				{#each data.gewerkSummaries.filter((s) => s.ist > 0) as s (s.gewerk.id)}
					{@const pct = s.budget > 0 ? Math.round((s.ist / s.budget) * 100) : 0}
					<div class="px-4 py-3">
						<div class="flex items-center justify-between mb-1">
							<div class="flex items-center gap-2 text-sm">
								<div class="w-3 h-3 rounded-full" style="background-color: {s.gewerk.farbe}"></div>
								{s.gewerk.name}
							</div>
							<div class="text-sm font-mono">{formatCents(s.ist)} / {formatCents(s.budget)}</div>
						</div>
						{#if s.budget > 0}
							<div class="w-full bg-gray-200 rounded-full h-1.5">
								<div
									class="h-1.5 rounded-full {pct > 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}"
									style="width: {Math.min(pct, 100)}%"
								></div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
