<script lang="ts">
  import { enhance } from '$app/forms';
  import { toast } from '$lib/stores/toast';
  import RichEditor from '$lib/components/RichEditor.svelte';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;
  let loading = false;

  $: prop = data.property;

  // Payment plan — initialized once when prop is available
  let downPayment = 20;
  let installments: any[] = [];
  let initialized = false;
  $: if (prop && !initialized) {
    initialized = true;
    const pp = prop.paymentPlan as any;
    downPayment = pp?.downPayment ?? 20;
    installments = pp?.installments ?? [];
  }

  // Existing image URLs from the saved property
  let imageUrls: string[] = [];
  let imagesReady = false;
  $: if (prop && !imagesReady) {
    imagesReady = true;
    imageUrls = prop.images ?? [];
  }

  // Developer logo
  let developerLogoUrl: string = '';
  let logoReady = false;
  $: if (prop && !logoReady) {
    logoReady = true;
    developerLogoUrl = prop.developerLogo ?? '';
  }

  let uploadingImages = false;
  let uploadingLogo = false;

  async function uploadFiles(files: File[]): Promise<string[]> {
    const fd = new FormData();
    for (const f of files) fd.append('files', f, f.name);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.urls ?? [];
  }

  async function onImagesChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    uploadingImages = true;
    try {
      const urls = await uploadFiles(files);
      imageUrls = [...imageUrls, ...urls];
    } catch {
      toast.error('Image upload failed');
    } finally {
      uploadingImages = false;
      input.value = '';
    }
  }

  async function onLogoChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    uploadingLogo = true;
    try {
      const urls = await uploadFiles([file]);
      developerLogoUrl = urls[0] ?? '';
    } catch {
      toast.error('Logo upload failed');
    } finally {
      uploadingLogo = false;
      input.value = '';
    }
  }

  function removeImage(i: number) {
    imageUrls = imageUrls.filter((_, idx) => idx !== i);
  }

  function addInstallment() {
    installments = [...installments, { name: '', percentage: 0, dueType: 'date', dueValue: '' }];
  }

  function removeInstallment(i: number) {
    installments = installments.filter((_, idx) => idx !== i);
  }

  $: emirates = data.emirates ?? [];

  let latitude: number | '' = '';
  let longitude: number | '' = '';
  let coordsReady = false;
  $: if (prop && !coordsReady) {
    coordsReady = true;
    latitude = prop.latitude ?? '';
    longitude = prop.longitude ?? '';
  }

  // New fields
  let propertyTypeId = '';
  let area: number | '' = '';
  let handoverFrom = '';
  let handoverTo = '';
  let newFieldsReady = false;

  // Generate quarter options Q1 2025 – Q4 2035
  const quarterOptions: string[] = [];
  for (let y = 2025; y <= 2035; y++) {
    for (let q = 1; q <= 4; q++) {
      quarterOptions.push(`Q${q} ${y}`);
    }
  }

  $: if (prop && !newFieldsReady) {
    newFieldsReady = true;
    propertyTypeId = prop.propertyTypeId ?? prop.propertyType?.id ?? '';
    area = prop.area ?? '';
    // Parse handoverDate "Q1 2029 - Q3 2029" into from/to
    if (prop.handoverDate) {
      const parts = prop.handoverDate.split(' - ');
      handoverFrom = parts[0]?.trim() ?? '';
      handoverTo = parts[1]?.trim() ?? '';
    }
  }

  $: handoverDate = handoverFrom && handoverTo ? `${handoverFrom} - ${handoverTo}` : handoverFrom || '';

  function onEmirateChange(e: Event) {
    const sel = (e.target as HTMLSelectElement).value;
    const em = emirates.find((e: any) => e.name === sel);
    if (em) { latitude = em.latitude; longitude = em.longitude; }
  }

  $: paymentPlanJSON = JSON.stringify({ downPayment, installments }, null, 2);
  $: totalPct = downPayment + installments.reduce((s: number, i: any) => s + Number(i.percentage), 0);
</script>

