<script lang="ts">
  import { enhance } from '$app/forms';
  import { toast } from '$lib/stores/toast';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  $: if (form?.success) toast.success(`Transfer ${form.action} successfully`);
  $: if (form?.error) toast.error(form.error);

  const STATUS_FILTERS = [
    { label: 'All',              value: '' },
    { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
    { label: 'Listed',           value: 'LISTED' },
    { label: 'Requested',        value: 'REQUESTED' },
    { label: 'OTP Pending',      value: 'OTP_PENDING' },
    { label: 'Completed',        value: 'COMPLETED' },
    { label: 'Rejected',         value: 'REJECTED' },
    { label: 'Cancelled',        value: 'CANCELLED' },
  ];

  const STATUS_STYLES: Record<string, string> = {
    PENDING_APPROVAL: 'bg-orange-100 text-orange-700',
    LISTED:           'bg-blue-100 text-blue-700',
    REQUESTED:        'bg-amber-100 text-amber-700',
    OTP_PENDING:      'bg-purple-100 text-purple-700',
    COMPLETED:        'bg-green-100 text-green-700',
    REJECTED:         'bg-red-100 text-red-700',
    CANCELLED:        'bg-gray-100 text-gray-600',
  };

  function fmt(n: number) {
    return `AED ${new Intl.NumberFormat('en').format(Math.round(n))}`;
  }
  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>Share Transfers — OffPlan Admin</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold text-gray-900">Share Transfers</h1>
    <span class="text-sm text-gray-500">{data.transfers?.length ?? 0} records</span>
  </div>

  <!-- Status filter tabs -->
  <div class="flex flex-wrap gap-2">
    {#each STATUS_FILTERS as f}
      <a
        href="/transfers{f.value ? `?status=${f.value}` : ''}"
        class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors border
          {data.status === f.value
            ? 'bg-primary-600 text-white border-primary-600'
            : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'}"
      >
        {f.label}
      </a>
    {/each}
  </div>

  <!-- Table -->
  <div class="card overflow-hidden p-0">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50 text-left">
            <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Property</th>
            <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Seller</th>
            <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Buyer</th>
            <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ask Price</th>
            <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Shares</th>
            <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
            <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
            <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          {#each data.transfers as t}
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900 max-w-[180px] truncate">{t.investment?.property?.title ?? '—'}</p>
                <p class="text-xs text-gray-400">{t.investment?.property?.location ?? ''}</p>
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-gray-800">{t.seller?.name ?? '—'}</p>
                <p class="text-xs text-gray-400">{t.seller?.email ?? ''}</p>
              </td>
              <td class="px-4 py-3">
                {#if t.buyer}
                  <p class="font-medium text-gray-800">{t.buyer.name}</p>
                  <p class="text-xs text-gray-400">{t.buyer.email}</p>
                {:else}
                  <span class="text-gray-400 text-xs">No buyer yet</span>
                {/if}
              </td>
              <td class="px-4 py-3 font-semibold text-gray-900">{fmt(t.askPrice)}</td>
              <td class="px-4 py-3 text-gray-700">{t.investment?.sharesPurchased ?? '—'} shares</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs font-bold {STATUS_STYLES[t.status] ?? 'bg-gray-100 text-gray-600'}">
                  {t.status.replace('_', ' ')}
                </span>
              </td>
              <td class="px-4 py-3 text-xs text-gray-500">{fmtDate(t.createdAt)}</td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  {#if t.status === 'PENDING_APPROVAL'}
                    <form method="POST" action="?/approveListing" use:enhance>
                      <input type="hidden" name="id" value={t.id} />
                      <button class="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700">
                        Approve Listing
                      </button>
                    </form>
                    <form method="POST" action="?/reject" use:enhance class="flex flex-col gap-1">
                      <input type="hidden" name="id" value={t.id} />
                      <input
                        type="text"
                        name="note"
                        placeholder="Rejection reason (optional)"
                        class="text-xs border border-gray-200 rounded px-2 py-1 w-40 focus:outline-none focus:border-red-300"
                      />
                      <button class="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600">
                        Reject Listing
                      </button>
                    </form>
                  {:else if t.status === 'REQUESTED'}
                    <form method="POST" action="?/approve" use:enhance>
                      <input type="hidden" name="id" value={t.id} />
                      <button class="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700">
                        Approve Transfer
                      </button>
                    </form>
                    <form method="POST" action="?/rejectRequest" use:enhance class="flex flex-col gap-1">
                      <input type="hidden" name="id" value={t.id} />
                      <input
                        type="text"
                        name="note"
                        placeholder="Rejection reason (optional)"
                        class="text-xs border border-gray-200 rounded px-2 py-1 w-40 focus:outline-none focus:border-orange-300"
                      />
                      <button class="px-3 py-1 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600">
                        Reject Request
                      </button>
                    </form>
                  {:else if t.status === 'LISTED'}
                    <form method="POST" action="?/reject" use:enhance class="flex flex-col gap-1">
                      <input type="hidden" name="id" value={t.id} />
                      <input
                        type="text"
                        name="note"
                        placeholder="Reason (optional)"
                        class="text-xs border border-gray-200 rounded px-2 py-1 w-40 focus:outline-none focus:border-red-300"
                      />
                      <button class="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600">
                        Remove Listing
                      </button>
                    </form>
                  {:else if t.status === 'OTP_PENDING'}
                    <span class="text-xs text-purple-600 font-medium">Awaiting seller OTP</span>
                  {:else}
                    <span class="text-xs text-gray-400">—</span>
                  {/if}
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="8" class="px-4 py-12 text-center text-gray-400">No transfer records found</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
