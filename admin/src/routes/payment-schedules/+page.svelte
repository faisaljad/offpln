<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  export let data: PageData;
  $: stats = data.stats;
  $: payments = data.payments ?? [];
  $: currentStatus = data.currentStatus ?? '';

  const filters = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Overdue', value: 'OVERDUE' },
  ];

  function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      maximumFractionDigits: 0,
    }).format(n);
  }

  function formatDate(d: string | null) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-AE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function setFilter(value: string) {
    const params = new URLSearchParams();
    if (value) params.set('status', value);
    goto(`/payment-schedules${params.toString() ? '?' + params.toString() : ''}`);
  }

  const statusBadge: Record<string, string> = {
    PENDING: 'badge-pending',
    PAID: 'badge-approved',
    OVERDUE: 'badge-rejected',
    UNDER_REVIEW: 'badge-active',
  };
</script>

<svelte:head>
  <title>Payment Schedules — OffPlan Admin</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Payment Schedules</h1>
    <p class="text-gray-500 mt-1">Track and manage investor payment milestones</p>
  </div>

  <!-- Stats Row -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
    <div class="card text-center">
      <div class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-yellow-50 text-yellow-600 text-xl mb-2">
        ⏳
      </div>
      <p class="text-sm text-gray-500 font-medium">Pending</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{stats?.totalPending ?? 0}</p>
    </div>
    <div class="card text-center">
      <div class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 text-green-600 text-xl mb-2">
        ✅
      </div>
      <p class="text-sm text-gray-500 font-medium">Paid</p>
      <p class="text-2xl font-bold text-green-600 mt-1">{stats?.totalPaid ?? 0}</p>
    </div>
    <div class="card text-center">
      <div class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-red-600 text-xl mb-2">
        ⚠️
      </div>
      <p class="text-sm text-gray-500 font-medium">Overdue</p>
      <p class="text-2xl font-bold text-red-600 mt-1">{stats?.totalOverdue ?? 0}</p>
    </div>
    <div class="card text-center">
      <div class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 text-xl mb-2">
        📅
      </div>
      <p class="text-sm text-gray-500 font-medium">Upcoming This Month</p>
      <p class="text-2xl font-bold text-blue-600 mt-1">{stats?.upcomingThisMonth ?? 0}</p>
    </div>
  </div>

  <!-- Filter Tabs -->
  <div class="flex gap-2 flex-wrap">
    {#each filters as f}
      <button
        onclick={() => setFilter(f.value)}
        class="px-4 py-2 rounded-full text-sm font-medium transition-colors
          {currentStatus === f.value
          ? 'bg-primary-600 text-white'
          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}"
      >
        {f.label}
      </button>
    {/each}
  </div>

  <!-- Payments Table -->
  <div class="card">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Investor</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Property</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Payment</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Amount</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Due Date</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Paid Date</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Proof</th>
          </tr>
        </thead>
        <tbody>
          {#each payments as p}
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="py-3 px-4">
                <div class="font-medium text-gray-900">{p.investment?.user?.name ?? '-'}</div>
                <div class="text-gray-400 text-xs">{p.investment?.user?.email ?? ''}</div>
              </td>
              <td class="py-3 px-4 text-gray-700">{p.investment?.property?.title ?? '-'}</td>
              <td class="py-3 px-4 text-gray-700">{p.name}</td>
              <td class="py-3 px-4 text-gray-700 font-medium">{formatCurrency(p.amount)}</td>
              <td class="py-3 px-4 text-gray-500">{formatDate(p.dueDate)}</td>
              <td class="py-3 px-4">
                <span class="{statusBadge[p.status] ?? 'badge-pending'}">{p.status}</span>
              </td>
              <td class="py-3 px-4 text-gray-500">{formatDate(p.paidAt)}</td>
              <td class="py-3 px-4">
                <div class="flex gap-2">
                  {#if p.proofUrl}
                    <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:underline text-xs">Admin</a>
                  {/if}
                  {#if p.investorProofUrl}
                    <a href={p.investorProofUrl} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline text-xs">Investor</a>
                  {/if}
                  {#if !p.proofUrl && !p.investorProofUrl}
                    <span class="text-gray-400 text-xs">-</span>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      {#if payments.length === 0}
        <p class="text-gray-400 text-sm text-center py-8">No payment schedules found.</p>
      {/if}
    </div>
  </div>
</div>
