<script lang="ts">
  import StatCard from '$lib/components/StatCard.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  $: stats = data.stats;

  function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      maximumFractionDigits: 0,
    }).format(n);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-AE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
</script>

<svelte:head>
  <title>Dashboard — OffPlan Admin</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
    <p class="text-gray-500 mt-1">Fractional Off-Plan Investment Overview</p>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
    <StatCard
      title="Total Properties"
      value={stats.totalProperties}
      icon="🏗️"
      color="blue"
    />
    <StatCard
      title="Total Investments"
      value={stats.totalInvestments}
      icon="💼"
      color="green"
    />
    <StatCard
      title="Total Revenue"
      value={formatCurrency(stats.totalRevenue)}
      icon="💰"
      color="yellow"
    />
    <StatCard
      title="Pending Reviews"
      value={stats.pendingInvestments}
      icon="⏳"
      color="purple"
    />
  </div>

  <div class="card">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Investments</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Investor</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Property</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {#each stats.recentInvestments as inv}
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="py-3 px-4">
                <div class="font-medium text-gray-900">{inv.user.name}</div>
                <div class="text-gray-400 text-xs">{inv.user.email}</div>
              </td>
              <td class="py-3 px-4 text-gray-700">{inv.property.title}</td>
              <td class="py-3 px-4">
                <span class="badge-{inv.status.toLowerCase()}">{inv.status}</span>
              </td>
              <td class="py-3 px-4 text-gray-500">{formatDate(inv.createdAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
