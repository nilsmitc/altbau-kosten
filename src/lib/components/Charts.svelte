<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, DoughnutController, BarController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
	import type { GewerkSummary } from '$lib/domain';
	import { formatCents } from '$lib/format';

	Chart.register(DoughnutController, BarController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

	interface Props {
		summaries: GewerkSummary[];
	}

	let { summaries }: Props = $props();

	let doughnutCanvas: HTMLCanvasElement;
	let barCanvas: HTMLCanvasElement;

	const activeSummaries = $derived(summaries.filter((s) => s.ist > 0 || s.budget > 0));

	onMount(() => {
		const doughnut = new Chart(doughnutCanvas, {
			type: 'doughnut',
			data: {
				labels: activeSummaries.map((s) => s.gewerk.name),
				datasets: [{
					data: activeSummaries.map((s) => s.ist / 100),
					backgroundColor: activeSummaries.map((s) => s.gewerk.farbe)
				}]
			},
			options: {
				responsive: true,
				plugins: {
					legend: { position: 'right' },
					tooltip: {
						callbacks: {
							label: (ctx) => `${ctx.label}: ${formatCents(activeSummaries[ctx.dataIndex].ist)}`
						}
					}
				}
			}
		});

		const bar = new Chart(barCanvas, {
			type: 'bar',
			data: {
				labels: activeSummaries.map((s) => s.gewerk.name),
				datasets: [
					{
						label: 'Budget',
						data: activeSummaries.map((s) => s.budget / 100),
						backgroundColor: '#E5E7EB'
					},
					{
						label: 'Ausgaben',
						data: activeSummaries.map((s) => s.ist / 100),
						backgroundColor: activeSummaries.map((s) =>
							s.ist > s.budget && s.budget > 0 ? '#EF4444' :
							s.ist >= s.budget * 0.8 && s.budget > 0 ? '#F59E0B' : '#3B82F6'
						)
					}
				]
			},
			options: {
				responsive: true,
				plugins: {
					tooltip: {
						callbacks: {
							label: (ctx) => `${ctx.dataset.label}: ${(ctx.raw as number).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`
						}
					}
				},
				scales: {
					y: {
						ticks: {
							callback: (v) => `${(v as number).toLocaleString('de-DE')} €`
						}
					}
				}
			}
		});

		return () => {
			doughnut.destroy();
			bar.destroy();
		};
	});
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
	<div class="bg-white p-4 rounded-lg shadow-sm border">
		<h3 class="text-sm font-medium text-gray-700 mb-3">Kosten nach Gewerk</h3>
		<canvas bind:this={doughnutCanvas}></canvas>
	</div>
	<div class="bg-white p-4 rounded-lg shadow-sm border">
		<h3 class="text-sm font-medium text-gray-700 mb-3">Budget vs. Ausgaben</h3>
		<canvas bind:this={barCanvas}></canvas>
	</div>
</div>
