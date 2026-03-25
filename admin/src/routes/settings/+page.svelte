<script lang="ts">
  import { enhance } from '$app/forms';
  import { toast } from '$lib/stores/toast';
  import RichEditor from '$lib/components/RichEditor.svelte';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;
  let loading = false;

  $: if (form?.success) toast.success('Settings saved!');
  $: if (form?.error) toast.error(form.error);
</script>

<svelte:head>
  <title>Settings — OffPlan Admin</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
  </div>

  <form
    method="POST"
    use:enhance={() => {
      loading = true;
      return ({ result, update }) => {
        loading = false;
        update();
      };
    }}
    class="space-y-6"
  >
    <!-- Terms & Conditions -->
    <div class="card space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">Terms & Conditions</h2>
      <p class="text-sm text-gray-500">This text will be shown to investors before they confirm an investment.</p>
      <RichEditor name="termsAndConditions" value={data.settings?.termsAndConditions ?? ''} />
    </div>

    <!-- Payment Transfer Details -->
    <div class="card space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">Payment Transfer Details</h2>
      <p class="text-sm text-gray-500">Bank account details or payment instructions shown to investors after agreeing to T&C.</p>
      <RichEditor name="paymentTransferDetails" value={data.settings?.paymentTransferDetails ?? ''} />
    </div>

    <!-- Transfer Listing Terms -->
    <div class="card space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">Share Transfer — Listing Terms</h2>
      <p class="text-sm text-gray-500">Terms shown to investors before they list their share for sale on the marketplace.</p>
      <RichEditor name="transferListingTerms" value={data.settings?.transferListingTerms ?? ''} />
    </div>

    <!-- Transfer Buying Terms -->
    <div class="card space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">Share Transfer — Buying Terms</h2>
      <p class="text-sm text-gray-500">Terms shown to buyers before they request to purchase a listed share on the marketplace.</p>
      <RichEditor name="transferBuyingTerms" value={data.settings?.transferBuyingTerms ?? ''} />
    </div>

    <div class="flex justify-end">
      <button type="submit" disabled={loading} class="btn-primary">
        {loading ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  </form>
</div>
