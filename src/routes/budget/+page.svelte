<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatCents, centsToInputValue } from '$lib/format';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editGewerk = $state<string | null>(null);

	function ampelClass(ist: number, budget: number): string {
		if (budget === 0) return '';
		const pct = ist / budget;
		if (pct > 1) return 'bg-red-50 text-red-900';
		if (pct >= 0.8) return 'bg-yellow-50 text-yellow-900';
		return '';
	}

	function ampelBadge(ist: number, budget: number): { label: string; class: string } | null {
		if (budget === 0) return null;
		const pct = Math.round((ist / budget) * 100);
		if (ist > budget) return { label: `${pct}%`, class: 'bg-red-100 text-red-700' };
		if (pct >= 80) return { label: `${pct}%`, class: 'bg-yellow-100 text-yellow-700' };
		return { label: `${pct}%`, class: 'bg-green-100 text-green-700' };
	}
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">Budget-Übersicht</h1>

	{#if form?.error}
		<div class="bg-red-50 text-red-700 px-4 py-3 rounded">{form.error}</div>
	{/if}

	<!-- Summary -->
	<div class="grid grid-cols-3 gap-4">
		<div class="kpi-card border-l-4 border-l-blue-500">
			<div class="text-sm text-gray-500">Gesamtbudget</div>
			<div class="text-xl font-bold font-mono">{formatCents(data.gesamtBudget)}</div>
		</div>
		<div class="kpi-card border-l-4 border-l-orange-400">
			<div class="text-sm text-gray-500">Ausgaben</div>
			<div class="text-xl font-bold font-mono">{formatCents(data.gesamtIst)}</div>
		</div>
		<div class="kpi-card border-l-4 {data.gesamtIst > data.gesamtBudget ? 'border-l-red-500' : 'border-l-green-500'}">
			<div class="text-sm text-gray-500">Verbleibend</div>
			<div class="text-xl font-bold font-mono" class:text-red-600={data.gesamtIst > data.gesamtBudget}>
				{formatCents(data.gesamtBudget - data.gesamtIst)}
			</div>
		</div>
	</div>

	<!-- Table -->
	<div class="bg-white rounded-lg shadow-sm border overflow-x-auto">
		<table class="w-full">
			<thead>
				<tr class="border-b text-left text-sm text-gray-500">
					<th class="px-4 py-3">Gewerk</th>
					<th class="px-4 py-3 text-right">Budget</th>
					<th class="px-4 py-3 text-right">Ausgaben</th>
					<th class="px-4 py-3 text-right">Differenz</th>
					<th class="px-4 py-3 text-center">Status</th>
					<th class="px-4 py-3 text-right">Buchungen</th>
					<th class="px-4 py-3 w-24"></th>
				</tr>
			</thead>
			<tbody>
				{#each data.summaries as s (s.gewerk.id)}
					<tr class="border-b last:border-b-0 {ampelClass(s.ist, s.budget)}">
						{#if editGewerk === s.gewerk.id}
							<td colspan="7" class="px-4 py-3">
								<form method="POST" action="?/update" use:enhance={() => { return async ({ update }) => { editGewerk = null; update(); }; }} class="flex gap-3 items-end">
									<input type="hidden" name="gewerk" value={s.gewerk.id} />
									<div class="flex-1">
										<label class="text-xs text-gray-500">Gewerk</label>
										<div class="font-medium text-sm">{s.gewerk.name}</div>
									</div>
									<div>
										<label for="geplant" class="text-xs text-gray-500">Budget (EUR)</label>
										<input type="text" name="geplant" id="geplant" inputmode="decimal"
											value={centsToInputValue(s.budget)}
											class="w-36 input-sm" />
									</div>
									<div class="flex-1">
										<label for="notiz" class="text-xs text-gray-500">Notiz</label>
										<input type="text" name="notiz" id="notiz"
											value={data.notizen[s.gewerk.id] ?? ''}
											class="w-full input-sm" />
									</div>
									<button type="submit" class="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors duration-150">Speichern</button>
									<button type="button" onclick={() => editGewerk = null} class="text-gray-500 px-3 py-1.5 rounded text-sm hover:bg-gray-100 transition-colors duration-150">Abbrechen</button>
								</form>
							</td>
						{:else}
							<td class="px-4 py-3 text-sm">
								<div class="flex items-center gap-2">
									<div class="w-3 h-3 rounded-full" style="background-color: {s.gewerk.farbe}"></div>
									{s.gewerk.name}
								</div>
								{#if data.notizen[s.gewerk.id]}
									<div class="text-xs text-gray-400 mt-0.5">{data.notizen[s.gewerk.id]}</div>
								{/if}
							</td>
							<td class="px-4 py-3 text-sm text-right font-mono">{formatCents(s.budget)}</td>
							<td class="px-4 py-3 text-sm text-right font-mono">{formatCents(s.ist)}</td>
							<td class="px-4 py-3 text-sm text-right font-mono" class:text-red-600={s.differenz < 0}>
								{formatCents(s.differenz)}
							</td>
							<td class="px-4 py-3 text-center">
								{#if ampelBadge(s.ist, s.budget)}
									{@const badge = ampelBadge(s.ist, s.budget)!}
									<span class="text-xs px-2 py-0.5 rounded-full {badge.class}">{badge.label}</span>
								{:else}
									<span class="text-xs text-gray-400">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-sm text-right">{s.anzahl}</td>
							<td class="px-4 py-3 text-sm text-right">
								<button onclick={() => editGewerk = s.gewerk.id} class="text-blue-600 hover:underline text-sm transition-colors">Budget</button>
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr class="border-t font-medium bg-gray-50">
					<td class="px-4 py-3 text-sm">Gesamt</td>
					<td class="px-4 py-3 text-sm text-right font-mono">{formatCents(data.gesamtBudget)}</td>
					<td class="px-4 py-3 text-sm text-right font-mono">{formatCents(data.gesamtIst)}</td>
					<td class="px-4 py-3 text-sm text-right font-mono" class:text-red-600={data.gesamtIst > data.gesamtBudget}>
						{formatCents(data.gesamtBudget - data.gesamtIst)}
					</td>
					<td colspan="3"></td>
				</tr>
			</tfoot>
		</table>
	</div>
</div>
