<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { toast } from '$lib/stores/toast';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  $: notifications = data.notifications ?? [];
  $: users = data.users ?? [];
  $: totalPages = data.pages ?? 1;
  $: currentPage = data.currentPage ?? 1;

  let activeTab: 'broadcast' | 'sendToUser' = 'broadcast';

  $: if (form?.success) {
    const action = (form as any).action;
    if (action === 'broadcast') toast.success('Broadcast sent to all investors');
    else if (action === 'sendToUser') toast.success('Notification sent to user');
    else if (action === 'triggerReminders') toast.success('Payment reminders triggered');
    invalidateAll();
  }
  $: if (form?.error) toast.error((form as any).error);

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function truncate(text: string, max = 60) {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '...' : text;
  }

  function typeBadgeClass(type: string): string {
    switch (type) {
      case 'payment_due': return 'bg-yellow-100 text-yellow-800';
      case 'new_property': return 'bg-blue-100 text-blue-800';
      case 'marketplace_listing': return 'bg-purple-100 text-purple-800';
      case 'investment_update': return 'bg-green-100 text-green-800';
      case 'admin_broadcast': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  function typeLabel(type: string): string {
    return type.replace(/_/g, ' ');
  }
</script>

<svelte:head>
  <title>Notifications — OffPlan Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Notifications</h1>
    <p class="text-sm text-gray-500 mt-1">Send notifications and view recent activity</p>
  </div>

  <!-- Send Notification -->
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900">Send Notification</h2>
      <form method="POST" action="?/triggerReminders" use:enhance>
        <button
          type="submit"
          class="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-semibold hover:bg-yellow-600 transition-colors"
        >
          Trigger Payment Reminders
        </button>
      </form>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-gray-200 mb-4">
      <button
        type="button"
        onclick={() => activeTab = 'broadcast'}
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'broadcast' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
      >
        Broadcast to All
      </button>
      <button
        type="button"
        onclick={() => activeTab = 'sendToUser'}
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'sendToUser' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
      >
        Send to User
      </button>
    </div>

    <!-- Broadcast Form -->
    {#if activeTab === 'broadcast'}
      <form method="POST" action="?/broadcast" use:enhance class="space-y-4">
        <div>
          <label for="broadcast-title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            id="broadcast-title"
            type="text"
            name="title"
            required
            placeholder="Notification title"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label for="broadcast-body" class="block text-sm font-medium text-gray-700 mb-1">Body</label>
          <textarea
            id="broadcast-body"
            name="body"
            required
            rows="3"
            placeholder="Notification message..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          ></textarea>
        </div>
        <button
          type="submit"
          class="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          Send Broadcast
        </button>
      </form>
    {/if}

    <!-- Send to User Form -->
    {#if activeTab === 'sendToUser'}
      <form method="POST" action="?/sendToUser" use:enhance class="space-y-4">
        <div>
          <label for="user-select" class="block text-sm font-medium text-gray-700 mb-1">User</label>
          <select
            id="user-select"
            name="userId"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select a user...</option>
            {#each users as user}
              <option value={user.id}>{user.name} ({user.email})</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="user-title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            id="user-title"
            type="text"
            name="title"
            required
            placeholder="Notification title"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label for="user-body" class="block text-sm font-medium text-gray-700 mb-1">Body</label>
          <textarea
            id="user-body"
            name="body"
            required
            rows="3"
            placeholder="Notification message..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          ></textarea>
        </div>
        <button
          type="submit"
          class="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          Send to User
        </button>
      </form>
    {/if}
  </div>

  <!-- Recent Notifications -->
  <div class="card">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h2>

    {#if notifications.length === 0}
      <div class="text-center py-12">
        <p class="text-3xl mb-2">📭</p>
        <p class="text-gray-500 font-medium">No notifications yet</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-3 font-semibold text-gray-600">User</th>
              <th class="text-left py-3 px-3 font-semibold text-gray-600">Type</th>
              <th class="text-left py-3 px-3 font-semibold text-gray-600">Title</th>
              <th class="text-left py-3 px-3 font-semibold text-gray-600">Body</th>
              <th class="text-left py-3 px-3 font-semibold text-gray-600">Date</th>
            </tr>
          </thead>
          <tbody>
            {#each notifications as notif}
              <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-3 px-3">
                  <p class="font-medium text-gray-900">{notif.user?.name ?? '—'}</p>
                  <p class="text-xs text-gray-400">{notif.user?.email ?? ''}</p>
                </td>
                <td class="py-3 px-3">
                  <span class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize {typeBadgeClass(notif.type)}">
                    {typeLabel(notif.type)}
                  </span>
                </td>
                <td class="py-3 px-3 font-medium text-gray-800">{notif.title}</td>
                <td class="py-3 px-3 text-gray-500" title={notif.body}>{truncate(notif.body)}</td>
                <td class="py-3 px-3 text-gray-500 whitespace-nowrap">{fmtDate(notif.createdAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
          {#each Array(totalPages) as _, i}
            <a
              href="?page={i + 1}"
              class="px-3 py-1 rounded text-sm font-medium transition-colors {currentPage === i + 1 ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}"
            >
              {i + 1}
            </a>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>
