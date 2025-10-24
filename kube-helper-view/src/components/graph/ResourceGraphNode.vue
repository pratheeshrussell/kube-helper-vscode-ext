<template>
    <div class="graph-node-card">
        <div class="graph-node-card-title">
            {{ props.data.name }}
        </div>
        <div class="graph-node-card-content">{{ props.data.resourceType }}</div>
    </div>

    <Handle v-if="shouldShowOutputNode" :class="['custom-handle', 'is-connected']" :id="nodeOutputId" type="source"
        :position="Position.Bottom" :connectable="false" />
    <Handle v-if="shouldShowInputNode" :class="['custom-handle', 'is-connected']" :id="nodeInputId" type="target"
        :position="Position.Top" :connectable="false" />
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { computed } from 'vue';
const props = defineProps({
    id: {
        type: String,
        required: true,
    },
    data: {
        type: Object,
        required: true,
    },
});

const { getEdges } = useVueFlow();

const shouldShowInputNode = computed(() => {
    return getEdges.value.some(edge => edge.target === props.id);
});

const shouldShowOutputNode = computed(() => {
    return getEdges.value.some(edge => edge.source === props.id);
});

const nodeInputId = computed(() => {
    return `${props.data.resourceType}/${props.data.name}-input`;
});
const nodeOutputId = computed(() => {
    return `${props.data.resourceType}/${props.data.name}-output`;
});

</script>

<style scoped>
.custom-handle {
    width: 24px;
    height: 8px;
    border-radius: 4px;
}

.custom-handle.is-connected {
    background: #8B5CF6;
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
}

.graph-node-card {
    background: var(--card-bg);
    border: var(--card-border);
    padding: 0.5rem;
    border-radius: 10px;
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
}

.graph-node-card-title {
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 2px;
}

.graph-node-card-content {
    font-size: 14px;
}
</style>
