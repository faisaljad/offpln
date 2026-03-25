<script lang="ts">
  export let title: string;
  export let value: string | number;
  export let icon: string;
  export let color: 'blue' | 'green' | 'yellow' | 'purple' = 'blue';

  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };
</script>

<div class="card flex items-center gap-4">
  <div class="p-3 rounded-xl text-2xl {colors[color]}">
    {icon}
  </div>
  <div>
    <p class="text-sm text-gray-500 font-medium">{title}</p>
    <p class="text-2xl font-bold text-gray-900">{value}</p>
  </div>
</div>
