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

  function formatAmount(n: number) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return n.toString();
  }

  $: monthlyData = (stats.monthlyInvestments ?? []).slice(-6);
  $: maxAmount = Math.max(...monthlyData.map((m: any) => m.amount), 1);

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    SOLD_OUT: 'bg-red-100 text-red-800',
    COMING_SOON: 'bg-yellow-100 text-yellow-800',
    SOLD: 'bg-blue-100 text-blue-800',
    ARCHIVED: 'bg-gray-100 text-gray-800',
  };
</script>

<svelte:head>
  <title>Dashboard — OffPlan Admin</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
    <p class="text-gray-500 mt-1">Fractional Off-Plan Investment Overview</p>
  </div>

  <!-- Top Stats: 3x2 grid -->
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
    <StatCard
      title="Total Properties"
      value={stats.totalProperties ?? 0}
      icon="🏗️"
      color="blue"
    />
    <StatCard
      title="Active Properties"
      value={stats.activeProperties ?? 0}
      icon="🏢"
      color="green"
    />
    <StatCard
      title="Total Investments"
      value={stats.totalInvestments ?? 0}
      icon="💼"
      color="purple"
    />
    <StatCard
      title="Revenue"
      value={formatCurrency(stats.revenue ?? 0)}
      icon="💰"
      color="yellow"
    />
    <StatCard
      title="Total Payouts"
      value={formatCurrency(stats.totalPayouts ?? 0)}
      icon="💸"
      color="blue"
    />
    <StatCard
      title="Registered Investors"
      value={stats.totalUsers ?? 0}
      icon="👥"
      color="green"
    />
  </div>

  <!-- Monthly Investments Chart + Property Status Breakdown -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Monthly Investments Bar Chart -->
    <div class="card lg:col-span-2">
      <h2 class="text-lg font-semibold text-gray-900 mb-6">Monthly Investments</h2>
      {#if monthlyData.length === 0}
        <p class="text-gray-400 text-sm">No monthly data available.</p>
      {:else}
        <div class="space-y-4">
          {#each monthlyData as m}
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-600 font-medium w-20 shrink-0">{m.month}</span>
              <div class="flex-1">
                <div class="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    class="absolute inset-y-0 left-0 bg-primary-500 rounded-lg transition-all duration-500"
                    style="width: {Math.max((m.amount / maxAmount) * 100, 2)}%"
                  ></div>
                  <div class="absolute inset-0 flex items-center px-3">
                    <span class="text-xs font-semibold {m.amount / maxAmount > 0.4 ? 'text-white' : 'text-gray-700'}"
                      >{m.count} investments</span
                    >
                  </div>
                </div>
              </div>
              <span class="text-sm font-semibold text-gray-700 w-24 text-right shrink-0"
                >AED {formatAmount(m.amount)}</span
              >
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Property Status Breakdown -->
    <div class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-6">Property Status</h2>
      {#if (stats.propertyStatusBreakdown ?? []).length === 0}
        <p class="text-gray-400 text-sm">No data available.</p>
      {:else}
        <div class="space-y-3">
          {#each stats.propertyStatusBreakdown as item}
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-medium px-3 py-1.5 rounded-full {statusColors[item.status] ?? 'bg-gray-100 text-gray-800'}"
              >
                {item.status.replace('_', ' ')}
              </span>
              <span class="text-lg font-bold text-gray-900">{item.count}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Recent Investments Table -->
  <div class="card">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Investments</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Investor</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Property</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Amount</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {#each stats.recentInvestments ?? [] as inv}
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="py-3 px-4">
                <div class="font-medium text-gray-900">{inv.user.name}</div>
                <div class="text-gray-400 text-xs">{inv.user.email}</div>
              </td>
              <td class="py-3 px-4 text-gray-700">{inv.property.title}</td>
              <td class="py-3 px-4 text-gray-700 font-medium">{formatCurrency(inv.totalAmount ?? 0)}</td>
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

  <!-- Recent Users Table -->
  <div class="card">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Users</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Email</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Joined</th>
          </tr>
        </thead>
        <tbody>
          {#each stats.recentUsers ?? [] as user}
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="py-3 px-4 font-medium text-gray-900">{user.name}</td>
              <td class="py-3 px-4 text-gray-600">{user.email}</td>
              <td class="py-3 px-4 text-gray-500">{formatDate(user.createdAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
