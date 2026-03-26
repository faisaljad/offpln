<script lang="ts">
  import { enhance } from '$app/forms';
  import { toast } from '$lib/stores/toast';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let creating = false;
  let deletingId: string | null = null;
</script>

<svelte:head>
  <title>Emirates — OffPlan Admin</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6">
  <h1 class="text-2xl font-bold text-gray-900">Emirates</h1>

  {#if form?.error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{form.error}</div>
  {/if}

  <!-- Add new emirate -->
  <div class="card">
    <form
      method="POST"
      action="?/create"
      use:enhance={() => {
        creating = true;
        return ({ result, update }) => {
          creating = false;
          if (result.type === 'success') toast.success('Emirate created');
          else if (result.type === 'failure') toast.error((result.data as any)?.error || 'Failed to create');
          update();
        };
      }}
      class="flex items-end gap-3"
    >
      <div class="flex-1">
        <label class="label" for="name">Name</label>
        <input id="name" name="name" class="input" required placeholder="e.g. Dubai, Abu Dhabi..." />
      </div>
      <div class="w-32">
        <label class="label" for="latitude">Latitude</label>
        <input id="latitude" name="latitude" type="number" step="any" class="input" placeholder="25.2048" />
      </div>
      <div class="w-32">
        <label class="label" for="longitude">Longitude</label>
        <input id="longitude" name="longitude" type="number" step="any" class="input" placeholder="55.2708" />
      </div>
      <button type="submit" disabled={creating} class="btn-primary whitespace-nowrap">
        {creating ? 'Adding...' : 'Add'}
      </button>
    </form>
  </div>

  <!-- Listing -->
  <div class="card">
    {#if data.emirates.length === 0}
      <p class="text-gray-500 text-sm text-center py-6">No emirates yet.</p>
    {:else}
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-left text-gray-500 text-xs uppercase">
            <th class="pb-3 font-medium">Name</th>
            <th class="pb-3 font-medium">Latitude</th>
            <th class="pb-3 font-medium">Longitude</th>
            <th class="pb-3 font-medium">Created</th>
            <th class="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.emirates as em}
            <tr class="border-b border-gray-100 last:border-0">
              <td class="py-3 font-medium text-gray-900">{em.name}</td>
              <td class="py-3 text-gray-500 font-mono text-xs">{em.latitude}</td>
              <td class="py-3 text-gray-500 font-mono text-xs">{em.longitude}</td>
              <td class="py-3 text-gray-500">{new Date(em.createdAt).toLocaleDateString()}</td>
              <td class="py-3 text-right">
                <form
                  method="POST"
                  action="?/delete"
                  use:enhance={() => {
                    deletingId = em.id;
                    return ({ result, update }) => {
                      deletingId = null;
                      if (result.type === 'success') toast.success('Emirate deleted');
                      else if (result.type === 'failure') toast.error((result.data as any)?.error || 'Failed to delete');
                      update();
                    };
                  }}
                  class="inline"
                >
                  <input type="hidden" name="id" value={em.id} />
                  <button
                    type="submit"
                    disabled={deletingId === em.id}
                    class="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    {deletingId === em.id ? 'Deleting...' : 'Delete'}
                  </button>
                </form>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
