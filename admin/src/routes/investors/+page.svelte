<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';

  export let data: PageData;

  let search = data.search || '';

  function onSearch() {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('search', search);
    params.set('page', '1');
    goto(`?${params}`);
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>Investors — OffPlan Admin</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Investors</h1>
      <p class="text-gray-500 text-sm mt-1">{data.total ?? 0} registered investors</p>
    </div>
  </div>

  <div class="card">
    <div class="flex gap-3 mb-6">
      <input
        type="search"
        placeholder="Search by name or email..."
        bind:value={search}
        onkeydown={(e) => e.key === 'Enter' && onSearch()}
        class="input max-w-xs"
      />
      <button onclick={onSearch} class="btn-secondary">Search</button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Investor</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Phone</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Role</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Verified</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Joined</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Investments</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {#each (data.users ?? []) as user}
            <tr class="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onclick={() => goto(`/investors/${user.id}`)}>
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                    {user.name[0]}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{user.name}</p>
                    <p class="text-gray-400 text-xs">{user.email}</p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 text-gray-600">{user.phone || '—'}</td>
              <td class="py-3 px-4">
                <span class="badge-{user.role === 'SUPER_ADMIN' ? 'rejected' : user.role === 'ADMIN' ? 'pending' : 'active'}">
                  {user.role}
                </span>
              </td>
              <td class="py-3 px-4">
                {#if user.isVerified}
                  <span class="text-green-600 font-medium text-xs">✓ Verified</span>
                {:else}
                  <span class="text-gray-400 text-xs">Unverified</span>
                {/if}
              </td>
              <td class="py-3 px-4 text-gray-500 text-xs">{fmtDate(user.createdAt)}</td>
              <td class="py-3 px-4 font-medium text-gray-700">{user._count?.investments ?? 0}</td>
              <td class="py-3 px-4">
                <a href="/investors/{user.id}" class="text-primary-600 hover:underline text-xs" onclick={(e) => e.stopPropagation()}>View</a>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="7" class="py-12 text-center text-gray-400">No investors found</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if (data.pages ?? 0) > 1}
      <div class="flex justify-center gap-2 mt-6">
        {#each Array(data.pages) as _, i}
          <a
            href="?page={i + 1}{search ? `&search=${search}` : ''}"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            class:bg-primary-600={data.page === i + 1}
            class:text-white={data.page === i + 1}
            class:bg-gray-100={data.page !== i + 1}
          >{i + 1}</a>
        {/each}
      </div>
    {/if}
  </div>
</div>
