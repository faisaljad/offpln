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

  <!-- Monthly Investments Line Chart -->
  <div class="card">
    <h2 class="text-lg font-semibold text-gray-900 mb-6">Monthly Investments</h2>
    {#if monthlyData.length === 0}
      <p class="text-gray-400 text-sm">No monthly data available.</p>
    {:else}
      <div style="height: 260px; position: relative;">
        <!-- Y-axis labels -->
        <div style="position: absolute; left: 0; top: 0; bottom: 32px; width: 60px; display: flex; flex-direction: column; justify-content: space-between;">
          {#each [maxAmount, Math.round(maxAmount * 0.66), Math.round(maxAmount * 0.33), 0] as tick}
            <span style="font-size: 11px; color: #94a3b8; text-align: right; padding-right: 8px;">AED {formatAmount(tick)}</span>
          {/each}
        </div>
        <!-- Chart area -->
        <div style="position: absolute; left: 64px; right: 0; top: 0; bottom: 32px; border-left: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
          <!-- Grid lines -->
          {#each [0.33, 0.66] as pct}
            <div style="position: absolute; left: 0; right: 0; bottom: {pct * 100}%; height: 1px; background: #f1f5f9;"></div>
          {/each}
          <!-- Line + Points -->
          <svg viewBox="0 0 {monthlyData.length * 100} 200" preserveAspectRatio="none" style="width: 100%; height: 100%; overflow: visible;">
            <!-- Area fill -->
            <path
              d="M {monthlyData.map((m, i) => `${i * (100 * monthlyData.length / monthlyData.length) / monthlyData.length * monthlyData.length + 50} ${200 - (m.amount / maxAmount) * 190}`).join(' L ')} L {(monthlyData.length - 1) * 100 + 50} 200 L 50 200 Z"
              fill="url(#areaGrad)" opacity="0.15"
            />
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#0284c7" />
                <stop offset="100%" stop-color="#0284c7" stop-opacity="0" />
              </linearGradient>
            </defs>
            <!-- Line -->
            <polyline
              points={monthlyData.map((m, i) => `${i * 100 + 50},${200 - (m.amount / maxAmount) * 190}`).join(' ')}
              fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
            />
            <!-- Points -->
            {#each monthlyData as m, i}
              <circle cx={i * 100 + 50} cy={200 - (m.amount / maxAmount) * 190} r="5" fill="#fff" stroke="#0284c7" stroke-width="2.5" />
            {/each}
          </svg>
          <!-- Tooltips on hover -->
          <div style="position: absolute; inset: 0; display: flex;">
            {#each monthlyData as m, i}
              <div style="flex: 1; position: relative; cursor: pointer;" class="group">
                <div style="display: none; position: absolute; bottom: {(m.amount / maxAmount) * 100 + 8}%; left: 50%; transform: translateX(-50%); background: #0f172a; color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 11px; white-space: nowrap; z-index: 10;" class="group-hover:!block">
                  {m.count} inv · AED {formatAmount(m.amount)}
                </div>
              </div>
            {/each}
          </div>
        </div>
        <!-- X-axis labels -->
        <div style="position: absolute; left: 64px; right: 0; bottom: 0; height: 28px; display: flex;">
          {#each monthlyData as m}
            <div style="flex: 1; text-align: center; font-size: 12px; color: #64748b; font-weight: 500; padding-top: 8px;">
              {m.month}
            </div>
          {/each}
        </div>
      </div>
    {/if}
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
