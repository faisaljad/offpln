<script lang="ts">
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  const nav = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊', perm: 'dashboard' },
    { href: '/properties', label: 'Properties', icon: '🏗️', perm: 'properties' },
    { href: '/investments', label: 'Investments', icon: '💼', perm: 'investments' },
    { href: '/investors', label: 'Investors', icon: '👥', perm: 'investors' },
    { href: '/transfers', label: 'Transfers', icon: '🔄', perm: 'transfers' },
    { href: '/reports', label: 'Reports', icon: '📊', perm: 'reports' },
    { href: '/payment-schedules', label: 'Payment Schedules', icon: '📅', perm: 'payment-schedules' },
    { href: '/payments', label: 'Payment Reviews', icon: '💳', perm: 'payments' },
    { href: '/settings', label: 'Settings', icon: '⚙️', perm: 'settings' },
  ];

  const lookupItems = [
    { href: '/lookups/property-types', label: 'Property Types', icon: '🏷️' },
    { href: '/lookups/emirates', label: 'Emirates', icon: '📍' },
  ];

  $: user = $auth.user;
  $: isSuperAdmin = user?.role === 'SUPER_ADMIN';
  $: userPermissions = (user?.permissions as string[]) ?? [];

  function hasAccess(perm: string): boolean {
    if (isSuperAdmin) return true;
    return userPermissions.includes(perm);
  }

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

  <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
    {#each nav as item}
      {#if hasAccess(item.perm)}
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
      {/if}
    {/each}

    <!-- Lookups section -->
    {#if hasAccess('lookups')}
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
    {/if}

    <!-- Admin Users — SUPER_ADMIN only -->
    {#if isSuperAdmin}
      <div class="pt-3">
        <p class="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Administration</p>
        <a
          href="/admin-users"
          class="flex items-center gap-3 px-3 py-2.5 pl-6 rounded-lg text-sm font-medium transition-colors"
          class:bg-primary-600={$page.url.pathname.startsWith('/admin-users')}
          class:text-white={$page.url.pathname.startsWith('/admin-users')}
          class:text-gray-400={!$page.url.pathname.startsWith('/admin-users')}
          class:hover:bg-gray-800={!$page.url.pathname.startsWith('/admin-users')}
        >
          <span>👤</span>
          Admin Users
        </a>
      </div>
    {/if}
  </nav>

  <div class="px-3 py-4 border-t border-gray-800">
    {#if user}
      <div class="px-3 py-2 mb-2">
        <p class="text-sm font-medium text-white truncate">{user.name}</p>
        <p class="text-xs text-gray-400 truncate">{user.email}</p>
        <p class="text-xs text-gray-500 mt-0.5">{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
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
