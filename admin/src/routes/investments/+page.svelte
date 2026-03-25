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

  function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(n);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>Investments — OffPlan Admin</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Investments</h1>
    <p class="text-gray-500 text-sm mt-1">{data.total} total investments</p>
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
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Amount</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.investments as inv}
            <tr class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-3 px-4">
                <div class="font-medium text-gray-900">{inv.user.name}</div>
                <div class="text-gray-400 text-xs">{inv.user.email}</div>
              </td>
              <td class="py-3 px-4 text-gray-700 max-w-[180px] truncate">{inv.property.title}</td>
              <td class="py-3 px-4 text-gray-700">{inv.sharesPurchased}</td>
              <td class="py-3 px-4 font-medium">{formatCurrency(inv.totalAmount)}</td>
              <td class="py-3 px-4">
                <span class="badge-{inv.status === 'APPROVED' ? 'approved' : inv.status === 'REJECTED' ? 'rejected' : inv.status === 'PENDING' ? 'pending' : 'active'}">
                  {inv.status}
                </span>
              </td>
              <td class="py-3 px-4 text-gray-500 text-xs">{formatDate(inv.createdAt)}</td>
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
              <td colspan="7" class="py-12 text-center text-gray-400">No investments found</td>
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
