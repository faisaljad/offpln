<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

  $: u = data.user;
  $: investments = data.investments;
  $: payouts = data.payouts ?? [];
  $: transfers = data.transfers ?? [];

  let expandedInv: Record<string, boolean> = {};

  function fmt(n: number) {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(n);
  }
  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  $: totalInvested = investments.reduce((s: number, i: any) => s + i.totalAmount, 0);
  $: totalPaid = investments.reduce((s: number, i: any) =>
    s + (i.payments ?? []).filter((p: any) => p.status === 'PAID').reduce((ps: number, p: any) => ps + p.amount, 0), 0);
  $: totalPayouts = payouts.reduce((s: number, p: any) => s + (p.totalReturn ?? 0), 0);
  $: totalProfit = payouts.reduce((s: number, p: any) => s + (p.profitAmount ?? 0), 0);
  $: completedTransfers = transfers.filter((t: any) => t.status === 'COMPLETED');
  $: transferSalesAmount = completedTransfers.filter((t: any) => t.sellerId === u.id).reduce((s: number, t: any) => s + (t.askPrice ?? 0), 0);
  $: approved = investments.filter((i: any) => i.status === 'APPROVED').length;
  $: pending = investments.filter((i: any) => i.status === 'PENDING').length;

  // Sold/closed investment IDs (property sold or transfer completed as seller)
  $: soldInvIds = new Set([
    ...payouts.map((p: any) => p.investmentId),
    ...completedTransfers.filter((t: any) => t.sellerId === u.id).map((t: any) => t.investmentId),
  ]);
  $: soldClosedCount = investments.filter((i: any) => soldInvIds.has(i.id)).length;
  // Total unpaid: only count active (non-sold) investments
  $: totalUnpaid = investments
    .filter((i: any) => !soldInvIds.has(i.id))
    .reduce((s: number, i: any) =>
      s + (i.payments ?? []).filter((p: any) => p.status !== 'PAID').reduce((ps: number, p: any) => ps + p.amount, 0), 0);

  const statusColor: Record<string, string> = {
    PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected', COMPLETED: 'badge-active',
  };
  const transferStatusColor: Record<string, string> = {
    PENDING_APPROVAL: '#f59e0b', LISTED: '#0284c7', REQUESTED: '#8b5cf6', OTP_PENDING: '#10b981', COMPLETED: '#059669', REJECTED: '#ef4444', CANCELLED: '#6b7280',
  };
</script>

<svelte:head>
  <title>{u.name} — OffPlan Admin</title>
</svelte:head>

