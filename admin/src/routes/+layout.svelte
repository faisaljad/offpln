<script lang="ts">
  import '../app.css';
  import Toast from '$lib/components/Toast.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { page } from '$app/stores';

  $: showSidebar = $page.url.pathname !== '/login';
</script>

<Toast />

{#if showSidebar}
  <div class="flex h-screen overflow-hidden">
    <Sidebar />
    <main class="flex-1 ml-64 overflow-y-auto bg-gray-50 min-h-screen">
      <div class="p-8">
        <slot />
      </div>
    </main>
  </div>
{:else}
  <slot />
{/if}
