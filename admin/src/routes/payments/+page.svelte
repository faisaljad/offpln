<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { toast } from '$lib/stores/toast';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  $: payments = data.payments ?? [];

  $: if (form?.success) {
    const action = (form as any).action;
    toast.success(action === 'approve' ? 'Payment approved ✓' : 'Payment rejected');
    showApproveModal = false;
    invalidateAll();
  }
  $: if (form?.error) toast.error((form as any).error);

  // Approve modal
  let showApproveModal = false;
  let selectedPayment: any = null;
  let proofFile: FileList | null = null;

  function openApproveModal(payment: any) {
    selectedPayment = payment;
    proofFile = null;
    showApproveModal = true;
  }

  function fmt(n: number) {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(n);
  }
  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtDateTime(d: string) {
    return new Date(d).toLocaleString('en-AE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
</script>

<svelte:head>
  <title>Payment Reviews — OffPlan Admin</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Payment Reviews</h1>
      <p class="text-sm text-gray-500 mt-1">Investor-submitted payment proofs awaiting approval</p>
    </div>
    <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
      {payments.length} pending
    </span>
  </div>

  {#if payments.length === 0}
    <div class="card text-center py-16">
      <p class="text-4xl mb-3">✅</p>
      <p class="text-gray-500 font-medium">No payments awaiting review</p>
      <p class="text-gray-400 text-sm mt-1">All investor payment proofs have been processed</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each payments as payment}
        <div class="card">
          <div class="flex items-start justify-between gap-4">
            <!-- Left: investor + property info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-base font-bold text-blue-600 flex-shrink-0">
                  {payment.investment?.user?.name?.[0] ?? '?'}
                </div>
                <div>
                  <p class="font-semibold text-gray-900">{payment.investment?.user?.name}</p>
                  <p class="text-xs text-gray-400">{payment.investment?.user?.email}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
                <div>
                  <span class="text-gray-400 text-xs">Property</span>
                  <p class="font-medium text-gray-800 truncate">{payment.investment?.property?.title}</p>
                </div>
                <div>
                  <span class="text-gray-400 text-xs">Payment</span>
                  <p class="font-medium text-gray-800">{payment.name}</p>
                </div>
                <div>
                  <span class="text-gray-400 text-xs">Amount</span>
                  <p class="font-bold text-gray-900">{fmt(payment.amount)}</p>
                </div>
                <div>
                  <span class="text-gray-400 text-xs">Submitted</span>
                  <p class="text-gray-600">{fmtDateTime(payment.updatedAt)}</p>
                </div>
                {#if payment.dueDate}
                  <div>
                    <span class="text-gray-400 text-xs">Due Date</span>
                    <p class="text-gray-600">{fmtDate(payment.dueDate)}</p>
                  </div>
                {/if}
              </div>

              <!-- Investor's proof -->
              {#if payment.investorProofUrl}
                <a
                  href={payment.investorProofUrl}
                  target="_blank"
                  class="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  📎 View investor's proof of payment
                </a>
              {/if}
            </div>

            <!-- Right: actions -->
            <div class="flex flex-col gap-2 flex-shrink-0">
              <button
                type="button"
                onclick={() => openApproveModal(payment)}
                class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 flex items-center gap-1"
              >
                ✓ Approve
              </button>

              <form method="POST" action="?/reject" use:enhance>
                <input type="hidden" name="id" value={payment.id} />
                <button
                  type="submit"
                  class="w-full px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100"
                >
                  ✕ Reject
                </button>
              </form>

              <a
                href="/investments/{payment.investment?.id}"
                class="px-4 py-2 text-center border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                View Investment
              </a>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- ── Approve Modal ─────────────────────────────────────────────────── -->
{#if showApproveModal && selectedPayment}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md">
      <div class="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 class="text-lg font-bold text-gray-900">Approve Payment</h2>
        <button type="button" onclick={() => showApproveModal = false} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
      </div>

      <form
        method="POST"
        action="?/approve"
        enctype="multipart/form-data"
        use:enhance
        class="p-6 space-y-5"
      >
        <input type="hidden" name="id" value={selectedPayment.id} />

        <!-- Summary -->
        <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2">
          <div class="flex justify-between items-center">
            <div>
              <p class="font-semibold text-gray-900">{selectedPayment.investment?.user?.name}</p>
              <p class="text-xs text-gray-500">{selectedPayment.name}</p>
            </div>
            <p class="font-bold text-emerald-700 text-lg">{fmt(selectedPayment.amount)}</p>
          </div>
          {#if selectedPayment.investorProofUrl}
            <a href={selectedPayment.investorProofUrl} target="_blank" class="text-xs text-blue-600 hover:underline">
              📎 View investor's submitted proof
            </a>
          {/if}
        </div>

        <!-- Admin proof upload (optional) -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2" for="adminProof">
            Upload Admin Receipt <span class="text-gray-400 font-normal">(optional)</span>
          </label>
          <label
            for="adminProof"
            class="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
          >
            {#if proofFile && proofFile.length > 0}
              <div class="text-center">
                <p class="text-sm font-semibold text-emerald-600">📄 {proofFile[0].name}</p>
                <p class="text-xs text-gray-400 mt-1">{(proofFile[0].size / 1024).toFixed(1)} KB</p>
              </div>
            {:else}
              <div class="text-center">
                <p class="text-2xl mb-1">📎</p>
                <p class="text-sm text-gray-500">Click to upload receipt</p>
                <p class="text-xs text-gray-400 mt-1">PDF, JPG, PNG</p>
              </div>
            {/if}
          </label>
          <input
            id="adminProof"
            type="file"
            name="proof"
            accept=".pdf,.jpg,.jpeg,.png"
            bind:files={proofFile}
            class="hidden"
          />
        </div>

        <p class="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          Approving will mark this payment as <strong>PAID</strong> and set today as the payment date.
        </p>

        {#if form?.error}
          <p class="text-red-500 text-sm">{(form as any).error}</p>
        {/if}

        <div class="flex gap-3 pt-2">
          <button type="button" onclick={() => showApproveModal = false}
            class="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit"
            class="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">
            ✓ Approve Payment
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
