<template>
  <div class="k8s-node-card p-2 border rounded" :style="{ borderColor: statusColor }">
    <Handle type="target" :position="Position.Top" />
    <div class="node-header d-flex justify-content-between align-items-center mb-1">
      <small class="kind text-muted">{{ data.kind }}</small>
      <!-- Placeholder for status icon or color dot -->
      <span v-if="data.status" class="status-dot" :style="{ backgroundColor: statusColor }" :title="data.status"></span>
    </div>
    <div class="node-body text-center">
      <strong class="name">{{ data.name }}</strong>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position, type NodeProps } from '@vue-flow/core';
import type { K8sResourceNodeData } from '@src/types/treeView.type';

// Define props using NodeProps for compatibility, specifying our data type
interface K8sNodeProps extends NodeProps {
  data: K8sResourceNodeData;
}
const props = defineProps<K8sNodeProps>();

// Determine color based on status (example implementation)
const statusColor = computed(() => {
  switch (props.data.status?.toLowerCase()) {
    case 'running':
    case 'ready':
    case 'active':
    case 'bound':
    case 'available':
      return 'var(--p-green-500)'; // PrimeVue success color
    case 'pending':
      return 'var(--p-yellow-500)'; // PrimeVue warning color
    case 'failed':
    case 'error':
      return 'var(--p-red-500)'; // PrimeVue error color
    default:
      return 'var(--p-gray-400)'; // Default color
  }
});
</script>

<style scoped>
.k8s-node-card {
  background-color: var(--p-surface-0); /* Card background */
  color: var(--p-text-color);
  min-width: 150px; /* Ensure a minimum width */
  border-width: 2px !important; /* Make border more prominent */
}

.kind {
  font-size: 0.75rem;
}

.name {
  font-size: 0.9rem;
  font-weight: bold;
}

.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: 5px;
}

/* Handle styling (optional, Vue Flow default theme handles them) */
:deep(.vue-flow__handle) {
  width: 8px;
  height: 8px;
  background-color: var(--p-surface-400);
}
</style>
