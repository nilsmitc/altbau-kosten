<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import type { PlanungEintrag } from '$lib/domain';
	import { vorgaengerVon } from '$lib/domain';
	import { formatDatum } from '$lib/format';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editGewerk = $state<string | null>(null);

	// Alle Gewerke, angereichert mit ihrem Planungs-Eintrag (falls vorhanden)
	const rows = $derived(
		data.gewerke.map((g) => ({
			gewerk: g,
			plan: data.planung.find((p) => p.gewerk === g.id) ?? null
		}))
	);

	// Gewerke bereit zu starten: status=geplant, alle Vorgänger fertig
	const alsNaechstes = $derived(
		rows.filter(({ plan }) => {
			if (!plan || plan.status !== 'geplant') return false;
			const vorgIds = vorgaengerVon(plan.gewerk, data.planung);
			return vorgIds.every((id) => {
				const vp = data.planung.find((p) => p.gewerk === id);
				return vp?.status === 'fertig';
			});
		})
	);

	// Gantt: nur Gewerke mit start + ende
	const ganttRows = $derived(rows.filter((r) => r.plan?.start && r.plan?.ende));

	const ganttMin = $derived(
		ganttRows.length ? new Date(ganttRows.map((r) => r.plan!.start).sort()[0]) : null
	);
	const ganttMax = $derived(
		ganttRows.length ? new Date(ganttRows.map((r) => r.plan!.ende).sort().at(-1)!) : null
	);
	const ganttSpanMs = $derived(
		ganttMin && ganttMax ? ganttMax.getTime() - ganttMin.getTime() || 1 : 1
	);

	// Fix 1: $derived.by() statt $derived(() => ...) für komplexe Berechnung
	const ganttMonate = $derived.by(() => {
		if (!ganttMin || !ganttMax) return [];
		const monate: { label: string; pct: number }[] = [];
		const cur = new Date(ganttMin.getFullYear(), ganttMin.getMonth(), 1);
		while (cur <= ganttMax) {
			monate.push({
				label: cur.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
				pct: Math.max(0, dateToPct(cur.toISOString().slice(0, 10)))
			});
			cur.setMonth(cur.getMonth() + 1);
		}
		return monate;
	});

	function dateToPct(dateStr: string): number {
		if (!ganttMin) return 0;
		return ((new Date(dateStr).getTime() - ganttMin.getTime()) / ganttSpanMs) * 100;
	}
	function durationPct(start: string, ende: string): number {
		return ((new Date(ende).getTime() - new Date(start).getTime()) / ganttSpanMs) * 100;
	}

	function statusLabel(s: PlanungEintrag['status']): string {
		return s === 'geplant' ? 'Geplant' : s === 'aktiv' ? 'Aktiv' : 'Fertig';
	}
	function statusClass(s: PlanungEintrag['status']): string {
		return s === 'geplant'
			? 'bg-gray-100 text-gray-700'
			: s === 'aktiv'
				? 'bg-blue-100 text-blue-700'
				: 'bg-green-100 text-green-700';
	}

	function hasWarnung(plan: PlanungEintrag): boolean {
		if (!plan.start) return false;
		return vorgaengerVon(plan.gewerk, data.planung).some((id) => {
			const vp = data.planung.find((p) => p.gewerk === id);
			return vp?.ende && plan.start < vp.ende;
		});
	}

	function gewerkName(id: string): string {
		return data.gewerke.find((g) => g.id === id)?.name ?? id;
	}
	function gewerkFarbe(id: string): string {
		return data.gewerke.find((g) => g.id === id)?.farbe ?? '#9ca3af';
	}

	function editDefaults(gewerkId: string) {
		const p = data.planung.find((e) => e.gewerk === gewerkId);
		return {
			start: p?.start ?? '',
			ende: p?.ende ?? '',
			status: p?.status ?? 'geplant',
			nachGewerk: p?.nachGewerk ?? []
		};
	}
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">Bauplaner</h1>

	{#if form?.error}
		<div class="bg-red-50 text-red-700 px-4 py-3 rounded">{form.error}</div>
	{/if}

	<!-- Als nächstes -->
	{#if alsNaechstes.length > 0}
		<div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
			<div class="text-sm font-medium text-blue-800 mb-2">Als nächstes bereit</div>
			<div class="flex flex-wrap gap-2">
				{#each alsNaechstes as { gewerk }}
					<span class="flex items-center gap-1.5 px-2 py-1 rounded text-sm font-medium text-white"
						style="background-color: {gewerk.farbe}">
						{gewerk.name}
					</span>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Gantt -->
	{#if ganttRows.length > 0}
		<div class="bg-white rounded-lg shadow-sm border p-4 overflow-x-auto">
			<div class="text-sm font-medium text-gray-700 mb-3">Zeitplan</div>
			<div class="min-w-[600px]">
				<!-- Monats-Header -->
				<div class="relative h-6 mb-1 border-b">
					<!-- Fix 1: ganttMonate ohne Klammern (ist jetzt ein Wert, keine Funktion) -->
					{#each ganttMonate as m}
						<span class="absolute text-xs text-gray-400 -translate-x-1/2"
							style="left: {m.pct}%">{m.label}</span>
					{/each}
				</div>
				<!-- Bars -->
				<div class="space-y-1.5 pt-1">
					{#each ganttRows as { gewerk, plan }}
						<div class="flex items-center gap-2">
							<div class="w-32 shrink-0 text-xs text-gray-600 text-right truncate"
								title={gewerk.name}>{gewerk.name}</div>
							<div class="relative flex-1 h-6">
								<div
									class="absolute h-full rounded text-xs flex items-center px-1.5 text-white overflow-hidden whitespace-nowrap"
									style="left: {dateToPct(plan!.start)}%; width: {durationPct(plan!.start, plan!.ende)}%;
										background-color: {gewerk.farbe};
										opacity: {plan!.status === 'geplant' ? '0.55' : '1'}"
									title="{gewerk.name}: {formatDatum(plan!.start)} – {formatDatum(plan!.ende)}">
									{gewerk.name}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Tabelle -->
	<div class="bg-white rounded-lg shadow-sm border overflow-x-auto">
		<table class="w-full">
			<thead>
				<tr class="border-b text-left text-sm text-gray-500">
					<th class="px-4 py-3">Gewerk</th>
					<th class="px-4 py-3">Start</th>
					<th class="px-4 py-3">Ende</th>
					<th class="px-4 py-3">Status</th>
					<th class="px-4 py-3">Danach</th>
					<th class="px-4 py-3 w-24"></th>
				</tr>
			</thead>
			<tbody>
				{#each rows as { gewerk, plan }}
					<tr class="border-b last:border-b-0 hover:bg-gray-50">
						<td class="px-4 py-3 text-sm">
							<div class="flex items-center gap-1.5">
								<div class="w-2.5 h-2.5 rounded-full shrink-0"
									style="background-color: {gewerk.farbe}"></div>
								{gewerk.name}
								{#if plan && hasWarnung(plan)}
									<span title="Startdatum liegt vor Ende eines Vorgänger-Gewerks"
										class="text-amber-500 text-base leading-none">⚠</span>
								{/if}
							</div>
						</td>
						<td class="px-4 py-3 text-sm text-gray-600">
							{plan?.start ? formatDatum(plan.start) : '—'}
						</td>
						<td class="px-4 py-3 text-sm text-gray-600">
							{plan?.ende ? formatDatum(plan.ende) : '—'}
						</td>
						<td class="px-4 py-3 text-sm">
							{#if plan}
								<span class="px-2 py-0.5 rounded text-xs font-medium {statusClass(plan.status)}">
									{statusLabel(plan.status)}
								</span>
							{:else}
								<span class="text-gray-400 text-xs">Nicht geplant</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-sm">
							<div class="flex flex-wrap gap-1">
								{#each plan?.nachGewerk ?? [] as ngId}
									<span class="text-xs px-1.5 py-0.5 rounded"
										style="background-color: {gewerkFarbe(ngId)}22; color: {gewerkFarbe(ngId)}">
										{gewerkName(ngId)}
									</span>
								{/each}
							</div>
						</td>
						<td class="px-4 py-3 text-sm text-right">
							<button
								class="text-blue-600 hover:underline text-sm"
								onclick={() => editGewerk = editGewerk === gewerk.id ? null : gewerk.id}>
								{editGewerk === gewerk.id ? 'Schließen' : 'Bearbeiten'}
							</button>
						</td>
					</tr>

					<!-- Inline-Edit -->
					{#if editGewerk === gewerk.id}
						{@const def = editDefaults(gewerk.id)}
						<tr class="bg-gray-50 border-b">
							<td colspan="6" class="px-4 py-4">
								<!-- Fix 2: enhance-Callback statt onsubmit, kein verschachteltes <form> -->
								<form method="POST" action="?/update"
									use:enhance={() => async ({ update }) => { editGewerk = null; update(); }}
									class="space-y-3">
									<input type="hidden" name="gewerk" value={gewerk.id} />

									<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
										<div>
											<label class="block text-xs font-medium text-gray-600 mb-1">Start</label>
											<input type="date" name="start" value={def.start} class="input-base text-sm" />
										</div>
										<div>
											<label class="block text-xs font-medium text-gray-600 mb-1">Ende</label>
											<input type="date" name="ende" value={def.ende} class="input-base text-sm" />
										</div>
										<div>
											<label class="block text-xs font-medium text-gray-600 mb-1">Status</label>
											<select name="status" class="input-base text-sm">
												{#each ['geplant', 'aktiv', 'fertig'] as s}
													<option value={s} selected={def.status === s}>{statusLabel(s as PlanungEintrag['status'])}</option>
												{/each}
											</select>
										</div>
									</div>

									<div>
										<label class="block text-xs font-medium text-gray-600 mb-1">Danach kommt</label>
										<div class="flex flex-wrap gap-2">
											{#each data.gewerke.filter((g) => g.id !== gewerk.id) as g}
												<label class="flex items-center gap-1.5 text-sm cursor-pointer">
													<input type="checkbox" name="nachGewerk" value={g.id}
														checked={def.nachGewerk.includes(g.id)} class="rounded" />
													<span class="flex items-center gap-1">
														<span class="w-2 h-2 rounded-full inline-block"
															style="background-color: {g.farbe}"></span>
														{g.name}
													</span>
												</label>
											{/each}
										</div>
									</div>

									<div class="flex gap-2 items-center">
										<button type="submit" class="btn-primary text-sm">Speichern</button>
										<button type="button" class="btn-secondary text-sm"
											onclick={() => editGewerk = null}>Abbrechen</button>
									</div>
								</form>

								<!-- Fix 3: Remove-Form AUSSERHALB der Update-Form -->
								{#if plan}
									<form method="POST" action="?/remove" class="mt-2"
										use:enhance={() => async ({ update }) => { editGewerk = null; update(); }}>
										<input type="hidden" name="gewerk" value={gewerk.id} />
										<button type="submit" class="text-red-600 text-sm hover:underline"
											onclick={(e) => { if (!confirm('Planung für dieses Gewerk wirklich entfernen?')) e.preventDefault(); }}>
											Planung entfernen
										</button>
									</form>
								{/if}
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	</div>
</div>