<svelte:head>
  <title>Edit Property — OffPlan Admin</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <a href="/properties/{prop?.id}" class="text-gray-500 hover:text-gray-700">← Back</a>
    <h1 class="text-2xl font-bold text-gray-900">Edit Property</h1>
  </div>

  {#if !prop}
    <div class="card text-center text-gray-500 py-10">Property not found.</div>
  {:else}
    {#if form?.error}
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{form.error}</div>
    {/if}

    <form
      method="POST"
      use:enhance={() => {
        loading = true;
        return ({ result, update }) => {
          loading = false;
          if (result.type === 'failure') toast.error((result.data as any)?.error || 'Validation failed');
          else toast.success('Property updated!');
          update();
        };
      }}
      class="space-y-6"
    >
      <!-- Basic Info -->
      <div class="card space-y-4">
        <h2 class="text-lg font-semibold">Basic Information</h2>

        <div>
          <label class="label">Title *</label>
          <input name="title" class="input" required value={form?.values?.title ?? prop.title} />
        </div>

        <div>
          <label class="label">Property Type</label>
          <select name="propertyTypeId" class="input" bind:value={propertyTypeId}>
            <option value="">Select type...</option>
            {#each data.propertyTypes as pt}
              <option value={pt.id}>{pt.name}</option>
            {/each}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Area (sq.ft)</label>
            <input name="area" type="number" class="input" min="0" placeholder="e.g. 1200" bind:value={area} />
          </div>
          <div>
            <label class="label">Handover Date</label>
            <div class="grid grid-cols-2 gap-2">
              <select class="input text-sm" bind:value={handoverFrom}>
                <option value="">From...</option>
                {#each quarterOptions as q}
                  <option value={q}>{q}</option>
                {/each}
              </select>
              <select class="input text-sm" bind:value={handoverTo}>
                <option value="">To...</option>
                {#each quarterOptions as q}
                  <option value={q}>{q}</option>
                {/each}
              </select>
            </div>
            <input type="hidden" name="handoverDate" value={handoverDate} />
          </div>
        </div>

        <div>
          <label class="label">Description *</label>
          <RichEditor name="description" value={form?.values?.description ?? prop.description} />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Emirate *</label>
            <select name="location" class="input" required onchange={onEmirateChange}>
              <option value="">Select emirate...</option>
              {#each emirates as em}
                <option value={em.name} selected={(form?.values?.location ?? prop.location) === em.name}>{em.name}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="label">Developer</label>
            <input name="developer" class="input" value={form?.values?.developer ?? prop.developer ?? ''} />
          </div>
        </div>

        <!-- Map coordinates -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Latitude</label>
            <input name="latitude" type="number" step="any" class="input font-mono" placeholder="25.2048" bind:value={latitude} />
          </div>
          <div>
            <label class="label">Longitude</label>
            <input name="longitude" type="number" step="any" class="input font-mono" placeholder="55.2708" bind:value={longitude} />
          </div>
        </div>
        <p class="text-xs text-gray-400 -mt-2">Coordinates auto-fill when you change the emirate. Adjust for the exact project location.</p>

        <!-- Developer Logo -->
        <div>
          <label class="label">Developer Logo</label>
          <div class="flex items-center gap-4">
            {#if developerLogoUrl}
              <img src={developerLogoUrl} alt="Developer logo" class="h-14 w-14 object-contain rounded-lg border border-gray-200 bg-white" />
              <input type="hidden" name="developerLogo" value={developerLogoUrl} />
            {/if}
            <label class="cursor-pointer btn-secondary text-sm {uploadingLogo ? 'opacity-50' : ''}">
              {uploadingLogo ? 'Uploading...' : developerLogoUrl ? 'Change Logo' : 'Upload Logo'}
              <input type="file" accept="image/*" class="hidden" onchange={onLogoChange} disabled={uploadingLogo} />
            </label>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="label">Original Price (AED)</label>
            <input name="originalPrice" type="number" class="input" min="0" step="any" value={prop.originalPrice ?? ''} placeholder="Cost price" />
          </div>
          <div>
            <label class="label">Total Price (AED) *</label>
            <input name="totalPrice" type="number" class="input" required value={prop.totalPrice} />
          </div>
          <div>
            <label class="label">Available Stake</label>
            <input class="input bg-gray-50 text-gray-500 cursor-not-allowed" value="100% (10 shares)" disabled />
            <input type="hidden" name="totalShares" value="10" />
          </div>
        </div>

        <!-- Profit Type -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Profit Type *</label>
            <select name="profitType" class="input" required>
              <option value="SELLS_AT_PROFIT" selected={prop.profitType === 'SELLS_AT_PROFIT' || !prop.profitType}>
                Property sells at profit by
              </option>
              <option value="PRICE_INCREASE" selected={prop.profitType === 'PRICE_INCREASE'}>
                Property price increases by
              </option>
            </select>
          </div>
          <div>
            <label class="label">Profit Percentage (%) *</label>
            <input name="roi" type="number" step="0.1" class="input" required min="0" value={prop.roi} />
          </div>
        </div>

        <div>
          <label class="label">Status</label>
          <select name="status" class="input">
            {#each ['ACTIVE', 'COMING_SOON', 'SOLD_OUT', 'ARCHIVED'] as s}
              <option value={s} selected={prop.status === s}>{s}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Images -->
      <div class="card space-y-4">
        <h2 class="text-lg font-semibold">Property Images</h2>

        {#if imageUrls.length > 0}
          <div class="grid grid-cols-3 gap-3">
            {#each imageUrls as url, i}
              <div class="relative group">
                <img src={url} alt="Property" class="w-full h-28 object-cover rounded-lg border border-gray-200" />
                <button
                  type="button"
                  onclick={() => removeImage(i)}
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >✕</button>
                <input type="hidden" name="images" value={url} />
              </div>
            {/each}
          </div>
        {/if}

        <label class="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-colors {uploadingImages ? 'opacity-50' : ''}">
          {#if uploadingImages}
            <span class="text-sm text-primary-600 font-medium">Uploading...</span>
          {:else}
            <span class="text-sm text-gray-500">+ Add more images</span>
          {/if}
          <input type="file" accept="image/*" multiple class="hidden" onchange={onImagesChange} disabled={uploadingImages} />
        </label>
      </div>

      <!-- Payment Plan -->
      <div class="card space-y-4">
        <h2 class="text-lg font-semibold">Payment Plan</h2>

        <div class="flex items-center gap-4">
          <div class="flex-1">
            <label class="label">Down Payment %</label>
            <input type="number" bind:value={downPayment} min="0" max="100" class="input" />
          </div>
          <span class="pt-6 text-sm font-medium" class:text-green-600={totalPct === 100} class:text-red-500={totalPct !== 100}>
            Total: {totalPct}%
          </span>
        </div>

        {#each installments as inst, i}
          <div class="bg-gray-50 rounded-lg p-4 space-y-3">
            <div class="flex justify-between">
              <span class="text-xs font-medium text-gray-500">Installment {i + 1}</span>
              <button type="button" onclick={() => removeInstallment(i)} class="text-red-400 text-sm">Remove</button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="label text-xs">Name</label><input type="text" bind:value={inst.name} class="input text-sm" /></div>
              <div><label class="label text-xs">%</label><input type="number" bind:value={inst.percentage} class="input text-sm" /></div>
              <div>
                <label class="label text-xs">Due Type</label>
                <select bind:value={inst.dueType} class="input text-sm">
                  <option value="date">Date</option>
                  <option value="milestone">Milestone</option>
                </select>
              </div>
              <div>
                <label class="label text-xs">Value</label>
                {#if inst.dueType === 'date'}
                  <input type="date" bind:value={inst.dueValue} class="input text-sm" />
                {:else}
                  <select bind:value={inst.dueValue} class="input text-sm">
                    <option value="handover">On Handover</option>
                    <option value="foundation">Foundation</option>
                    <option value="structure">Structure</option>
                    <option value="finishing">Finishing</option>
                  </select>
                {/if}
              </div>
            </div>
          </div>
        {/each}

        <button type="button" onclick={addInstallment} class="text-primary-600 text-sm hover:underline">+ Add Installment</button>
        <input type="hidden" name="paymentPlan" value={paymentPlanJSON} />
      </div>

      <div class="flex justify-end gap-3">
        <a href="/properties/{prop.id}" class="btn-secondary">Cancel</a>
        <button type="submit" disabled={loading || totalPct !== 100} class="btn-primary">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  {/if}
</div>
