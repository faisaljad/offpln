<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { toast } from '$lib/stores/toast';
  import type { PageData } from './$types';

  export let data: PageData;

  let search = data.search || '';
  let deleteId = '';
  let showConfirm = false;

  function onSearch() {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('search', search);
    params.set('page', '1');
    goto(`?${params}`);
  }

  function confirmDelete(id: string) {
    deleteId = id;
    showConfirm = true;
  }

  function formatPrice(n: number) {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(n);
  }
</script>

<svelte:head>
  <title>Properties — OffPlan Admin</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Properties</h1>
      <p class="text-gray-500 text-sm mt-1">{data.total} total properties</p>
    </div>
    <div class="flex gap-3">
      <a href="/properties/bulk" class="btn-secondary">📥 Bulk Import</a>
      <a href="/properties/create" class="btn-primary">+ New Property</a>
    </div>
  </div>

  <div class="card">
    <div class="flex gap-3 mb-6">
      <input
        type="search"
        placeholder="Search properties..."
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
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Property</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Location</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Price/Share</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Shares</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">ROI</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.properties as prop}
            <tr class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  {#if prop.images?.[0]}
                    <img src={prop.images[0]} alt={prop.title} class="w-10 h-10 rounded-lg object-cover" />
                  {/if}
                  <span class="font-medium text-gray-900">{prop.title}</span>
                </div>
              </td>
              <td class="py-3 px-4 text-gray-600">{prop.location}</td>
              <td class="py-3 px-4 font-medium">{formatPrice(prop.pricePerShare)}</td>
              <td class="py-3 px-4">
                <span class="text-green-600 font-medium">{prop.availableShares}</span>
                <span class="text-gray-400">/{prop.totalShares}</span>
              </td>
              <td class="py-3 px-4 text-green-600 font-medium">{prop.roi}%</td>
              <td class="py-3 px-4">
                <span class="badge-{prop.status === 'ACTIVE' ? 'approved' : prop.status === 'SOLD_OUT' ? 'rejected' : 'pending'}">
                  {prop.status}
                </span>
              </td>
              <td class="py-3 px-4">
                <div class="flex gap-2">
                  <a href="/properties/{prop.id}" class="text-gray-500 hover:underline">View</a>
                  <a href="/properties/{prop.id}/edit" class="text-primary-600 hover:underline">Edit</a>
                  <button onclick={() => confirmDelete(prop.id)} class="text-red-500 hover:underline">Delete</button>
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="7" class="py-12 text-center text-gray-400">No properties found</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if data.pages > 1}
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

{#if showConfirm}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
      <h3 class="text-lg font-semibold mb-2">Delete Property</h3>
      <p class="text-gray-600 text-sm mb-6">Are you sure? This action cannot be undone.</p>
      <div class="flex gap-3">
        <button onclick={() => (showConfirm = false)} class="btn-secondary flex-1">Cancel</button>
        <form
          method="POST"
          action="?/delete"
          use:enhance={() => {
            return ({ result, update }) => {
              showConfirm = false;
              if (result.type === 'success') toast.success('Property deleted');
              else toast.error('Failed to delete');
              update();
            };
          }}
          class="flex-1"
        >
          <input type="hidden" name="id" value={deleteId} />
          <button type="submit" class="btn-danger w-full">Delete</button>
        </form>
      </div>
    </div>
  </div>
{/if}
