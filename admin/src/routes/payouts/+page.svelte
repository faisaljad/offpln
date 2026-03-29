<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { toast } from '$lib/stores/toast';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  $: stats = data.stats;
  $: payouts = data.payouts ?? [];
  $: currentStatus = data.status || '';

  $: if (form?.success) {
    toast.success('Payout marked as paid');
    showModal = false;
    invalidateAll();
  }
  $: if (form?.error) toast.error((form as any).error);

  let showModal = false;
  let selectedPayout: any = null;
  let receiptFile: FileList | null = null;

  function openModal(payout: any) {
    selectedPayout = payout;
    receiptFile = null;
    showModal = true;
  }

  function setFilter(status: string) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    goto(`/payouts${params.toString() ? '?' + params.toString() : ''}`);
  }

  function fmt(n: number) {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(n);
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>Investor Payouts — OffPlan Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Investor Payouts</h1>
    <p class="text-sm text-gray-500 mt-1">Manage profit distributions to investors</p>
  </div>

  <!-- Stats Row -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Count</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{stats.totalPending}</p>
    </div>
    <div class="card">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Paid Count</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{stats.totalPaid}</p>
    </div>
    <div class="card">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Amount</p>
      <p class="text-2xl font-bold text-yellow-600 mt-1">{fmt(stats.pendingAmount)}</p>
    </div>
    <div class="card">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Paid Amount</p>
      <p class="text-2xl font-bold text-emerald-600 mt-1">{fmt(stats.paidAmount)}</p>
    </div>
  </div>

  <!-- Filter Tabs -->
  <div class="flex gap-2">
    <button
      type="button"
      onclick={() => setFilter('')}
      class="px-4 py-2 rounded-full text-sm font-semibold transition-colors {currentStatus === '' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
    >
      All
    </button>
    <button
      type="button"
      onclick={() => setFilter('PENDING')}
      class="px-4 py-2 rounded-full text-sm font-semibold transition-colors {currentStatus === 'PENDING' ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'}"
    >
      Pending
    </button>
    <button
      type="button"
      onclick={() => setFilter('PAID')}
      class="px-4 py-2 rounded-full text-sm font-semibold transition-colors {currentStatus === 'PAID' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}"
    >
      Paid
    </button>
  </div>

  <!-- Payouts Table -->
  {#if payouts.length === 0}
    <div class="card text-center py-16">
      <p class="text-4xl mb-3">📋</p>
      <p class="text-gray-500 font-medium">No payouts found</p>
      <p class="text-gray-400 text-sm mt-1">
        {#if currentStatus}No {currentStatus.toLowerCase()} payouts{:else}No payouts to display{/if}
      </p>
    </div>
  {:else}
    <div class="card overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 text-left">
            <th class="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Investor</th>
            <th class="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Property</th>
            <th class="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Stake</th>
            <th class="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Invested</th>
            <th class="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Profit</th>
            <th class="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Total Return</th>
            <th class="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
            <th class="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Receipt</th>
            <th class="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          {#each payouts as payout}
            <tr class="hover:bg-gray-50/50">
              <!-- Investor -->
              <td class="py-3 pr-3">
                <p class="font-medium text-gray-900">{payout.user?.name ?? '—'}</p>
                <p class="text-xs text-gray-400">{payout.user?.email ?? ''}</p>
              </td>
              <!-- Property -->
              <td class="py-3 pr-3">
                <p class="font-medium text-gray-800 truncate max-w-[180px]">{payout.property?.title ?? '—'}</p>
                <p class="text-xs text-gray-400">{payout.property?.location ?? ''}</p>
              </td>
              <!-- Stake -->
              <td class="py-3 pr-3 whitespace-nowrap">
                {(payout.investment?.sharesPurchased ?? 0) * 10}%
              </td>
              <!-- Invested -->
              <td class="py-3 pr-3 whitespace-nowrap">
                {fmt(payout.investment?.totalAmount ?? 0)}
              </td>
              <!-- Profit -->
              <td class="py-3 pr-3 whitespace-nowrap text-emerald-600 font-semibold">
                {fmt(payout.profitAmount)}
              </td>
              <!-- Total Return -->
              <td class="py-3 pr-3 whitespace-nowrap font-bold text-gray-900">
                {fmt(payout.totalReturn)}
              </td>
              <!-- Status -->
              <td class="py-3 pr-3">
                {#if payout.status === 'PAID'}
                  <span class="badge-approved">PAID</span>
                {:else}
                  <span class="badge-pending">PENDING</span>
                {/if}
              </td>
              <!-- Receipt -->
              <td class="py-3 pr-3">
                {#if payout.receiptUrl}
                  <a href={payout.receiptUrl} target="_blank" class="text-blue-600 hover:underline text-xs">
                    View
                  </a>
                {:else}
                  <span class="text-gray-300">—</span>
                {/if}
              </td>
              <!-- Action -->
              <td class="py-3">
                {#if payout.status === 'PENDING'}
                  <button
                    type="button"
                    onclick={() => openModal(payout)}
                    class="btn-primary text-xs px-3 py-1.5"
                  >
                    Mark as Paid
                  </button>
                {:else}
                  <span class="text-xs text-gray-400">{payout.paidAt ? fmtDate(payout.paidAt) : '—'}</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- Mark as Paid Modal -->
{#if showModal && selectedPayout}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md">
      <div class="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 class="text-lg font-bold text-gray-900">Mark Payout as Paid</h2>
        <button type="button" onclick={() => showModal = false} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
      </div>

      <form
        method="POST"
        action="?/markPaid"
        enctype="multipart/form-data"
        use:enhance
        class="p-6 space-y-5"
      >
        <input type="hidden" name="id" value={selectedPayout.id} />

        <!-- Summary -->
        <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
          <div class="flex justify-between items-start">
            <div>
              <p class="font-semibold text-gray-900">{selectedPayout.user?.name}</p>
              <p class="text-xs text-gray-500">{selectedPayout.user?.email}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-xs text-gray-400">Property</p>
              <p class="font-medium text-gray-800">{selectedPayout.property?.title}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Stake</p>
              <p class="font-medium text-gray-800">{(selectedPayout.investment?.sharesPurchased ?? 0) * 10}%</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Profit</p>
              <p class="font-semibold text-emerald-600">{fmt(selectedPayout.profitAmount)}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Total Return</p>
              <p class="font-bold text-gray-900">{fmt(selectedPayout.totalReturn)}</p>
            </div>
          </div>
        </div>

        <!-- Receipt upload -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2" for="receiptFile">
            Upload Receipt <span class="text-gray-400 font-normal">(optional)</span>
          </label>
          <label
            for="receiptFile"
            class="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
          >
            {#if receiptFile && receiptFile.length > 0}
              <div class="text-center">
                <p class="text-sm font-semibold text-emerald-600">{receiptFile[0].name}</p>
                <p class="text-xs text-gray-400 mt-1">{(receiptFile[0].size / 1024).toFixed(1)} KB</p>
              </div>
            {:else}
              <div class="text-center">
                <p class="text-2xl mb-1">📎</p>
                <p class="text-sm text-gray-500">Drop file here or click to upload</p>
                <p class="text-xs text-gray-400 mt-1">PDF, JPG, PNG</p>
              </div>
            {/if}
          </label>
          <input
            id="receiptFile"
            type="file"
            name="receipt"
            accept=".pdf,.jpg,.jpeg,.png"
            bind:files={receiptFile}
            class="hidden"
          />
        </div>

        <p class="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          This will mark the payout as <strong>PAID</strong> and notify the investor.
        </p>

        {#if form?.error}
          <p class="text-red-500 text-sm">{(form as any).error}</p>
        {/if}

        <div class="flex gap-3 pt-2">
          <button type="button" onclick={() => showModal = false}
            class="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit"
            class="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">
            Confirm Payment
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
