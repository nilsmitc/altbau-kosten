<script lang="ts">
	import { enhance } from '$app/forms';
	import BuchungForm from '$lib/components/BuchungForm.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Buchung bearbeiten</h1>
		<form method="POST" action="?/delete" use:enhance>
			<button type="submit" class="text-red-600 text-sm hover:underline"
				onclick={(e) => { if (!confirm('Buchung wirklich löschen?')) e.preventDefault(); }}>
				Löschen
			</button>
		</form>
	</div>

	<BuchungForm
		gewerke={data.gewerke}
		raeume={data.raeume}
		values={(form as any)?.values ?? data.buchung}
		belege={data.buchung.belege}
		buchungId={data.buchung.id}
		error={form?.error}
		submitLabel="Änderungen speichern"
		action="?/update"
	/>

	<!-- Beleg löschen -->
	{#if data.buchung.belege.length > 0}
		<div class="bg-white p-4 rounded-lg shadow-sm border">
			<h3 class="text-sm font-medium text-gray-700 mb-2">Belege verwalten</h3>
			<div class="space-y-2">
				{#each data.buchung.belege as beleg}
					<div class="flex items-center justify-between py-1">
						<a href="/belege/{data.buchung.id}/{beleg}" target="_blank" class="text-blue-600 hover:underline text-sm">{beleg}</a>
						<form method="POST" action="?/deleteBeleg" use:enhance>
							<input type="hidden" name="dateiname" value={beleg} />
							<button type="submit" class="text-red-600 text-xs hover:underline"
								onclick={(e) => { if (!confirm(`Beleg "${beleg}" löschen?`)) e.preventDefault(); }}>
								Entfernen
							</button>
						</form>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
