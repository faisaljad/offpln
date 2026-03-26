<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  export let form: ActionData;
  let loading = false;
  let otpValues = ['', '', '', '', '', ''];
  let otpInputs: HTMLInputElement[] = [];

  $: otpStep = form?.otpRequired === true;
  $: otpCode = otpValues.join('');

  function handleOtpInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    otpValues[index] = value;
    otpValues = [...otpValues];
    if (value && index < 5) {
      otpInputs[index + 1]?.focus();
    }
  }

  function handleOtpKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputs[index - 1]?.focus();
    }
  }
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
      {#if !otpStep}
        <!-- Step 1: Email & Password -->
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>

        {#if form?.error && !form?.otpRequired}
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {form.error}
          </div>
        {/if}

        <form
          method="POST"
          action="?/login"
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
              Continue
            {/if}
          </button>
        </form>
      {:else}
        <!-- Step 2: OTP Verification -->
        <div class="text-center mb-6">
          <div class="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">🔒</span>
          </div>
          <h2 class="text-xl font-semibold text-gray-900">Verification Code</h2>
          <p class="text-gray-500 text-sm mt-2">
            Enter the 6-digit code sent to<br />
            <strong class="text-gray-700">{form?.email}</strong>
          </p>
        </div>

        {#if form?.error && form?.otpRequired}
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {form.error}
          </div>
        {/if}

        {#if form?.resent}
          <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            New code sent successfully
          </div>
        {/if}

        <form
          method="POST"
          action="?/verifyOtp"
          use:enhance={() => {
            loading = true;
            return ({ update }) => {
              update().finally(() => (loading = false));
            };
          }}
          class="space-y-5"
        >
          <input type="hidden" name="email" value={form?.email ?? ''} />
          <input type="hidden" name="code" value={otpCode} />

          <div class="flex justify-center gap-3">
            {#each otpValues as val, i}
              <input
                bind:this={otpInputs[i]}
                type="text"
                maxlength="1"
                inputmode="numeric"
                value={val}
                oninput={(e) => handleOtpInput(i, e)}
                onkeydown={(e) => handleOtpKeydown(i, e)}
                class="w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all {val ? 'border-primary-400 bg-primary-50' : 'border-gray-200 bg-gray-50'}"
              />
            {/each}
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            class="btn-primary w-full flex items-center justify-center gap-2"
          >
            {#if loading}
              <span class="animate-spin">⏳</span> Verifying...
            {:else}
              Verify & Sign In
            {/if}
          </button>
        </form>

        <div class="flex items-center justify-between mt-4">
          <form method="POST" action="?/resendOtp" use:enhance>
            <input type="hidden" name="email" value={form?.email ?? ''} />
            <input type="hidden" name="password" value={form?.password ?? ''} />
            <button type="submit" class="text-sm text-primary-600 hover:underline font-medium">
              Resend Code
            </button>
          </form>

          <button
            type="button"
            onclick={() => { form = null; otpValues = ['','','','','','']; }}
            class="text-sm text-gray-500 hover:underline"
          >
            ← Back to login
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
