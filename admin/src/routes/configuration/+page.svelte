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

  const commissionFields = [
    {
      key: 'investmentCommission',
      label: 'New Investment Commission',
      description: 'Fee charged when an investor makes a new investment in a property',
      icon: '💼',
      color: 'blue',
    },
    {
      key: 'soldCommission',
      label: 'Property Sale Commission',
      description: 'Fee charged when a property is sold and ROI is distributed to investors',
      icon: '🏷️',
      color: 'emerald',
    },
    {
      key: 'transferCommission',
      label: 'Share Transfer Commission',
      description: 'Fee charged when an investor transfers shares to another investor on the marketplace',
      icon: '🔄',
      color: 'purple',
    },
    {
      key: 'paymentDelayFee',
      label: 'Late Payment Penalty',
      description: 'Fee applied when a scheduled payment is overdue beyond the due date',
      icon: '⏰',
      color: 'amber',
    },
    {
      key: 'paymentDefaultFee',
      label: 'Payment Default Penalty',
      description: 'Fee applied when a scheduled payment is not paid and marked as defaulted',
      icon: '🚫',
      color: 'red',
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; iconBg: string; text: string }> = {
    blue:    { bg: 'bg-blue-50',    border: 'border-blue-100',    iconBg: 'bg-blue-100',    text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-100', text: 'text-emerald-600' },
    purple:  { bg: 'bg-purple-50',  border: 'border-purple-100',  iconBg: 'bg-purple-100',  text: 'text-purple-600' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-100',   iconBg: 'bg-amber-100',   text: 'text-amber-600' },
    red:     { bg: 'bg-red-50',     border: 'border-red-100',     iconBg: 'bg-red-100',     text: 'text-red-600' },
  };

  function getVal(key: string): { type: string; value: string } {
    const v = (s as any)?.[key];
    if (v && typeof v === 'object') return { type: v.type || 'percentage', value: String(v.value ?? '') };
    return { type: 'percentage', value: '' };
  }

  // Reactive state for each commission type selector
  let types: Record<string, string> = {};
  $: {
    for (const f of commissionFields) {
      if (!(f.key in types)) types[f.key] = getVal(f.key).type;
    }
  }
</script>

<svelte:head>
  <title>Configuration — OffPlan Admin</title>
</svelte:head>

<div class="space-y-6 max-w-4xl">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Configuration</h1>
    <p class="text-gray-500 text-sm mt-1">Manage commissions, fees, and platform settings</p>
  </div>

  <form
    method="POST"
    use:enhance={() => {
      return async ({ update }) => { await update(); };
    }}
  >
    <!-- Commissions Section -->
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
        {#each commissionFields as field}
          {@const c = colorMap[field.color]}
          {@const val = getVal(field.key)}
          <div class="bg-white rounded-xl border {c.border} shadow-sm overflow-hidden">
            <div class="flex items-start gap-4 p-5">
              <div class="w-12 h-12 rounded-xl {c.iconBg} flex items-center justify-center text-xl shrink-0">
                {field.icon}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 text-sm">{field.label}</h3>
                <p class="text-xs text-gray-500 mt-0.5">{field.description}</p>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <select
                  name="{field.key}_type"
                  bind:value={types[field.key]}
                  class="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (AED)</option>
                </select>
                <div class="relative">
                  <input
                    type="number"
                    name="{field.key}_value"
                    value={val.value}
                    step="any"
                    min="0"
                    placeholder={types[field.key] === 'fixed' ? '0 AED' : '0 %'}
                    class="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                    {types[field.key] === 'fixed' ? 'AED' : '%'}
                  </span>
                </div>
              </div>
            </div>
            {#if val.value}
              <div class="px-5 pb-3 pt-0">
                <div class="inline-flex items-center gap-1.5 {c.bg} px-3 py-1 rounded-full">
                  <span class="w-1.5 h-1.5 rounded-full {c.iconBg}"></span>
                  <span class="text-xs font-medium {c.text}">
                    Active: {val.value}{types[field.key] === 'percentage' ? '%' : ' AED'} per transaction
                  </span>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <div class="flex gap-3">
      <button type="submit" class="btn-primary">
        Save Configuration
      </button>
    </div>
  </form>
</div>
