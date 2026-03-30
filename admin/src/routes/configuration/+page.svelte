<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { toast } from '$lib/stores/toast';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  $: if (form?.success) {
    toast.success('Configuration saved');
    invalidateAll();
  }
  $: if (form?.error) toast.error(form.error);

  $: s = data.settings ?? {};

  function gv(key: string) {
    const v = (s as any)?.[key];
    if (v && typeof v === 'object') return { type: v.type || 'percentage', value: String(v.value ?? '') };
    return { type: 'percentage', value: '' };
  }

  let t1 = ''; let t2 = ''; let t3 = ''; let t4 = ''; let t5 = '';
  $: t1 = t1 || gv('investmentCommission').type;
  $: t2 = t2 || gv('soldCommission').type;
  $: t3 = t3 || gv('transferCommission').type;
  $: t4 = t4 || gv('paymentDelayFee').type;
  $: t5 = t5 || gv('paymentDefaultFee').type;
</script>

<svelte:head>
  <title>Configuration — OffPlan Admin</title>
</svelte:head>

<div class="space-y-6 max-w-4xl">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Configuration</h1>
    <p class="text-gray-500 text-sm mt-1">Manage commissions, fees, and platform settings</p>
  </div>

  <form method="POST" use:enhance={() => { return async ({ update }) => { await update(); }; }}>
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <span class="text-white text-lg">%</span>
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-900">Commissions & Fees</h2>
          <p class="text-xs text-gray-500">Configure platform commissions and penalty fees</p>
        </div>
      </div>

      <div class="space-y-4">

        <!-- 1: Investment Commission -->
        <div class="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
          <div class="flex items-start gap-4 p-5">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-xl shrink-0">💼</div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 text-sm">New Investment Commission</h3>
              <p class="text-xs text-gray-500 mt-0.5">Fee charged when an investor makes a new investment in a property</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <select name="investmentCommission_type" bind:value={t1} class="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (AED)</option>
              </select>
              <div class="relative">
                <input type="number" name="investmentCommission_value" value={gv('investmentCommission').value} step="any" min="0" placeholder={t1 === 'fixed' ? '0 AED' : '0 %'} class="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right bg-white" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{t1 === 'fixed' ? 'AED' : '%'}</span>
              </div>
            </div>
          </div>
          {#if gv('investmentCommission').value}
            <div class="px-5 pb-3"><span class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-600">Active: {gv('investmentCommission').value}{t1 === 'percentage' ? '%' : ' AED'} per transaction</span></div>
          {/if}
        </div>

        <!-- 2: Property Sale Commission -->
        <div class="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
          <div class="flex items-start gap-4 p-5">
            <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-xl shrink-0">🏷️</div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 text-sm">Property Sale Commission</h3>
              <p class="text-xs text-gray-500 mt-0.5">Fee charged when a property is sold and ROI is distributed to investors</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <select name="soldCommission_type" bind:value={t2} class="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (AED)</option>
              </select>
              <div class="relative">
                <input type="number" name="soldCommission_value" value={gv('soldCommission').value} step="any" min="0" placeholder={t2 === 'fixed' ? '0 AED' : '0 %'} class="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right bg-white" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{t2 === 'fixed' ? 'AED' : '%'}</span>
              </div>
            </div>
          </div>
          {#if gv('soldCommission').value}
            <div class="px-5 pb-3"><span class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">Active: {gv('soldCommission').value}{t2 === 'percentage' ? '%' : ' AED'} per transaction</span></div>
          {/if}
        </div>

        <!-- 3: Share Transfer Commission -->
        <div class="bg-white rounded-xl border border-purple-100 shadow-sm overflow-hidden">
          <div class="flex items-start gap-4 p-5">
            <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-xl shrink-0">🔄</div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 text-sm">Share Transfer Commission</h3>
              <p class="text-xs text-gray-500 mt-0.5">Fee charged when an investor transfers shares to another investor on the marketplace</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <select name="transferCommission_type" bind:value={t3} class="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (AED)</option>
              </select>
              <div class="relative">
                <input type="number" name="transferCommission_value" value={gv('transferCommission').value} step="any" min="0" placeholder={t3 === 'fixed' ? '0 AED' : '0 %'} class="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right bg-white" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{t3 === 'fixed' ? 'AED' : '%'}</span>
              </div>
            </div>
          </div>
          {#if gv('transferCommission').value}
            <div class="px-5 pb-3"><span class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-purple-50 text-purple-600">Active: {gv('transferCommission').value}{t3 === 'percentage' ? '%' : ' AED'} per transaction</span></div>
          {/if}
        </div>

        <!-- 4: Late Payment Penalty -->
        <div class="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden">
          <div class="flex items-start gap-4 p-5">
            <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">⏰</div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 text-sm">Late Payment Penalty</h3>
              <p class="text-xs text-gray-500 mt-0.5">Fee applied when a scheduled payment is overdue beyond the due date</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <select name="paymentDelayFee_type" bind:value={t4} class="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (AED)</option>
              </select>
              <div class="relative">
                <input type="number" name="paymentDelayFee_value" value={gv('paymentDelayFee').value} step="any" min="0" placeholder={t4 === 'fixed' ? '0 AED' : '0 %'} class="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right bg-white" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{t4 === 'fixed' ? 'AED' : '%'}</span>
              </div>
            </div>
          </div>
          {#if gv('paymentDelayFee').value}
            <div class="px-5 pb-3"><span class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-amber-50 text-amber-600">Active: {gv('paymentDelayFee').value}{t4 === 'percentage' ? '%' : ' AED'} per transaction</span></div>
          {/if}
        </div>

        <!-- 5: Payment Default Penalty -->
        <div class="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
          <div class="flex items-start gap-4 p-5">
            <div class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-xl shrink-0">🚫</div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 text-sm">Payment Default Penalty</h3>
              <p class="text-xs text-gray-500 mt-0.5">Fee applied when a scheduled payment is not paid and marked as defaulted</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <select name="paymentDefaultFee_type" bind:value={t5} class="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (AED)</option>
              </select>
              <div class="relative">
                <input type="number" name="paymentDefaultFee_value" value={gv('paymentDefaultFee').value} step="any" min="0" placeholder={t5 === 'fixed' ? '0 AED' : '0 %'} class="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right bg-white" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{t5 === 'fixed' ? 'AED' : '%'}</span>
              </div>
            </div>
          </div>
          {#if gv('paymentDefaultFee').value}
            <div class="px-5 pb-3"><span class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-red-50 text-red-600">Active: {gv('paymentDefaultFee').value}{t5 === 'percentage' ? '%' : ' AED'} per transaction</span></div>
          {/if}
        </div>

      </div>
    </div>

    <div class="flex gap-3">
      <button type="submit" class="btn-primary">Save Configuration</button>
    </div>
  </form>
</div>
