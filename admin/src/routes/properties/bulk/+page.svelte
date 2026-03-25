<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let file: File | null = null;
  let preview: any[] = [];
  let errors: any[] = [];
  let step: 'upload' | 'preview' | 'done' = 'upload';
  let loading = false;

  async function handleFileChange(e: Event) {
    file = (e.target as HTMLInputElement).files?.[0] || null;
  }

  async function handleUpload() {
    if (!file) return;
    loading = true;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/properties/bulk-parse', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      preview = data.validated || [];
      errors = data.errors || [];
      step = 'preview';
    } catch {
      toast.error('Failed to parse file');
    } finally {
      loading = false;
    }
  }

  async function handleConfirm() {
    loading = true;
    try {
      const token = $auth.token;
      const res = await fetch('/api/properties/bulk-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ properties: preview }),
      });
      const data = await res.json();
      toast.success(`${data.created} properties imported!`);
      step = 'done';
      setTimeout(() => goto('/properties'), 2000);
    } catch {
      toast.error('Import failed');
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Bulk Import — OffPlan Admin</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <a href="/properties" class="text-gray-500 hover:text-gray-700">← Back</a>
    <h1 class="text-2xl font-bold text-gray-900">Bulk Import Properties</h1>
  </div>

  {#if step === 'upload'}
    <div class="card space-y-6">
      <div>
        <h2 class="text-lg font-semibold mb-2">Upload CSV or Excel File</h2>
        <p class="text-sm text-gray-500 mb-4">Required columns:</p>
        <code class="block bg-gray-50 p-3 rounded-lg text-xs text-gray-700 font-mono">
          title, description, location, totalPrice, totalShares, roi, images, paymentPlanJSON
        </code>
      </div>

      <div
        class="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-primary-400 transition-colors"
      >
        <div class="text-4xl mb-3">📄</div>
        <p class="text-gray-600 mb-3">Drop your file here or</p>
        <label class="btn-primary cursor-pointer">
          Browse Files
          <input type="file" accept=".csv,.xlsx,.xls" onchange={handleFileChange} class="hidden" />
        </label>
        {#if file}
          <p class="text-sm text-gray-500 mt-3">Selected: <strong>{file.name}</strong></p>
        {/if}
      </div>

      <div class="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        <strong>Tip:</strong> For images, use comma-separated URLs. For paymentPlanJSON, use valid JSON string.
      </div>

      <button onclick={handleUpload} disabled={!file || loading} class="btn-primary w-full">
        {loading ? 'Parsing...' : 'Parse & Preview'}
      </button>
    </div>

  {:else if step === 'preview'}
    <div class="card space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Preview ({preview.length} valid rows)</h2>
        <div class="flex gap-3">
          <button onclick={() => (step = 'upload')} class="btn-secondary">Re-upload</button>
          <button onclick={handleConfirm} disabled={loading || preview.length === 0} class="btn-primary">
            {loading ? 'Importing...' : `Import ${preview.length} Properties`}
          </button>
        </div>
      </div>

      {#if errors.length > 0}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-700 font-medium mb-2">{errors.length} rows with errors (will be skipped):</p>
          {#each errors as err}
            <p class="text-red-600 text-sm">Row {err.row}: {JSON.stringify(err.errors.fieldErrors)}</p>
          {/each}
        </div>
      {/if}

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2 px-3 text-gray-500">Title</th>
              <th class="text-left py-2 px-3 text-gray-500">Location</th>
              <th class="text-left py-2 px-3 text-gray-500">Price</th>
              <th class="text-left py-2 px-3 text-gray-500">Shares</th>
              <th class="text-left py-2 px-3 text-gray-500">ROI</th>
            </tr>
          </thead>
          <tbody>
            {#each preview as row}
              <tr class="border-b border-gray-50">
                <td class="py-2 px-3 font-medium">{row.title}</td>
                <td class="py-2 px-3 text-gray-600">{row.location}</td>
                <td class="py-2 px-3">AED {Number(row.totalPrice).toLocaleString()}</td>
                <td class="py-2 px-3">{row.totalShares}</td>
                <td class="py-2 px-3 text-green-600">{row.roi}%</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

  {:else}
    <div class="card text-center py-12">
      <div class="text-6xl mb-4">✅</div>
      <h2 class="text-xl font-semibold text-gray-900">Import Complete!</h2>
      <p class="text-gray-500 mt-2">Redirecting to properties list...</p>
    </div>
  {/if}
</div>
