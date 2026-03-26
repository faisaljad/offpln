<script lang="ts">
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  const nav = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/properties', label: 'Properties', icon: '🏗️' },
    { href: '/investments', label: 'Investments', icon: '💼' },
    { href: '/investors', label: 'Investors', icon: '👥' },
    { href: '/transfers', label: 'Transfers', icon: '🔄' },
    { href: '/reports', label: 'Reports', icon: '📊' },
    { href: '/payment-schedules', label: 'Payment Schedules', icon: '📅' },
    { href: '/payments', label: 'Payment Reviews', icon: '💳' },
    { href: '/admin-users', label: 'Admin Users', icon: '👤' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const lookupItems = [
    { href: '/lookups/property-types', label: 'Property Types', icon: '🏷️' },
    { href: '/lookups/emirates', label: 'Emirates', icon: '📍' },
  ];

  function logout() {
    auth.clearAuth();
    goto('/login');
  }
</script>

<aside class="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col z-40">
  <div class="px-6 py-5 border-b border-gray-800">
    <h1 class="text-xl font-bold text-gold-400">OffPlan Admin</h1>
    <p class="text-xs text-gray-400 mt-0.5">Investment Platform</p>
  </div>

  <nav class="flex-1 px-3 py-4 space-y-1">
    {#each nav as item}
      <a
        href={item.href}
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
        class:bg-primary-600={$page.url.pathname.startsWith(item.href)}
        class:text-white={$page.url.pathname.startsWith(item.href)}
        class:text-gray-400={!$page.url.pathname.startsWith(item.href)}
        class:hover:bg-gray-800={!$page.url.pathname.startsWith(item.href)}
      >
        <span>{item.icon}</span>
        {item.label}
      </a>
    {/each}

    <!-- Lookups section -->
    <div class="pt-3">
      <p class="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Lookups</p>
      {#each lookupItems as item}
        <a
          href={item.href}
          class="flex items-center gap-3 px-3 py-2.5 pl-6 rounded-lg text-sm font-medium transition-colors"
          class:bg-primary-600={$page.url.pathname.startsWith(item.href)}
          class:text-white={$page.url.pathname.startsWith(item.href)}
          class:text-gray-400={!$page.url.pathname.startsWith(item.href)}
          class:hover:bg-gray-800={!$page.url.pathname.startsWith(item.href)}
        >
          <span>{item.icon}</span>
          {item.label}
        </a>
      {/each}
    </div>
  </nav>

  <div class="px-3 py-4 border-t border-gray-800">
    {#if $auth.user}
      <div class="px-3 py-2 mb-2">
        <p class="text-sm font-medium text-white truncate">{$auth.user.name}</p>
        <p class="text-xs text-gray-400 truncate">{$auth.user.email}</p>
      </div>
    {/if}
    <button
      onclick={logout}
      class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
    >
      <span>🚪</span> Logout
    </button>
  </div>
</aside>
