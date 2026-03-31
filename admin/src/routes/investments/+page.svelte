<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { toast } from '$lib/stores/toast';
  import type { PageData } from './$types';

  export let data: PageData;

  let statusFilter = data.statusFilter || '';

  function onFilterChange() {
    const params = new URLSearchParams($page.url.searchParams);
    if (statusFilter) params.set('status', statusFilter);
    else params.delete('status');
    params.set('page', '1');
    goto(`?${params}`);
  }

  function fmt(n: number) {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(n);
  }
  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function getPaid(inv: any): number {
    return (inv.payments ?? []).filter((p: any) => p.status === 'PAID').reduce((s: number, p: any) => s + p.amount, 0);
  }
  function getUnpaid(inv: any): number {
    return (inv.payments ?? []).filter((p: any) => p.status !== 'PAID' && p.status !== 'WAIVED').reduce((s: number, p: any) => s + p.amount, 0);
  }
  function isSold(inv: any): boolean {
    return inv.property?.status === 'SOLD' || !!inv.payout;
  }

  $: allInv = data.investments ?? [];
  $: totalPaid = allInv.reduce((s: number, i: any) => s + getPaid(i), 0);
  $: totalUnpaid = allInv.filter((i: any) => !isSold(i)).reduce((s: number, i: any) => s + getUnpaid(i), 0);
  $: totalPayouts = allInv.filter((i: any) => i.payout).reduce((s: number, i: any) => s + (i.payout.totalReturn ?? 0), 0);
  $: totalProfit = allInv.filter((i: any) => i.payout).reduce((s: number, i: any) => s + (i.payout.profitAmount ?? 0), 0);
  $: soldCount = allInv.filter((i: any) => isSold(i)).length;
  $: activeCount = allInv.filter((i: any) => !isSold(i)).length;
</script>

<svelte:head>
  <title>Investments — OffPlan Admin</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Investments</h1>
    <p class="text-gray-500 text-sm mt-1">{data.total} total investments</p>
  </div>

  <!-- Summary Stats -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
    <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <p class="text-xs text-gray-400 font-medium mb-1">Total Paid</p>
      <p class="text-lg font-bold text-emerald-600">{fmt(totalPaid)}</p>
    </div>
    <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <p class="text-xs text-gray-400 font-medium mb-1">Total Unpaid</p>
      <p class="text-lg font-bold text-red-500">{fmt(totalUnpaid)}</p>
    </div>
    <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <p class="text-xs text-gray-400 font-medium mb-1">Total Payouts</p>
      <p class="text-lg font-bold text-blue-600">{fmt(totalPayouts)}</p>
    </div>
    <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <p class="text-xs text-gray-400 font-medium mb-1">Total Profit</p>
      <p class="text-lg font-bold text-green-600">{fmt(totalProfit)}</p>
    </div>
    <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <p class="text-xs text-gray-400 font-medium mb-1">Active</p>
      <p class="text-lg font-bold text-blue-600">{activeCount}</p>
    </div>
    <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <p class="text-xs text-gray-400 font-medium mb-1">Sold</p>
      <p class="text-lg font-bold text-amber-600">{soldCount}</p>
    </div>
  </div>

  <div class="card">
    <div class="flex gap-3 mb-6">
      <select
        bind:value={statusFilter}
        onchange={onFilterChange}
        class="input max-w-xs"
      >
        <option value="">All Status</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
        <option value="COMPLETED">Completed</option>
      </select>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Investor</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Property</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Shares</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Total</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Paid</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Unpaid</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.investments as inv}
            {@const paid = getPaid(inv)}
            {@const unpaid = getUnpaid(inv)}
            {@const sold = isSold(inv)}
            <tr class="border-b border-gray-50 hover:bg-gray-50" class:bg-emerald-50/30={sold}>
              <td class="py-3 px-4">
                <div class="font-medium text-gray-900">{inv.user.name}</div>
                <div class="text-gray-400 text-xs">{inv.user.email}</div>
              </td>
              <td class="py-3 px-4">
                <div class="text-gray-700 max-w-[180px] truncate">{inv.property.title}</div>
                {#if sold}
                  <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">SOLD</span>
                {/if}
              </td>
              <td class="py-3 px-4 text-gray-700">{inv.sharesPurchased}</td>
              <td class="py-3 px-4 font-medium">{fmt(inv.totalAmount)}</td>
              <td class="py-3 px-4 font-medium text-emerald-600">{fmt(paid)}</td>
              <td class="py-3 px-4 font-medium {sold ? 'text-gray-300 line-through' : 'text-red-500'}">
                {#if sold && inv.payout}
                  —
                {:else}
                  {fmt(unpaid)}
                {/if}
              </td>
              <td class="py-3 px-4">
                {#if sold && inv.payout}
                  <div class="space-y-1">
                    <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {inv.payout.status}
                    </span>
                    <div class="text-xs text-emerald-600 font-medium">+{fmt(inv.payout.profitAmount)}</div>
                  </div>
                {:else}
                  <span class="badge-{inv.status === 'APPROVED' ? 'approved' : inv.status === 'REJECTED' ? 'rejected' : inv.status === 'PENDING' ? 'pending' : 'active'}">
                    {inv.status}
                  </span>
                {/if}
              </td>
              <td class="py-3 px-4 text-gray-500 text-xs">{fmtDate(inv.createdAt)}</td>
              <td class="py-3 px-4">
                <div class="flex gap-2">
                  <a href="/investments/{inv.id}" class="text-primary-600 hover:underline text-xs">View</a>
                  {#if inv.status === 'PENDING'}
                    <form method="POST" action="?/approve" use:enhance={() => ({ update }) => { toast.success('Approved'); update(); }}>
                      <input type="hidden" name="id" value={inv.id} />
                      <button type="submit" class="text-green-600 hover:underline text-xs">Approve</button>
                    </form>
                    <form method="POST" action="?/reject" use:enhance={() => ({ update }) => { toast.error('Rejected'); update(); }}>
                      <input type="hidden" name="id" value={inv.id} />
                      <button type="submit" class="text-red-500 hover:underline text-xs">Reject</button>
                    </form>
                  {/if}
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="9" class="py-12 text-center text-gray-400">No investments found</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if data.pages > 1}
      <div class="flex justify-center gap-2 mt-6">
        {#each Array(data.pages) as _, i}
          <a
            href="?page={i + 1}{statusFilter ? `&status=${statusFilter}` : ''}"
            class="px-3 py-1.5 rounded-lg text-sm font-medium"
            class:bg-primary-600={data.page === i + 1}
            class:text-white={data.page === i + 1}
            class:bg-gray-100={data.page !== i + 1}
          >{i + 1}</a>
        {/each}
      </div>
    {/if}
  </div>
</div>
