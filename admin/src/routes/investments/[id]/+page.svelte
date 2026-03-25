<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { toast } from '$lib/stores/toast';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  $: inv = data.investment;

  $: if (form?.success) {
    if ((form as any).action === 'payment') {
      toast.success('Payment updated');
    } else {
      toast.success(`Investment ${(form as any).action ?? 'updated'}`);
    }
    showPaymentModal = false;
    invalidateAll();
  }
  $: if (form?.error) toast.error((form as any).error);

  // Payment edit modal
  let showPaymentModal = false;
  let selectedPayment: any = null;
  let proofFile: FileList | null = null;

  function openPaymentModal(payment: any) {
    selectedPayment = { ...payment };
    proofFile = null;
    showPaymentModal = true;
  }

  function fmt(n: number) {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(n);
  }
  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const statusColor: Record<string, string> = {
    PENDING:   'badge-pending',
    APPROVED:  'badge-approved',
    REJECTED:  'badge-rejected',
    COMPLETED: 'badge-active',
  };
  const payStatusColor: Record<string, string> = {
    PENDING: 'badge-pending',
    PAID:    'badge-approved',
    OVERDUE: 'badge-rejected',
    WAIVED:  'badge-active',
  };
  const payStatuses = ['PENDING', 'PAID', 'OVERDUE', 'WAIVED'];
</script>

<svelte:head>
  <title>Investment #{inv.id.slice(0, 8)} — OffPlan Admin</title>
</svelte:head>

