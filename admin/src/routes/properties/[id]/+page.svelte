<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { toast } from '$lib/stores/toast';
  import type { PageData, ActionData } from './$types';
  export let data: PageData;
  export let form: ActionData;

  $: if (form?.success) {
    toast.success(form.action === 'sold' ? 'Property marked as SOLD' : 'Payout marked as paid');
    showSoldModal   = false;
    showPayoutModal = false;
    invalidateAll();
  }
  $: if (form?.error) toast.error(form.error);

  $: p = data.property;
  $: soldPct = ((p.totalShares - p.availableShares) / p.totalShares) * 100;

  // Payment plan tabs
  $: paymentPlanNames = [
    ...(p.paymentPlan?.downPayment ? ['Down Payment'] : []),
    ...(p.paymentPlan?.installments ?? []).map((inst: any) => inst.name),
  ];
  let selectedPlanTab = '';
  $: if (paymentPlanNames.length > 0 && !paymentPlanNames.includes(selectedPlanTab)) {
    selectedPlanTab = paymentPlanNames[0];
  }

  // Modals
  let showSoldModal   = false;
  let sellingPrice    = String(Math.round(data.property.totalPrice));

  let showPayoutModal = false;
  let selectedPayout: any = null;
  let receiptFile: FileList | null = null;

  function openPayoutModal(payout: any) {
    selectedPayout = payout;
    receiptFile    = null;
    showPayoutModal = true;
  }

  function fmt(n: number) {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(n);
  }
  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const statusColor: Record<string, string> = {
    ACTIVE:      'badge-approved',
    SOLD_OUT:    'badge-rejected',
    COMING_SOON: 'badge-pending',
    ARCHIVED:    'badge-pending',
    SOLD:        'badge-active',
  };
  const invStatusColor: Record<string, string> = {
    PENDING:   'badge-pending',
    APPROVED:  'badge-approved',
    REJECTED:  'badge-rejected',
    COMPLETED: 'badge-active',
  };
</script>