<div class="space-y-6 max-w-6xl">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <a href="/investors" class="text-gray-400 hover:text-gray-600">← Investors</a>
    <h1 class="text-2xl font-bold text-gray-900">Investor Profile</h1>
  </div>

  <!-- Profile banner -->
  <div class="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-2xl p-8 text-white relative overflow-hidden">
    <div class="absolute top-[-30px] right-[-30px] w-40 h-40 rounded-full bg-white/10"></div>
    <div class="absolute bottom-[-20px] left-[40%] w-24 h-24 rounded-full bg-white/5"></div>

    <div class="flex items-center gap-6">
      <div class="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold backdrop-blur-sm border border-white/20">
        {u.name[0]}
      </div>
      <div class="flex-1">
        <h2 class="text-2xl font-bold">{u.name}</h2>
        <p class="text-blue-100 text-sm mt-1">{u.email}</p>
        {#if u.phone}<p class="text-blue-200 text-xs mt-0.5">{u.phone}</p>{/if}
      </div>
      <div class="flex gap-2">
        {#if u.isVerified}
          <span class="bg-emerald-400/20 text-emerald-100 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-300/30">✓ Verified</span>
        {:else}
          <span class="bg-amber-400/20 text-amber-100 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-300/30">Unverified</span>
        {/if}
        <span class="bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">Since {fmtDate(u.createdAt)}</span>
      </div>
    </div>
  </div>

  <!-- Stats grid -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><span class="text-sm">💼</span></div>
      </div>
      <p class="text-2xl font-bold text-blue-600">{investments.length}</p>
      <p class="text-xs text-gray-500 mt-1">Investments</p>
    </div>
    <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><span class="text-sm">💰</span></div>
      </div>
      <p class="text-2xl font-bold text-indigo-600">{fmt(totalInvested)}</p>
      <p class="text-xs text-gray-500 mt-1">Total Invested</p>
    </div>
    <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center"><span class="text-sm">✅</span></div>
      </div>
      <p class="text-2xl font-bold text-cyan-600">{fmt(totalPaid)}</p>
      <p class="text-xs text-gray-500 mt-1">Total Paid</p>
    </div>
    <div class="bg-white rounded-xl p-5 border border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><span class="text-sm">🏆</span></div>
      </div>
      <p class="text-2xl font-bold text-emerald-600">{fmt(totalPayouts)}</p>
      <p class="text-xs text-gray-500 mt-1">Total Payouts</p>
    </div>
    <div class="bg-white rounded-xl p-5 border border-green-100 shadow-sm bg-gradient-to-br from-white to-green-50">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"><span class="text-sm">📈</span></div>
      </div>
      <p class="text-2xl font-bold text-green-600">{fmt(totalProfit)}</p>
      <p class="text-xs text-gray-500 mt-1">Total Profit</p>
    </div>
    <div class="bg-white rounded-xl p-5 border border-purple-100 shadow-sm bg-gradient-to-br from-white to-purple-50">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><span class="text-sm">🔄</span></div>
      </div>
      <p class="text-2xl font-bold text-purple-600">{fmt(transferSalesAmount)}</p>
      <p class="text-xs text-gray-500 mt-1">Market Sales</p>
    </div>
    <div class="bg-white rounded-xl p-5 border border-red-100 shadow-sm bg-gradient-to-br from-white to-red-50">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><span class="text-sm">⏳</span></div>
      </div>
      <p class="text-2xl font-bold text-red-500">{fmt(totalUnpaid)}</p>
      <p class="text-xs text-gray-500 mt-1">Total Unpaid</p>
    </div>
    <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><span class="text-sm">🔒</span></div>
      </div>
      <p class="text-2xl font-bold text-slate-600">{soldClosedCount}</p>
      <p class="text-xs text-gray-500 mt-1">Sold / Closed</p>
    </div>
  </div>

  <!-- Bank Details -->
  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white">
      <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <span class="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-sm">🏦</span>
        Bank Details
      </h2>
    </div>
    {#if u.bankDetails && (u.bankDetails.bankName || u.bankDetails.iban)}
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 p-6">
        <div>
          <p class="text-xs text-gray-400 font-medium mb-1">Bank Name</p>
          <p class="text-sm font-semibold text-gray-900">{u.bankDetails.bankName || '—'}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium mb-1">Account Holder</p>
          <p class="text-sm font-semibold text-gray-900">{u.bankDetails.accountName || '—'}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium mb-1">Account Number</p>
          <p class="text-sm font-semibold text-gray-900">{u.bankDetails.accountNumber || '—'}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium mb-1">IBAN</p>
          <p class="text-sm font-semibold text-gray-900 break-all">{u.bankDetails.iban || '—'}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium mb-1">SWIFT / BIC</p>
          <p class="text-sm font-semibold text-gray-900">{u.bankDetails.swiftCode || '—'}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium mb-1">Branch</p>
          <p class="text-sm font-semibold text-gray-900">{u.bankDetails.branch || '—'}</p>
        </div>
      </div>
    {:else}
      <p class="text-gray-400 text-sm py-8 text-center">No bank details provided</p>
    {/if}
  </div>

  <!-- Payouts -->
  {#if payouts.length > 0}
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
        <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-sm">💸</span>
          ROI Payouts ({payouts.length})
        </h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-50 bg-gray-50/50">
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Property</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Stake</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Invested</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Profit</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Total Return</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {#each payouts as p}
              <tr class="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
                <td class="py-3 px-4 font-medium text-gray-900">{p.property?.title ?? '—'}</td>
                <td class="py-3 px-4">{p.investment?.sharesPurchased ? p.investment.sharesPurchased * 10 + '%' : '—'}</td>
                <td class="py-3 px-4">{fmt(p.investment?.totalAmount ?? 0)}</td>
                <td class="py-3 px-4 font-bold text-emerald-600">+{fmt(p.profitAmount)}</td>
                <td class="py-3 px-4 font-bold text-gray-900">{fmt(p.totalReturn)}</td>
                <td class="py-3 px-4">
                  <span class="{p.status === 'PAID' ? 'badge-approved' : 'badge-pending'}">{p.status}</span>
                </td>
                <td class="py-3 px-4">
                  {#if p.receiptUrl}
                    <a href={p.receiptUrl} target="_blank" class="text-primary-600 hover:underline text-xs">View</a>
                  {:else}
                    <span class="text-gray-300 text-xs">—</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  <!-- Transfers -->
  {#if transfers.length > 0}
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
        <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-sm">🔄</span>
          Market Transfers ({transfers.length})
        </h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-50 bg-gray-50/50">
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Property</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Role</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Ask Price</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Counterparty</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {#each transfers as t}
              <tr class="border-b border-gray-50 hover:bg-purple-50/30 transition-colors">
                <td class="py-3 px-4 font-medium text-gray-900">{t.investment?.property?.title ?? '—'}</td>
                <td class="py-3 px-4">
                  {#if t.sellerId === u.id}
                    <span class="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Seller</span>
                  {:else}
                    <span class="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Buyer</span>
                  {/if}
                </td>
                <td class="py-3 px-4 font-medium">{fmt(t.askPrice)}</td>
                <td class="py-3 px-4 text-gray-600 text-xs">
                  {t.sellerId === u.id ? (t.buyer?.name ?? '—') : (t.seller?.name ?? '—')}
                </td>
                <td class="py-3 px-4">
                  <span class="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style="background: {transferStatusColor[t.status] ?? '#6b7280'}15; color: {transferStatusColor[t.status] ?? '#6b7280'}">
                    {t.status.replace('_', ' ')}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-500 text-xs">{fmtDate(t.updatedAt ?? t.createdAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  <!-- Investment History -->
  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
      <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <span class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-sm">📊</span>
        Investment History ({investments.length})
      </h2>
    </div>
    {#if investments.length === 0}
      <p class="text-gray-400 text-sm py-12 text-center">No investments yet</p>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-50 bg-gray-50/50">
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Property</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Stake</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Amount</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Paid</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {#each investments as inv}
              {@const paidAmount = (inv.payments ?? []).filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)}
              {@const paidCount = (inv.payments ?? []).filter((p) => p.status === 'PAID').length}
              {@const totalCount = (inv.payments ?? []).length}
              <tr
                class="border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer"
                onclick={() => expandedInv[inv.id] = !expandedInv[inv.id]}
              >
                <td class="py-3 px-4">
                  <div class="flex items-center gap-3">
                    <button class="text-gray-400 transition-transform {expandedInv[inv.id] ? 'rotate-90' : ''}">▸</button>
                    {#if inv.property?.images?.[0]}
                      <img src={inv.property.images[0]} alt="" class="w-10 h-10 rounded-lg object-cover" />
                    {/if}
                    <div>
                      <p class="font-medium text-gray-900 line-clamp-1">{inv.property?.title}</p>
                      <p class="text-gray-400 text-xs">{inv.property?.location}</p>
                    </div>
                  </div>
                </td>
                <td class="py-3 px-4 font-medium">{inv.sharesPurchased * 10}%</td>
                <td class="py-3 px-4 font-medium">{fmt(inv.totalAmount)}</td>
                <td class="py-3 px-4">
                  <span class="font-medium {paidAmount >= inv.totalAmount ? 'text-emerald-600' : 'text-amber-600'}">
                    {fmt(paidAmount)}
                  </span>
                  <span class="text-xs text-gray-400 ml-1">({paidCount}/{totalCount})</span>
                </td>
                <td class="py-3 px-4">
                  <span class={statusColor[inv.status] ?? 'badge-pending'}>{inv.status}</span>
                </td>
                <td class="py-3 px-4 text-gray-500 text-xs">{fmtDate(inv.createdAt)}</td>
                <td class="py-3 px-4">
                  <a href="/investments/{inv.id}" class="text-primary-600 hover:underline text-xs" onclick={(e) => e.stopPropagation()}>View</a>
                </td>
              </tr>
              {#if expandedInv[inv.id] && (inv.payments ?? []).length > 0}
                <tr>
                  <td colspan="7" class="px-4 pb-4 pt-0">
                    <div class="ml-8 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                      <table class="w-full text-xs">
                        <thead>
                          <tr class="bg-gray-100/60">
                            <th class="text-left py-2 px-3 text-gray-500 font-medium">Payment</th>
                            <th class="text-left py-2 px-3 text-gray-500 font-medium">Amount</th>
                            <th class="text-left py-2 px-3 text-gray-500 font-medium">Due Date</th>
                            <th class="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                            <th class="text-left py-2 px-3 text-gray-500 font-medium">Paid At</th>
                            <th class="text-left py-2 px-3 text-gray-500 font-medium">Proof</th>
                          </tr>
                        </thead>
                        <tbody>
                          {#each inv.payments as payment}
                            <tr class="border-t border-gray-100/80 hover:bg-white/60">
                              <td class="py-2 px-3 font-medium text-gray-700">{payment.name}</td>
                              <td class="py-2 px-3 text-gray-700">{fmt(payment.amount)}</td>
                              <td class="py-2 px-3 text-gray-500">{payment.dueDate ? fmtDate(payment.dueDate) : '—'}</td>
                              <td class="py-2 px-3">
                                {#if payment.status === 'PAID'}
                                  <span class="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">PAID</span>
                                {:else if payment.status === 'OVERDUE'}
                                  <span class="text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full">OVERDUE</span>
                                {:else if payment.status === 'UNDER_REVIEW'}
                                  <span class="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">REVIEW</span>
                                {:else}
                                  <span class="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">PENDING</span>
                                {/if}
                              </td>
                              <td class="py-2 px-3 text-gray-500">{payment.paidAt ? fmtDate(payment.paidAt) : '—'}</td>
                              <td class="py-2 px-3">
                                {#if payment.investorProofUrl}
                                  <a href={payment.investorProofUrl} target="_blank" class="text-primary-600 hover:underline">Inv</a>
                                {/if}
                                {#if payment.proofUrl}
                                  <a href={payment.proofUrl} target="_blank" class="text-primary-600 hover:underline ml-1">Adm</a>
                                {/if}
                                {#if !payment.investorProofUrl && !payment.proofUrl}
                                  <span class="text-gray-300">—</span>
                                {/if}
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
