<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editId = $state<string | null>(null);

	const geschosse = ['KG', 'EG', 'OG', 'DG'];
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">Räume</h1>

	{#if form?.error}
		<div class="bg-red-50 text-red-700 px-4 py-3 rounded">{form.error}</div>
	{/if}

	<!-- Add form -->
	<form method="POST" action="?/add" use:enhance class="bg-white p-4 rounded-lg shadow-sm border">
		<h2 class="text-sm font-medium text-gray-700 mb-3">Neuer Raum</h2>
		<div class="flex gap-3 items-end">
			<div class="flex-1">
				<label for="name" class="block text-sm text-gray-600 mb-1">Name</label>
				<input type="text" name="name" id="name" required
					class="input-base" placeholder="z.B. Küche" />
			</div>
			<div>
				<label for="geschoss" class="block text-sm text-gray-600 mb-1">Geschoss</label>
				<select name="geschoss" id="geschoss" required class="input-sm">
					{#each geschosse as g}
						<option value={g}>{g}</option>
					{/each}
				</select>
			</div>
			<button type="submit" class="btn-primary">Hinzufügen</button>
		</div>
	</form>

	<!-- List grouped by Geschoss -->
	{#each geschosse as geschoss}
		{@const raeume = data.raeume.filter((r) => r.geschoss === geschoss)}
		{#if raeume.length > 0}
			<div class="bg-white rounded-lg shadow-sm border">
				<h2 class="px-4 py-3 text-sm font-medium text-gray-500 border-b bg-gray-50 rounded-t-lg">{geschoss}</h2>
				<table class="w-full">
					<tbody>
						{#each raeume as raum (raum.id)}
							<tr class="border-b last:border-b-0">
								{#if editId === raum.id}
									<td colspan="2" class="px-4 py-3">
										<form method="POST" action="?/update" use:enhance={() => { return async ({ update }) => { editId = null; update(); }; }} class="flex gap-3 items-end">
											<input type="hidden" name="id" value={raum.id} />
											<div class="flex-1">
												<input type="text" name="name" value={raum.name} required
													class="input-base" />
											</div>
											<select name="geschoss" required class="input-sm">
												{#each geschosse as g}
													<option value={g} selected={g === raum.geschoss}>{g}</option>
												{/each}
											</select>
											<button type="submit" class="btn-sm-primary">Speichern</button>
											<button type="button" onclick={() => editId = null} class="btn-sm-secondary">Abbrechen</button>
										</form>
									</td>
								{:else}
									<td class="px-4 py-3 text-sm">{raum.name}</td>
									<td class="px-4 py-3 text-right">
										<button onclick={() => editId = raum.id} class="text-blue-600 text-sm hover:underline mr-3 transition-colors">Bearbeiten</button>
										<form method="POST" action="?/delete" use:enhance class="inline">
											<input type="hidden" name="id" value={raum.id} />
											<button type="submit" class="text-red-600 text-sm hover:underline transition-colors"
												onclick={(e) => { if (!confirm('Raum wirklich löschen?')) e.preventDefault(); }}>Löschen</button>
										</form>
									</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/each}
</div>