<svelte:head>
  <title>{p.title} — OffPlan Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/properties" class="text-gray-400 hover:text-gray-600">← Properties</a>
      <h1 class="text-2xl font-bold text-gray-900">{p.title}</h1>
      <span class={statusColor[p.status] ?? 'badge-pending'}>{p.status}</span>
    </div>
    <div class="flex gap-3">
      {#if p.status !== 'SOLD'}
        <button
          type="button"
          onclick={() => showSoldModal = true}
          class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
        >
          🏷️ Mark as Sold
        </button>
      {/if}
      <a href="/properties/{p.id}/edit" class="btn-primary">Edit Property</a>
    </div>
  </div>

  {#if p.status === 'SOLD' && p.soldPrice}
    <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <span class="text-lg">✓</span>
        </div>
        <div>
          <h2 class="text-lg font-bold text-emerald-800">Property Sold</h2>
          <p class="text-sm text-emerald-600">This property has been sold and ROI payouts have been created.</p>
        </div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg p-4 text-center">
          <p class="text-xs text-gray-500 mb-1">Original Price</p>
          <p class="text-lg font-bold text-gray-900">{fmt(p.totalPrice)}</p>
        </div>
        <div class="bg-white rounded-lg p-4 text-center">
          <p class="text-xs text-gray-500 mb-1">Sold For</p>
          <p class="text-lg font-bold text-emerald-700">{fmt(p.soldPrice)}</p>
        </div>
        <div class="bg-white rounded-lg p-4 text-center">
          <p class="text-xs text-gray-500 mb-1">Gain</p>
          <p class="text-lg font-bold {p.soldPrice >= p.totalPrice ? 'text-emerald-700' : 'text-red-600'}">
            {fmt(p.soldPrice - p.totalPrice)}
          </p>
        </div>
        <div class="bg-white rounded-lg p-4 text-center">
          <p class="text-xs text-gray-500 mb-1">Profit Rate</p>
          <p class="text-lg font-bold {p.soldPrice >= p.totalPrice ? 'text-emerald-700' : 'text-red-600'}">
            {(((p.soldPrice - p.totalPrice) / p.totalPrice) * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  {/if}

  <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <!-- Left col -->
    <div class="xl:col-span-2 space-y-6">

      <!-- Images -->
      {#if p.images?.length}
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Images</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {#each p.images as img}
              <img src={img} alt={p.title} class="w-full h-36 object-cover rounded-xl" />
            {/each}
          </div>
        </div>
      {/if}

      <!-- Description -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Description</h2>
        <div class="text-gray-600 leading-relaxed prose prose-sm max-w-none">{@html p.description}</div>
      </div>

      <!-- Payment Plan with Investor Status -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Payment Schedule</h2>

        {#if paymentPlanNames.length > 0}
          <!-- Tabs -->
          <div class="flex flex-wrap gap-2 mb-4 border-b border-gray-100 pb-3">
            {#each paymentPlanNames as planName, i}
              <button
                type="button"
                onclick={() => selectedPlanTab = planName}
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors {selectedPlanTab === planName ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
              >
                {planName}
              </button>
            {/each}
          </div>

          <!-- Investor payments for selected tab -->
          {#if data.investments.length === 0}
            <p class="text-gray-400 text-sm py-6 text-center">No investors yet</p>
          {:else}
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-100">
                    <th class="text-left py-2 px-3 text-gray-500 font-medium">Investor</th>
                    <th class="text-left py-2 px-3 text-gray-500 font-medium">Amount</th>
                    <th class="text-left py-2 px-3 text-gray-500 font-medium">Due Date</th>
                    <th class="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                    <th class="text-left py-2 px-3 text-gray-500 font-medium">Paid At</th>
                    <th class="text-left py-2 px-3 text-gray-500 font-medium">Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {#each data.investments as inv}
                    {@const payment = inv.payments?.find((pay) => pay.name === selectedPlanTab)}
                    {#if payment}
                      <tr class="border-b border-gray-50 hover:bg-gray-50">
                        <td class="py-2 px-3">
                          <div class="font-medium text-gray-900">{inv.user.name}</div>
                          <div class="text-gray-400 text-xs">{inv.user.email}</div>
                        </td>
                        <td class="py-2 px-3 font-medium">{fmt(payment.amount)}</td>
                        <td class="py-2 px-3 text-gray-500 text-xs">
                          {payment.dueDate ? fmtDate(payment.dueDate) : '—'}
                        </td>
                        <td class="py-2 px-3">
                          <span class="{payment.status === 'PAID' ? 'badge-approved' : payment.status === 'OVERDUE' ? 'badge-rejected' : payment.status === 'UNDER_REVIEW' ? 'badge-active' : 'badge-pending'}">
                            {payment.status}
                          </span>
                        </td>
                        <td class="py-2 px-3 text-gray-500 text-xs">
                          {payment.paidAt ? fmtDate(payment.paidAt) : '—'}
                        </td>
                        <td class="py-2 px-3">
                          {#if payment.investorProofUrl}
                            <a href={payment.investorProofUrl} target="_blank" class="text-primary-600 hover:underline text-xs">Investor</a>
                          {/if}
                          {#if payment.proofUrl}
                            <a href={payment.proofUrl} target="_blank" class="text-primary-600 hover:underline text-xs ml-1">Admin</a>
                          {/if}
                          {#if !payment.investorProofUrl && !payment.proofUrl}
                            <span class="text-gray-300 text-xs">—</span>
                          {/if}
                        </td>
                      </tr>
                    {/if}
                  {/each}
                </tbody>
              </table>
            </div>

            <!-- Summary -->
            {@const tabPayments = data.investments.map((inv) => inv.payments?.find((pay) => pay.name === selectedPlanTab)).filter(Boolean)}
            <div class="flex gap-4 mt-4 pt-3 border-t border-gray-100 text-sm">
              <span class="text-gray-500">
                Paid: <strong class="text-emerald-600">{tabPayments.filter((p) => p.status === 'PAID').length}/{tabPayments.length}</strong>
              </span>
              <span class="text-gray-500">
                Collected: <strong class="text-gray-900">{fmt(tabPayments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0))}</strong>
              </span>
              <span class="text-gray-500">
                Pending: <strong class="text-amber-600">{fmt(tabPayments.filter((p) => p.status !== 'PAID').reduce((s, p) => s + p.amount, 0))}</strong>
              </span>
            </div>
          {/if}
        {:else}
          <p class="text-gray-400 text-sm py-4 text-center">No payment plan configured</p>
        {/if}
      </div>

      <!-- Investors -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Investors ({data.investments.length})</h2>
        {#if data.investments.length === 0}
          <p class="text-gray-400 text-sm py-6 text-center">No investments yet</p>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="text-left py-2 px-3 text-gray-500 font-medium">Investor</th>
                  <th class="text-left py-2 px-3 text-gray-500 font-medium">Stake</th>
                  <th class="text-left py-2 px-3 text-gray-500 font-medium">Amount</th>
                  <th class="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                  <th class="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                  <th class="text-left py-2 px-3 text-gray-500 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {#each data.investments as inv}
                  <tr class="border-b border-gray-50 hover:bg-gray-50">
                    <td class="py-2 px-3">
                      <div class="font-medium text-gray-900">{inv.user.name}</div>
                      <div class="text-gray-400 text-xs">{inv.user.email}</div>
                    </td>
                    <td class="py-2 px-3 font-medium">{inv.sharesPurchased * 10}%</td>
                    <td class="py-2 px-3">{fmt(inv.totalAmount)}</td>
                    <td class="py-2 px-3">
                      <span class={invStatusColor[inv.status] ?? 'badge-pending'}>{inv.status}</span>
                    </td>
                    <td class="py-2 px-3 text-gray-500 text-xs">{fmtDate(inv.createdAt)}</td>
                    <td class="py-2 px-3">
                      <a href="/investments/{inv.id}" class="text-primary-600 hover:underline text-xs">View</a>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>

      <!-- Payouts -->
      {#if p.status === 'SOLD' && data.payouts?.length > 0}
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">ROI Payouts ({data.payouts.length})</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="text-left py-2 px-3 text-gray-500 font-medium">Investor</th>
                  <th class="text-left py-2 px-3 text-gray-500 font-medium">Stake</th>
                  <th class="text-left py-2 px-3 text-gray-500 font-medium">Profit</th>
                  <th class="text-left py-2 px-3 text-gray-500 font-medium">Total Return</th>
                  <th class="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                  <th class="text-left py-2 px-3 text-gray-500 font-medium">Receipt</th>
                  <th class="text-left py-2 px-3 text-gray-500 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {#each data.payouts as payout}
                  <tr class="border-b border-gray-50 hover:bg-gray-50">
                    <td class="py-2 px-3">
                      <div class="font-medium text-gray-900">{payout.user.name}</div>
                      <div class="text-gray-400 text-xs">{payout.user.email}</div>
                    </td>
                    <td class="py-2 px-3 font-medium">{payout.investment.sharesPurchased * 10}%</td>
                    <td class="py-2 px-3 text-emerald-600 font-semibold">{fmt(payout.profitAmount)}</td>
                    <td class="py-2 px-3 font-bold text-gray-900">{fmt(payout.totalReturn)}</td>
                    <td class="py-2 px-3">
                      <span class={payout.status === 'PAID' ? 'badge-approved' : 'badge-pending'}>
                        {payout.status}
                      </span>
                    </td>
                    <td class="py-2 px-3">
                      {#if payout.receiptUrl}
                        <a href={payout.receiptUrl} target="_blank" class="text-primary-600 hover:underline text-xs">
                          View Receipt
                        </a>
                      {:else}
                        <span class="text-gray-300 text-xs">—</span>
                      {/if}
                    </td>
                    <td class="py-2 px-3">
                      {#if payout.status === 'PENDING'}
                        <button
                          type="button"
                          onclick={() => openPayoutModal(payout)}
                          class="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                        >
                          Mark as Paid
                        </button>
                      {:else}
                        <span class="text-xs text-gray-400">Paid {payout.paidAt ? fmtDate(payout.paidAt) : ''}</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </div>

    <!-- Right col -->
    <div class="space-y-4">
      {#if p.developerLogo}
        <div class="card flex items-center gap-3">
          <img src={p.developerLogo} alt="Developer logo" class="h-12 w-12 object-contain rounded-lg border border-gray-100 bg-white" />
          <span class="text-sm font-medium text-gray-700">{p.developer || 'Developer'}</span>
        </div>
      {/if}

      <div class="card space-y-4">
        <h2 class="text-lg font-semibold text-gray-900">Key Details</h2>
        {#each [
          { label: 'Total Price',          value: fmt(p.totalPrice) },
          { label: 'Price / Share (10%)',  value: fmt(p.pricePerShare) },
          { label: 'Available Stake',      value: `${p.availableShares * 10}%` },
          { label: p.profitType === 'PRICE_INCREASE' ? 'Price Increase' : 'Profit on Sale', value: `${p.roi}%` },
          { label: 'Developer',            value: p.developer || '—' },
          { label: 'Profit Type',          value: p.profitType === 'PRICE_INCREASE' ? 'Price Increase' : 'Sells at Profit' },
          { label: 'Location',             value: p.location },
          { label: 'Listed',               value: fmtDate(p.createdAt) },
          ...(p.soldPrice ? [{ label: 'Sold For', value: fmt(p.soldPrice) }] : []),
        ] as row}
          <div class="flex justify-between text-sm border-b border-gray-50 pb-3">
            <span class="text-gray-500">{row.label}</span>
            <span class="font-medium text-gray-900 text-right max-w-[55%]">{row.value}</span>
          </div>
        {/each}
      </div>

      <div class="card">
        <h2 class="text-sm font-semibold text-gray-700 mb-3">Stake Sold</h2>
        <div class="w-full bg-gray-100 rounded-full h-3">
          <div class="bg-blue-500 h-3 rounded-full transition-all" style="width:{soldPct}%"></div>
        </div>
        <div class="flex justify-between text-xs text-gray-500 mt-2">
          <span>{(p.totalShares - p.availableShares) * 10}% sold</span>
          <span>{p.availableShares * 10}% left</span>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ── Mark as Sold Modal ───────────────────────────────────────────── -->
{#if showSoldModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md">
      <div class="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 class="text-lg font-bold text-gray-900">Mark Property as Sold</h2>
        <button type="button" onclick={() => showSoldModal = false} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
      </div>

      <form method="POST" action="?/setSold" use:enhance class="p-6 space-y-5">
        <!-- Property summary -->
        <div class="bg-gray-50 rounded-xl p-4 space-y-1">
          <p class="font-semibold text-gray-900">{p.title}</p>
          <p class="text-sm text-gray-500">{p.location}</p>
          <div class="flex gap-4 mt-2 text-sm">
            <span class="text-gray-500">Original price: <strong class="text-gray-800">{fmt(p.totalPrice)}</strong></span>
            <span class="text-gray-500">ROI: <strong class="text-gray-800">{p.roi}%</strong></span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2" for="sellingPrice">
            Final Selling Price (AED) <span class="text-red-500">*</span>
          </label>
          <input
            id="sellingPrice"
            type="number"
            name="sellingPrice"
            bind:value={sellingPrice}
            min="1"
            step="any"
            required
            class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
            placeholder="e.g. 1400000"
          />
          {#if sellingPrice && Number(sellingPrice) > 0}
            <p class="text-xs text-emerald-600 mt-1">
              Gain: {fmt(Number(sellingPrice) - p.totalPrice)}
              ({(((Number(sellingPrice) - p.totalPrice) / p.totalPrice) * 100).toFixed(1)}% return)
            </p>
          {/if}
        </div>

        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          ⚠️ This will create ROI payout records for all <strong>{data.investments.filter((i: any) => i.status === 'APPROVED').length} approved investors</strong>. This action cannot be undone.
        </div>

        {#if form?.error}
          <p class="text-red-500 text-sm">{form.error}</p>
        {/if}

        <div class="flex gap-3 pt-2">
          <button type="button" onclick={() => showSoldModal = false}
            class="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit"
            class="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">
            ✓ Confirm Sale
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- ── Mark Payout as Paid Modal ───────────────────────────────────── -->
{#if showPayoutModal && selectedPayout}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md">
      <div class="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 class="text-lg font-bold text-gray-900">Mark Payout as Paid</h2>
        <button type="button" onclick={() => showPayoutModal = false} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
      </div>

      <form
        method="POST"
        action="?/markPaid"
        enctype="multipart/form-data"
        use:enhance
        class="p-6 space-y-5"
      >
        <input type="hidden" name="id" value={selectedPayout.id} />

        <!-- Investor summary -->
        <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold text-gray-900">{selectedPayout.user.name}</p>
              <p class="text-xs text-gray-400">{selectedPayout.user.email}</p>
            </div>
            <span class="text-sm font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
              {selectedPayout.investment.sharesPurchased * 10}% stake
            </span>
          </div>
          <div class="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-100">
            <div class="text-center">
              <p class="text-xs text-gray-500">Profit</p>
              <p class="font-bold text-emerald-700">{fmt(selectedPayout.profitAmount)}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-500">Total Return</p>
              <p class="font-bold text-gray-900">{fmt(selectedPayout.totalReturn)}</p>
            </div>
          </div>
        </div>

        <!-- Receipt upload -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2" for="receipt">
            Upload Receipt / Invoice <span class="text-gray-400 font-normal">(optional)</span>
          </label>
          <label
            for="receipt"
            class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
          >
            {#if receiptFile && receiptFile.length > 0}
              <div class="text-center">
                <p class="text-sm font-semibold text-emerald-600">📄 {receiptFile[0].name}</p>
                <p class="text-xs text-gray-400 mt-1">{(receiptFile[0].size / 1024).toFixed(1)} KB</p>
              </div>
            {:else}
              <div class="text-center">
                <p class="text-2xl mb-1">📎</p>
                <p class="text-sm text-gray-500">Click to upload receipt</p>
                <p class="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
              </div>
            {/if}
          </label>
          <input
            id="receipt"
            type="file"
            name="receipt"
            accept=".pdf,.jpg,.jpeg,.png"
            bind:files={receiptFile}
            class="hidden"
          />
        </div>

        {#if form?.error}
          <p class="text-red-500 text-sm">{form.error}</p>
        {/if}

        <div class="flex gap-3 pt-2">
          <button type="button" onclick={() => showPayoutModal = false}
            class="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit"
            class="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">
            ✓ Confirm Payment
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
