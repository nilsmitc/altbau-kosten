<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatCents } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let zeigeFormular = $state(false);
	let formError = $state('');
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
			</svg>
			<h1 class="text-2xl font-bold text-gray-900">Lieferanten</h1>
		</div>
		<button
			onclick={() => (zeigeFormular = !zeigeFormular)}
			class="btn-primary flex items-center gap-2"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			Neuer Lieferant
		</button>
	</div>

	{#if zeigeFormular}
		<div class="card">
			<h2 class="mb-4 text-lg font-semibold text-gray-800">Neuen Lieferanten anlegen</h2>
			{#if formError}
				<div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</div>
			{/if}
			<form
				method="POST"
				action="?/anlegen"
				use:enhance={({ formElement }) => {
					formError = '';
					return async ({ result, update }) => {
						if (result.type === 'failure') {
							formError = (result.data?.error as string) ?? 'Fehler';
						} else {
							formElement.reset();
							zeigeFormular = false;
						}
						await update();
					};
				}}
				class="grid grid-cols-1 gap-4 md:grid-cols-2"
			>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700" for="name">Name *</label>
					<input
						type="text"
						name="name"
						id="name"
						required
						placeholder="z.B. Hornbach, Bauhaus, OBI"
						class="input-base"
					/>
				</div>

				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700" for="notiz">Notiz</label>
					<input
						type="text"
						name="notiz"
						id="notiz"
						placeholder="Kundennummer, Ansprechpartner, ..."
						class="input-base"
					/>
				</div>

				<div class="flex gap-3 md:col-span-2">
					<button type="submit" class="btn-primary">Lieferant anlegen</button>
					<button
						type="button"
						onclick={() => (zeigeFormular = false)}
						class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						Abbrechen
					</button>
				</div>
			</form>
		</div>
	{/if}

	{#if data.stats.length === 0}
		<div class="card py-12 text-center">
			<svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
				<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
			</svg>
			<p class="mt-3 text-gray-500">Noch keine Lieferanten angelegt</p>
			<button onclick={() => (zeigeFormular = true)} class="btn-primary mt-4">Ersten Lieferanten anlegen</button>
		</div>
	{:else}
		<div class="card overflow-hidden p-0">
			<table class="w-full text-sm">
				<thead>
					<tr class="thead-row">
						<th class="px-4 py-3 text-left">Lieferant</th>
						<th class="px-4 py-3 text-right">Gesamtausgaben</th>
						<th class="px-4 py-3 text-right">Lieferungen</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each data.stats as { lieferant, gesamtBetrag, anzahlLieferungen }}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3">
								<div class="font-medium text-gray-900">{lieferant.name}</div>
								{#if lieferant.notiz}
									<div class="text-xs text-gray-500">{lieferant.notiz}</div>
								{/if}
							</td>
							<td class="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
								{gesamtBetrag !== 0 ? formatCents(gesamtBetrag) : '—'}
							</td>
							<td class="px-4 py-3 text-right text-gray-600">
								{anzahlLieferungen}
							</td>
							<td class="px-4 py-3 text-right">
								<a
									href="/lieferanten/{lieferant.id}"
									class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
								>
									Details
									<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
									</svg>
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
