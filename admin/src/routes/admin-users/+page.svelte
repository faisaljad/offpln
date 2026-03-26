<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { toast } from '$lib/stores/toast';
  import type { PageData } from './$types';

  export let data: PageData;

  let showPasswordModal = false;
  let selectedUserId = '';
  let selectedUserName = '';
  let newPassword = '';

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function openPasswordModal(userId: string, userName: string) {
    selectedUserId = userId;
    selectedUserName = userName;
    newPassword = '';
    showPasswordModal = true;
  }

  function closePasswordModal() {
    showPasswordModal = false;
    selectedUserId = '';
    selectedUserName = '';
    newPassword = '';
  }

  function confirmDelete(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to delete admin user "${userName}"? This action cannot be undone.`)) {
      return false;
    }
    return true;
  }
</script>

<svelte:head>
  <title>Admin Users — OffPlan Admin</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Admin Users</h1>
    <p class="text-gray-500 text-sm mt-1">Manage administrator accounts</p>
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
            toast.success(result.data?.message || 'Admin user created successfully');
            await invalidateAll();
            await update({ reset: true });
          } else if (result.type === 'failure') {
            toast.error(result.data?.error || 'Failed to create admin user');
          }
        };
      }}
    >
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <input type="password" id="password" name="password" required minlength="6" class="input w-full" placeholder="Min 6 characters" />
        </div>
      </div>
      <div class="mt-4">
        <button type="submit" class="btn-primary">Add User</button>
      </div>
    </form>
  </div>

  <!-- Admin Users Table -->
  <div class="card">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Admin Users</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Email</th>
            <th class="text-left py-3 px-4 text-gray-500 font-medium">Role</th>
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
                  {admin.role}
                </span>
              </td>
              <td class="py-3 px-4 text-gray-500 text-xs">{fmtDate(admin.createdAt)}</td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="text-xs text-primary-600 hover:underline font-medium"
                    onclick={() => openPasswordModal(admin.id, admin.name)}
                  >
                    Change Password
                  </button>
                  {#if admin.role !== 'SUPER_ADMIN'}
                    <form
                      method="POST"
                      action="?/delete"
                      class="inline"
                      use:enhance={({ cancel }) => {
                        if (!confirmDelete(admin.id, admin.name)) {
                          cancel();
                          return;
                        }
                        return async ({ result }) => {
                          if (result.type === 'success') {
                            toast.success(result.data?.message || 'Admin user deleted');
                            await invalidateAll();
                          } else if (result.type === 'failure') {
                            toast.error(result.data?.error || 'Failed to delete admin user');
                          }
                        };
                      }}
                    >
                      <input type="hidden" name="id" value={admin.id} />
                      <button type="submit" class="text-xs text-red-600 hover:underline font-medium">
                        Delete
                      </button>
                    </form>
                  {/if}
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="5" class="py-12 text-center text-gray-400">No admin users found</td>
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
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={closePasswordModal}>
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
              toast.success(result.data?.message || 'Password changed successfully');
              closePasswordModal();
              await invalidateAll();
            } else if (result.type === 'failure') {
              toast.error(result.data?.error || 'Failed to change password');
            }
          };
        }}
      >
        <input type="hidden" name="id" value={selectedUserId} />
        <div class="mb-4">
          <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            required
            minlength="6"
            bind:value={newPassword}
            class="input w-full"
            placeholder="Min 6 characters"
          />
        </div>
        <div class="flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" onclick={closePasswordModal}>
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            Confirm
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