<div class="space-y-6 max-w-4xl">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/investments" class="text-gray-400 hover:text-gray-600">← Investments</a>
      <h1 class="text-2xl font-bold text-gray-900">Investment Detail</h1>
      <span class={statusColor[inv.status] ?? 'badge-pending'}>{inv.status}</span>
    </div>
    {#if inv.status === 'PENDING'}
      <div class="flex gap-3">
        <form method="POST" action="?/approve" use:enhance={() => async ({ update }) => { await update(); await invalidateAll(); }}>
          <button type="submit" class="btn-primary">Approve</button>
        </form>
        <form method="POST" action="?/reject" use:enhance={() => async ({ update }) => { await update(); await invalidateAll(); }}>
          <button type="submit" class="btn-danger">Reject</button>
        </form>
      </div>
    {/if}
  </div>

  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
    <!-- Investor Info -->
    <div class="card space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">Investor</h2>
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-600">
          {inv.user.name[0]}
        </div>
        <div>
          <p class="font-semibold text-gray-900">{inv.user.name}</p>
          <p class="text-sm text-gray-500">{inv.user.email}</p>
          {#if inv.user.phone}<p class="text-sm text-gray-500">{inv.user.phone}</p>{/if}
        </div>
      </div>
      <a href="/investors/{inv.user.id}" class="text-primary-600 text-sm hover:underline">View investor profile →</a>
    </div>

    <!-- Property Info -->
    <div class="card space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">Property</h2>
      {#if inv.property.images?.[0]}
        <img src={inv.property.images[0]} alt={inv.property.title} class="w-full h-32 object-cover rounded-xl" />
      {/if}
      <p class="font-semibold text-gray-900">{inv.property.title}</p>
      <p class="text-sm text-gray-500">{inv.property.location}</p>
      <a href="/properties/{inv.property.id}" class="text-primary-600 text-sm hover:underline">View property →</a>
    </div>

    <!-- Investment Summary -->
    <div class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Investment Summary</h2>
      <div class="space-y-3">
        {#each [
          { label: 'Stake Purchased', value: `${inv.sharesPurchased * 10}% (${inv.sharesPurchased} shares)` },
          { label: 'Total Amount',    value: fmt(inv.totalAmount) },
          { label: 'Price / Share',   value: fmt(inv.property.pricePerShare) },
          { label: 'Investment Date', value: fmtDate(inv.createdAt) },
          { label: 'Status',          value: inv.status },
        ] as row}
          <div class="flex justify-between text-sm border-b border-gray-50 pb-2">
            <span class="text-gray-500">{row.label}</span>
            <span class="font-medium text-gray-900">{row.value}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Payment Schedule -->
    <div class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Payment Schedule</h2>
      {#if inv.payments?.length}
        <div class="space-y-2">
          {#each inv.payments as payment}
            <div class="flex items-center justify-between py-2 border-b border-gray-50 gap-3">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800">{payment.name}</p>
                <p class="text-xs text-gray-400">
                  {#if payment.dueDate}Due {fmtDate(payment.dueDate)}{/if}
                  {#if payment.milestone}On {payment.milestone}{/if}
                  {#if payment.paidAt} · Paid {fmtDate(payment.paidAt)}{/if}
                </p>
                {#if payment.proofUrl}
                  <a href={payment.proofUrl} target="_blank" class="text-xs text-primary-600 hover:underline">
                    📎 View proof
                  </a>
                {/if}
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-sm font-semibold text-gray-900">{fmt(payment.amount)}</p>
                <span class={payStatusColor[payment.status] ?? 'badge-pending'}>{payment.status}</span>
              </div>
              <button
                type="button"
                onclick={() => openPaymentModal(payment)}
                class="px-2 py-1 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 flex-shrink-0"
              >
                Edit
              </button>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-gray-400 text-sm text-center py-6">No payment records</p>
      {/if}
    </div>
  </div>

  {#if inv.notes}
    <div class="card">
      <h2 class="text-sm font-semibold text-gray-700 mb-2">Notes</h2>
      <p class="text-gray-600 text-sm">{inv.notes}</p>
    </div>
  {/if}
</div>

<!-- ── Edit Payment Modal ───────────────────────────────────────────── -->
{#if showPaymentModal && selectedPayment}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md">
      <div class="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 class="text-lg font-bold text-gray-900">Edit Payment</h2>
        <button type="button" onclick={() => showPaymentModal = false} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
      </div>

      <form
        method="POST"
        action="?/updatePayment"
        enctype="multipart/form-data"
        use:enhance
        class="p-6 space-y-5"
      >
        <input type="hidden" name="paymentId" value={selectedPayment.id} />

        <!-- Payment summary -->
        <div class="bg-gray-50 rounded-xl p-4 space-y-1">
          <p class="font-semibold text-gray-900">{selectedPayment.name}</p>
          <div class="flex items-center justify-between mt-1">
            <span class="text-sm text-gray-500">{fmt(selectedPayment.amount)}</span>
            {#if selectedPayment.dueDate}
              <span class="text-xs text-gray-400">Due {fmtDate(selectedPayment.dueDate)}</span>
            {/if}
          </div>
          {#if selectedPayment.proofUrl}
            <a href={selectedPayment.proofUrl} target="_blank" class="text-xs text-primary-600 hover:underline">
              📎 Current proof of payment
            </a>
          {/if}
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2" for="payStatus">
            Payment Status <span class="text-red-500">*</span>
          </label>
          <select
            id="payStatus"
            name="status"
            bind:value={selectedPayment.status}
            class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 bg-white"
          >
            {#each payStatuses as s}
              <option value={s}>{s}</option>
            {/each}
          </select>
        </div>

        <!-- Proof of payment upload -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2" for="proof">
            Proof of Payment <span class="text-gray-400 font-normal">(optional)</span>
          </label>
          <label
            for="proof"
            class="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            {#if proofFile && proofFile.length > 0}
              <div class="text-center">
                <p class="text-sm font-semibold text-blue-600">📄 {proofFile[0].name}</p>
                <p class="text-xs text-gray-400 mt-1">{(proofFile[0].size / 1024).toFixed(1)} KB</p>
              </div>
            {:else}
              <div class="text-center">
                <p class="text-2xl mb-1">📎</p>
                <p class="text-sm text-gray-500">Click to upload proof</p>
                <p class="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
              </div>
            {/if}
          </label>
          <input
            id="proof"
            type="file"
            name="proof"
            accept=".pdf,.jpg,.jpeg,.png"
            bind:files={proofFile}
            class="hidden"
          />
        </div>

        {#if form?.error}
          <p class="text-red-500 text-sm">{(form as any).error}</p>
        {/if}

        <div class="flex gap-3 pt-2">
          <button type="button" onclick={() => showPaymentModal = false}
            class="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit"
            class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
            ✓ Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
