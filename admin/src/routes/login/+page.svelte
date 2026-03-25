<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  export let form: ActionData;
  let loading = false;
</script>

<svelte:head>
  <title>Admin Login — OffPlan</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white">OffPlan Admin</h1>
      <p class="text-gray-400 mt-2">Fractional Investment Platform</p>
    </div>

    <div class="bg-white rounded-2xl shadow-xl p-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>

      {#if form?.error}
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {form.error}
        </div>
      {/if}

      <form
        method="POST"
        use:enhance={() => {
          loading = true;
          return ({ update }) => {
            update().finally(() => (loading = false));
          };
        }}
        class="space-y-4"
      >
        <div>
          <label class="label" for="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            class="input"
            placeholder="admin@offplan.com"
            value={form?.email ?? ''}
          />
        </div>

        <div>
          <label class="label" for="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            class="input"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          class="btn-primary w-full mt-2 flex items-center justify-center gap-2"
        >
          {#if loading}
            <span class="animate-spin">⏳</span> Signing in...
          {:else}
            Sign In
          {/if}
        </button>
      </form>
    </div>
  </div>
</div>
