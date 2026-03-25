<script lang="ts">
  import { toast } from '$lib/stores/toast';
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 min-w-[300px]">
  {#each $toast as t (t.id)}
    <div
      class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slide-in"
      class:bg-green-50={t.type === 'success'}
      class:text-green-800={t.type === 'success'}
      class:border-green-200={t.type === 'success'}
      class:bg-red-50={t.type === 'error'}
      class:text-red-800={t.type === 'error'}
      class:border-red-200={t.type === 'error'}
      class:bg-blue-50={t.type === 'info'}
      class:text-blue-800={t.type === 'info'}
      class:bg-yellow-50={t.type === 'warning'}
      class:text-yellow-800={t.type === 'warning'}
      style="border-width: 1px;"
    >
      {#if t.type === 'success'}✓{:else if t.type === 'error'}✕{:else if t.type === 'info'}ℹ{:else}⚠{/if}
      <span class="flex-1">{t.message}</span>
      <button onclick={() => toast.remove(t.id)} class="opacity-60 hover:opacity-100">✕</button>
    </div>
  {/each}
</div>

<style>
  @keyframes slide-in {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .animate-slide-in {
    animation: slide-in 0.2s ease-out;
  }
</style>
