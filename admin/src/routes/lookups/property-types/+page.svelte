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
  <title>Property Types — OffPlan Admin</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6">
  <h1 class="text-2xl font-bold text-gray-900">Property Types</h1>

  {#if form?.error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{form.error}</div>
  {/if}

  <!-- Add new type -->
  <div class="card">
    <form
      method="POST"
      action="?/create"
      use:enhance={() => {
        creating = true;
        return ({ result, update }) => {
          creating = false;
          if (result.type === 'success') toast.success('Property type created');
          else if (result.type === 'failure') toast.error((result.data as any)?.error || 'Failed to create');
          update();
        };
      }}
      class="flex items-end gap-3"
    >
      <div class="flex-1">
        <label class="label" for="name">New Property Type</label>
        <input id="name" name="name" class="input" required placeholder="e.g. Villa, Apartment, Townhouse..." />
      </div>
      <button type="submit" disabled={creating} class="btn-primary whitespace-nowrap">
        {creating ? 'Adding...' : 'Add'}
      </button>
    </form>
  </div>

  <!-- Listing -->
  <div class="card">
    {#if data.propertyTypes.length === 0}
      <p class="text-gray-500 text-sm text-center py-6">No property types yet.</p>
    {:else}
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-left text-gray-500 text-xs uppercase">
            <th class="pb-3 font-medium">Name</th>
            <th class="pb-3 font-medium">Created</th>
            <th class="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.propertyTypes as pt}
            <tr class="border-b border-gray-100 last:border-0">
              <td class="py-3 font-medium text-gray-900">{pt.name}</td>
              <td class="py-3 text-gray-500">{new Date(pt.createdAt).toLocaleDateString()}</td>
              <td class="py-3 text-right">
                <form
                  method="POST"
                  action="?/delete"
                  use:enhance={() => {
                    deletingId = pt.id;
                    return ({ result, update }) => {
                      deletingId = null;
                      if (result.type === 'success') toast.success('Property type deleted');
                      else if (result.type === 'failure') toast.error((result.data as any)?.error || 'Failed to delete');
                      update();
                    };
                  }}
                  class="inline"
                >
                  <input type="hidden" name="id" value={pt.id} />
                  <button
                    type="submit"
                    disabled={deletingId === pt.id}
                    class="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    {deletingId === pt.id ? 'Deleting...' : 'Delete'}
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
