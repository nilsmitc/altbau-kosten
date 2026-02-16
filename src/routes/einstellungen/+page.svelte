<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const erfolg = $derived($page.url.searchParams.get('success') === '1');
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">Einstellungen</h1>

	<!-- Export -->
	<div class="bg-white rounded-lg shadow-sm border p-6 space-y-3">
		<h2 class="text-lg font-semibold text-gray-800">Backup exportieren</h2>
		<p class="text-sm text-gray-600">
			Lädt eine ZIP-Datei mit allen Daten herunter: Buchungen, Projektdaten (Gewerke, Räume,
			Budgets, Bauplaner) und alle Beleg-Anhänge.
		</p>
		<a href="/api/export" class="btn-primary inline-block">Backup herunterladen</a>
	</div>

	<!-- Import -->
	<div class="bg-white rounded-lg shadow-sm border p-6 space-y-3">
		<h2 class="text-lg font-semibold text-gray-800">Backup importieren</h2>
		<p class="text-sm text-gray-600">
			Stellt ein zuvor erstelltes Backup wieder her. <strong class="text-red-700">Alle
			vorhandenen Daten werden dabei überschrieben.</strong>
		</p>

		{#if form?.error}
			<div class="bg-red-50 text-red-700 px-4 py-3 rounded text-sm">{form.error}</div>
		{/if}
		{#if erfolg}
			<div class="bg-green-50 text-green-700 px-4 py-3 rounded text-sm">
				Backup erfolgreich importiert.
			</div>
		{/if}

		<form method="POST" action="?/import" enctype="multipart/form-data" use:enhance
			class="space-y-3"
			onsubmit={(e) => {
				if (!confirm('Wirklich importieren? Alle vorhandenen Daten werden überschrieben.')) {
					e.preventDefault();
				}
			}}>
			<input
				type="file"
				name="backup"
				accept=".zip,application/zip"
				required
				class="input-base file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
			/>
			<div>
				<button type="submit" class="btn-primary">Importieren</button>
			</div>
		</form>
	</div>
</div>
