<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editId = $state<string | null>(null);
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">Gewerke</h1>

	{#if form?.error}
		<div class="bg-red-50 text-red-700 px-4 py-3 rounded">{form.error}</div>
	{/if}

	<!-- Add form -->
	<form method="POST" action="?/add" use:enhance class="bg-white p-4 rounded-lg shadow-sm border">
		<h2 class="text-sm font-medium text-gray-700 mb-3">Neues Gewerk</h2>
		<div class="flex gap-3 items-end">
			<div class="flex-1">
				<label for="name" class="block text-sm text-gray-600 mb-1">Name</label>
				<input type="text" name="name" id="name" required
					class="input-base" placeholder="z.B. Elektro" />
			</div>
			<div>
				<label for="farbe" class="block text-sm text-gray-600 mb-1">Farbe</label>
				<input type="color" name="farbe" id="farbe" value="#6B7280" class="h-10 w-14 rounded border border-gray-300 cursor-pointer" />
			</div>
			<button type="submit" class="btn-primary">Hinzufügen</button>
		</div>
	</form>

	<!-- List -->
	<div class="bg-white rounded-lg shadow-sm border">
		<table class="w-full">
			<thead>
				<tr class="border-b text-left text-sm text-gray-500">
					<th class="px-4 py-3 w-10">Farbe</th>
					<th class="px-4 py-3">Name</th>
					<th class="px-4 py-3 w-48 text-right">Aktionen</th>
				</tr>
			</thead>
			<tbody>
				{#each data.gewerke as gewerk (gewerk.id)}
					<tr class="border-b last:border-b-0">
						{#if editId === gewerk.id}
							<td colspan="3" class="px-4 py-3">
								<form method="POST" action="?/update" use:enhance={() => { return async ({ update }) => { editId = null; update(); }; }} class="flex gap-3 items-end">
									<input type="hidden" name="id" value={gewerk.id} />
									<div class="flex-1">
										<input type="text" name="name" value={gewerk.name} required
											class="input-base" />
									</div>
									<input type="color" name="farbe" value={gewerk.farbe} class="h-10 w-14 rounded border border-gray-300 cursor-pointer" />
									<button type="submit" class="btn-sm-primary">Speichern</button>
									<button type="button" onclick={() => editId = null} class="btn-sm-secondary">Abbrechen</button>
								</form>
							</td>
						{:else}
							<td class="px-4 py-3">
								<div class="w-6 h-6 rounded" style="background-color: {gewerk.farbe}"></div>
							</td>
							<td class="px-4 py-3 text-sm">{gewerk.name}</td>
							<td class="px-4 py-3 text-right">
								<button onclick={() => editId = gewerk.id} class="text-blue-600 text-sm hover:underline mr-3 transition-colors">Bearbeiten</button>
								<form method="POST" action="?/delete" use:enhance class="inline">
									<input type="hidden" name="id" value={gewerk.id} />
									<button type="submit" class="text-red-600 text-sm hover:underline transition-colors"
										onclick={(e) => { if (!confirm('Gewerk wirklich löschen?')) e.preventDefault(); }}>Löschen</button>
								</form>
							</td>
						{/if}
					</tr>
				{/each}
				{#if data.gewerke.length === 0}
					<tr><td colspan="3" class="px-4 py-8 text-center text-gray-400">Noch keine Gewerke angelegt</td></tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
