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

    <!-- Support & Contact -->
    <div class="card space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">Support & Contact</h2>
      <p class="text-sm text-gray-500">Contact information displayed to investors in the mobile app support page.</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="supportPhone" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="text"
            id="supportPhone"
            name="supportPhone"
            value={data.settings?.supportPhone ?? ''}
            class="input w-full"
          />
        </div>

        <div>
          <label for="supportEmail" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="text"
            id="supportEmail"
            name="supportEmail"
            value={data.settings?.supportEmail ?? ''}
            class="input w-full"
          />
        </div>

        <div>
          <label for="supportWhatsapp" class="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
          <input
            type="text"
            id="supportWhatsapp"
            name="supportWhatsapp"
            value={data.settings?.supportWhatsapp ?? ''}
            placeholder="+971..."
            class="input w-full"
          />
        </div>

        <div>
          <label for="supportWorkingHours" class="block text-sm font-medium text-gray-700 mb-1">Working Hours</label>
          <input
            type="text"
            id="supportWorkingHours"
            name="supportWorkingHours"
            value={data.settings?.supportWorkingHours ?? ''}
            placeholder="Sun-Thu 9AM-6PM"
            class="input w-full"
          />
        </div>

        <div>
          <label for="supportWebsite" class="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
          <input
            type="text"
            id="supportWebsite"
            name="supportWebsite"
            value={data.settings?.supportWebsite ?? ''}
            class="input w-full"
          />
        </div>
      </div>

      <div>
        <label for="supportAddress" class="block text-sm font-medium text-gray-700 mb-1">Office Address</label>
        <textarea
          id="supportAddress"
          name="supportAddress"
          rows="3"
          class="input w-full"
        >{data.settings?.supportAddress ?? ''}</textarea>
      </div>
    </div>

    <div class="flex justify-end">
      <button type="submit" disabled={loading} class="btn-primary">
        {loading ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  </form>
</div>
