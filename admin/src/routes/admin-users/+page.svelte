<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { toast } from '$lib/stores/toast';
  import type { PageData } from './$types';

  export let data: PageData;

  let showPasswordModal = false;
  let showPermissionsModal = false;
  let selectedUserId = '';
  let selectedUserName = '';
  let selectedUserRole = 'ADMIN';
  let selectedPermissions: string[] = [];
  let newPassword = '';

  const ALL_PERMISSIONS = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'properties', label: 'Properties', icon: '🏗️' },
    { key: 'investments', label: 'Investments', icon: '💼' },
    { key: 'investors', label: 'Investors', icon: '👥' },
    { key: 'transfers', label: 'Transfers', icon: '🔄' },
    { key: 'payments', label: 'Payment Reviews', icon: '💳' },
    { key: 'payment-schedules', label: 'Payment Schedules', icon: '📅' },
    { key: 'reports', label: 'Reports', icon: '📊' },
    { key: 'lookups', label: 'Lookups', icon: '📋' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function openPasswordModal(userId: string, userName: string) {
    selectedUserId = userId;
    selectedUserName = userName;
    newPassword = '';
    showPasswordModal = true;
  }

  function openPermissionsModal(admin: any) {
    selectedUserId = admin.id;
    selectedUserName = admin.name;
    selectedUserRole = admin.role;
    selectedPermissions = [...(admin.permissions || [])];
    showPermissionsModal = true;
  }

  function togglePermission(key: string) {
    if (selectedPermissions.includes(key)) {
      selectedPermissions = selectedPermissions.filter(p => p !== key);
    } else {
      selectedPermissions = [...selectedPermissions, key];
    }
  }

  function selectAllPermissions() {
    selectedPermissions = ALL_PERMISSIONS.map(p => p.key);
  }

  function clearAllPermissions() {
    selectedPermissions = [];
  }

  function confirmDelete(userName: string) {
    return confirm(`Are you sure you want to delete admin user "${userName}"? This action cannot be undone.`);
  }
</script>

<svelte:head>
  <title>Admin Users — OffPlan Admin</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Admin Users</h1>
    <p class="text-gray-500 text-sm mt-1">Manage administrator accounts and permissions</p>
  </div>

  <!-- Add Admin User -->
  <div class="card">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Add Admin User</h2>
    <form
      method="POST"
      action="?/create"
      use:enhance={() => {
        return async ({ result, update }) => {
          if (result.type === 'success') {
            toast.success('Admin user created');
            await invalidateAll();
            await update({ reset: true });
          } else if (result.type === 'failure') {
            toast.error(result.data?.error || 'Failed to create');
          }
        };
      }}
    >
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input type="text" id="name" name="name" required class="input w-full" placeholder="Full name" />
        </div>
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" id="email" name="email" required class="input w-full" placeholder="email@example.com" />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" id="password" name="password" required minlength="6" class="input w-full" placeholder="Min 6 chars" />
        </div>
        <div>
          <label for="role" class="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select id="role" name="role" class="input w-full">
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>
      </div>

      <div class="mt-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
        <div class="flex flex-wrap gap-2">
          {#each ALL_PERMISSIONS as perm}
            <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 cursor-pointer text-sm transition-colors">
              <input type="checkbox" name="permissions" value={perm.key} class="rounded border-gray-300 text-primary-600" />
              <span>{perm.icon}</span>
              <span>{perm.label}</span>
            </label>
          {/each}
        </div>
      </div>

      <div class="mt-4">
        <button type="submit" class="btn-primary">Add User</button>
      </div>
    </form>
  </div>

  <!-- Admin Users Table -->
  <div class="card">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Admin Users ({(data.admins ?? []).length})</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Email</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Role</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Permissions</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Created</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each (data.admins ?? []) as admin}
            <tr class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                    {admin.name?.[0] ?? '?'}
                  </div>
                  <span class="font-medium text-gray-900">{admin.name}</span>
                </div>
              </td>
              <td class="py-3 px-4 text-gray-600">{admin.email}</td>
              <td class="py-3 px-4">
                <span class={admin.role === 'SUPER_ADMIN' ? 'badge-approved' : 'badge-pending'}>
                  {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                </span>
              </td>
              <td class="py-3 px-4">
                {#if admin.role === 'SUPER_ADMIN'}
                  <span class="text-xs text-green-600 font-medium">All Access</span>
                {:else if (admin.permissions ?? []).length > 0}
                  <div class="flex flex-wrap gap-1">
                    {#each admin.permissions.slice(0, 3) as perm}
                      <span class="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{perm}</span>
                    {/each}
                    {#if admin.permissions.length > 3}
                      <span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{admin.permissions.length - 3}</span>
                    {/if}
                  </div>
                {:else}
                  <span class="text-xs text-gray-400">No permissions</span>
                {/if}
              </td>
              <td class="py-3 px-4 text-gray-500 text-xs">{fmtDate(admin.createdAt)}</td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="text-xs text-blue-600 hover:underline font-medium"
                    onclick={() => openPermissionsModal(admin)}
                  >
                    Permissions
                  </button>
                  <button
                    type="button"
                    class="text-xs text-primary-600 hover:underline font-medium"
                    onclick={() => openPasswordModal(admin.id, admin.name)}
                  >
                    Password
                  </button>
                  {#if admin.role !== 'SUPER_ADMIN'}
                    <form
                      method="POST"
                      action="?/delete"
                      class="inline"
                      use:enhance={({ cancel }) => {
                        if (!confirmDelete(admin.name)) { cancel(); return; }
                        return async ({ result }) => {
                          if (result.type === 'success') {
                            toast.success('Admin user deleted');
                            await invalidateAll();
                          } else if (result.type === 'failure') {
                            toast.error(result.data?.error || 'Failed to delete');
                          }
                        };
                      }}
                    >
                      <input type="hidden" name="id" value={admin.id} />
                      <button type="submit" class="text-xs text-red-600 hover:underline font-medium">Delete</button>
                    </form>
                  {/if}
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="6" class="py-12 text-center text-gray-400">No admin users found</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Password Change Modal -->
{#if showPasswordModal}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showPasswordModal = false}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onclick={(e) => e.stopPropagation()}>
      <h3 class="text-lg font-semibold text-gray-900 mb-1">Change Password</h3>
      <p class="text-sm text-gray-500 mb-4">Set a new password for <strong>{selectedUserName}</strong></p>
      <form
        method="POST"
        action="?/changePassword"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === 'success') {
              toast.success('Password changed');
              showPasswordModal = false;
              await invalidateAll();
            } else if (result.type === 'failure') {
              toast.error(result.data?.error || 'Failed');
            }
          };
        }}
      >
        <input type="hidden" name="id" value={selectedUserId} />
        <div class="mb-4">
          <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input type="password" id="newPassword" name="newPassword" required minlength="6" bind:value={newPassword} class="input w-full" placeholder="Min 6 characters" />
        </div>
        <div class="flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200" onclick={() => showPasswordModal = false}>Cancel</button>
          <button type="submit" class="btn-primary">Confirm</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Permissions Modal -->
{#if showPermissionsModal}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showPermissionsModal = false}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4" onclick={(e) => e.stopPropagation()}>
      <h3 class="text-lg font-semibold text-gray-900 mb-1">Manage Permissions</h3>
      <p class="text-sm text-gray-500 mb-4">
        Configure access for <strong>{selectedUserName}</strong>
      </p>
      <form
        method="POST"
        action="?/updatePermissions"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === 'success') {
              toast.success('Permissions updated');
              showPermissionsModal = false;
              await invalidateAll();
            } else if (result.type === 'failure') {
              toast.error(result.data?.error || 'Failed');
            }
          };
        }}
      >
        <input type="hidden" name="id" value={selectedUserId} />

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select name="role" class="input w-full" bind:value={selectedUserRole}>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>

        {#if selectedUserRole !== 'SUPER_ADMIN'}
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-gray-700">Page Access</label>
              <div class="flex gap-2">
                <button type="button" class="text-xs text-blue-600 hover:underline" onclick={selectAllPermissions}>Select All</button>
                <span class="text-gray-300">|</span>
                <button type="button" class="text-xs text-gray-500 hover:underline" onclick={clearAllPermissions}>Clear All</button>
              </div>
            </div>
            <div class="space-y-2">
              {#each ALL_PERMISSIONS as perm}
                <label
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors {selectedPermissions.includes(perm.key) ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}"
                >
                  <input
                    type="checkbox"
                    name="permissions"
                    value={perm.key}
                    checked={selectedPermissions.includes(perm.key)}
                    onchange={() => togglePermission(perm.key)}
                    class="rounded border-gray-300 text-primary-600"
                  />
                  <span class="text-base">{perm.icon}</span>
                  <span class="text-sm font-medium text-gray-700">{perm.label}</span>
                </label>
              {/each}
            </div>
          </div>
        {:else}
          <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p class="text-sm text-green-800 font-medium">Super Admin has full access to all pages and features.</p>
          </div>
        {/if}

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200" onclick={() => showPermissionsModal = false}>Cancel</button>
          <button type="submit" class="btn-primary">Save Permissions</button>
        </div>
      </form>
    </div>
  </div>
{/if}
