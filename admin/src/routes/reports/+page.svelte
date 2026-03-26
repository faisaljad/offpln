<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
  $: reports = data.reports;

  function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      maximumFractionDigits: 0,
    }).format(n);
  }

  function approvalRate(approved: number, total: number): string {
    if (total === 0) return '0%';
    return ((approved / total) * 100).toFixed(1) + '%';
  }
</script>

<svelte:head>
  <title>Reports — OffPlan Admin</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
    <p class="text-gray-500 mt-1">Financial summaries and investment analytics</p>
  </div>

  <!-- Payment Collection -->
  <div>
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Payment Collection</h2>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="card">
        <p class="text-sm text-gray-500 font-medium">Total Due</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">
          {formatCurrency(reports.paymentCollection?.totalDue ?? 0)}
        </p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500 font-medium">Total Collected</p>
        <p class="text-2xl font-bold text-green-600 mt-1">
          {formatCurrency(reports.paymentCollection?.totalCollected ?? 0)}
        </p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500 font-medium">Collection Rate</p>
        <p class="text-2xl font-bold text-primary-600 mt-1">
          {(reports.paymentCollection?.collectionRate ?? 0).toFixed(1)}%
        </p>
      </div>
    </div>
  </div>

  <!-- Transfer Overview -->
  <div>
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Transfer Overview</h2>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
      <div class="card text-center">
        <p class="text-sm text-gray-500 font-medium">Total</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{reports.transferStats?.total ?? 0}</p>
      </div>
      <div class="card text-center">
        <p class="text-sm text-gray-500 font-medium">Completed</p>
        <p class="text-2xl font-bold mt-1">
          <span class="badge-approved">{reports.transferStats?.completed ?? 0}</span>
        </p>
      </div>
      <div class="card text-center">
        <p class="text-sm text-gray-500 font-medium">Pending</p>
        <p class="text-2xl font-bold mt-1">
          <span class="badge-pending">{reports.transferStats?.pending ?? 0}</span>
        </p>
      </div>
      <div class="card text-center">
        <p class="text-sm text-gray-500 font-medium">Rejected</p>
        <p class="text-2xl font-bold mt-1">
          <span class="badge-rejected">{reports.transferStats?.rejected ?? 0}</span>
        </p>
      </div>
    </div>
  </div>

  <!-- Investments by Property -->
  <div class="card">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Investments by Property</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Property</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Total Investments</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Total Amount</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Approved</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Approval Rate</th>
          </tr>
        </thead>
        <tbody>
          {#each reports.investmentsByProperty ?? [] as row}
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="py-3 px-4 font-medium text-gray-900">{row.propertyTitle}</td>
              <td class="py-3 px-4 text-gray-700">{row.totalInvestments}</td>
              <td class="py-3 px-4 text-gray-700 font-medium">{formatCurrency(row.totalAmount)}</td>
              <td class="py-3 px-4">
                <span class="badge-approved">{row.approvedCount}</span>
              </td>
              <td class="py-3 px-4 text-gray-700">
                {approvalRate(row.approvedCount, row.totalInvestments)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      {#if (reports.investmentsByProperty ?? []).length === 0}
        <p class="text-gray-400 text-sm text-center py-8">No investment data available.</p>
      {/if}
    </div>
  </div>

  <!-- Top Investors -->
  <div class="card">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Top Investors</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="text-left py-3 px-4 text-gray-500 font-medium">#</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Email</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Total Invested</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Investments</th>
          </tr>
        </thead>
        <tbody>
          {#each reports.topInvestors ?? [] as investor, i}
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="py-3 px-4">
                <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                  {i + 1}
                </span>
              </td>
              <td class="py-3 px-4 font-medium text-gray-900">{investor.name}</td>
              <td class="py-3 px-4 text-gray-600">{investor.email}</td>
              <td class="py-3 px-4 text-gray-700 font-medium">{formatCurrency(investor.totalAmount)}</td>
              <td class="py-3 px-4 text-gray-700">{investor.investmentCount}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      {#if (reports.topInvestors ?? []).length === 0}
        <p class="text-gray-400 text-sm text-center py-8">No investor data available.</p>
      {/if}
    </div>
  </div>
</div>
