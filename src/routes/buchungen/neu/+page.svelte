<script lang="ts">
	import BuchungForm from '$lib/components/BuchungForm.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">Neue Buchung</h1>
	<BuchungForm
		gewerke={data.gewerke}
		raeume={data.raeume}
		values={form?.values}
		defaultGewerk={data.lastGewerk}
		error={form?.error}
		submitLabel="Buchung anlegen"
	/>
</div>
