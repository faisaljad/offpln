<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

  $: u = data.user;
  $: investments = data.investments;

  function fmt(n: number) {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(n);
  }
  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  $: totalInvested = investments.reduce((s: number, i: any) => s + i.totalAmount, 0);
  $: approved = investments.filter((i: any) => i.status === 'APPROVED').length;
  $: pending = investments.filter((i: any) => i.status === 'PENDING').length;

  const statusColor: Record<string, string> = {
    PENDING: 'badge-pending',
    APPROVED: 'badge-approved',
    REJECTED: 'badge-rejected',
    COMPLETED: 'badge-active',
  };
</script>

<svelte:head>
  <title>{u.name} — OffPlan Admin</title>
</svelte:head>

<div class="space-y-6 max-w-5xl">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <a href="/investors" class="text-gray-400 hover:text-gray-600">← Investors</a>
    <h1 class="text-2xl font-bold text-gray-900">Investor Profile</h1>
  </div>

  <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <!-- Profile card -->
    <div class="card flex flex-col items-center text-center gap-3 py-8">
      <div class="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600">
        {u.name[0]}
      </div>
      <div>
        <h2 class="text-xl font-bold text-gray-900">{u.name}</h2>
        <p class="text-gray-500 text-sm">{u.email}</p>
        {#if u.phone}<p class="text-gray-500 text-sm">{u.phone}</p>{/if}
      </div>
      <div class="flex gap-2 flex-wrap justify-center">
        <span class="badge-{u.role === 'SUPER_ADMIN' ? 'rejected' : u.role === 'ADMIN' ? 'pending' : 'active'}">{u.role}</span>
        {#if u.isVerified}
          <span class="badge-approved">Verified</span>
        {:else}
          <span class="badge-pending">Unverified</span>
        {/if}
      </div>
      <p class="text-xs text-gray-400 mt-2">Member since {fmtDate(u.createdAt)}</p>
    </div>

    <!-- Stats -->
    <div class="xl:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
      {#each [
        { label: 'Total Invested', value: fmt(totalInvested), color: 'text-blue-600' },
        { label: 'Investments', value: investments.length, color: 'text-gray-900' },
        { label: 'Approved', value: approved, color: 'text-green-600' },
        { label: 'Pending', value: pending, color: 'text-yellow-600' },
        { label: 'Avg Stake', value: investments.length ? `${Math.round(investments.reduce((s: number, i: any) => s + i.sharesPurchased, 0) / investments.length) * 10}%` : '—', color: 'text-gray-900' },
      ] as stat}
        <div class="card text-center py-6">
          <p class="text-2xl font-bold {stat.color}">{stat.value}</p>
          <p class="text-xs text-gray-500 mt-1">{stat.label}</p>
        </div>
      {/each}
    </div>
  </div>

  <!-- Investment history -->
  <div class="card">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Investment History</h2>
    {#if investments.length === 0}
      <p class="text-gray-400 text-sm py-8 text-center">No investments yet</p>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Property</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Stake</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Amount</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {#each investments as inv}
              <tr class="border-b border-gray-50 hover:bg-gray-50">
                <td class="py-3 px-4">
                  <div class="flex items-center gap-3">
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
                  <span class={statusColor[inv.status] ?? 'badge-pending'}>{inv.status}</span>
                </td>
                <td class="py-3 px-4 text-gray-500 text-xs">{fmtDate(inv.createdAt)}</td>
                <td class="py-3 px-4">
                  <a href="/investments/{inv.id}" class="text-primary-600 hover:underline text-xs">View</a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
