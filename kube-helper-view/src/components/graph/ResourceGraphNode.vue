<template>
    <div class="graph-node-card" :class="statusClass">
        <div class="graph-node-card-header">
            <i :class="['pi', iconClass]" style="font-size: 1rem; margin-right: 0.5rem;"></i>
            <div class="graph-node-card-title" :title="props.data.name">
                {{ props.data.name }}
            </div>
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
import 'primeicons/primeicons.css';

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

const iconClass = computed(() => {
    const type = props.data.resourceType.toLowerCase();
    const map: Record<string, string> = {
        pod: 'pi-box',
        service: 'pi-share-alt',
        deployment: 'pi-cloud',
        replicaset: 'pi-clone',
        statefulset: 'pi-database',
        daemonset: 'pi-server',
        job: 'pi-cog',
        cronjob: 'pi-clock',
        configmap: 'pi-file',
        secret: 'pi-lock',
        ingress: 'pi-globe',
        persistentvolumeclaim: 'pi-save',
        serviceaccount: 'pi-id-card',
        node: 'pi-desktop',
        namespace: 'pi-folder',
    };
    return map[type] || 'pi-box'; // Fallback to generic box
});

const statusClass = computed(() => {
    // Simple heuristic for status
    const status = props.data.status;
    if (!status) return '';

    const type = props.data.resourceType.toLowerCase();

    // 1. Phase-based (Pod, PVC, etc.)
    if (status.phase) {
        if (['Running', 'Succeeded', 'Bound', 'Active'].includes(status.phase)) return 'status-success';
        if (['Failed', 'Error', 'Lost'].includes(status.phase)) return 'status-error';
        if (['Pending', 'Terminating', 'Released'].includes(status.phase)) return 'status-warning';
    }

    // 2. Condition-based (Node, Deployment, etc.)
    if (status.conditions) {
        // Check for Ready condition
        const readyCondition = status.conditions.find((c: any) => c.type === 'Ready');
        if (readyCondition) {
            if (readyCondition.status === 'True') return 'status-success';
            if (readyCondition.status === 'False') return 'status-error';
            if (readyCondition.status === 'Unknown') return 'status-warning';
        }
        // Check for Available condition (Deployment)
        const availableCondition = status.conditions.find((c: any) => c.type === 'Available');
        if (availableCondition && availableCondition.status === 'False') return 'status-error';
    }
    
    // 3. Replica-based (Deployment, ReplicaSet, StatefulSet)
    if (['deployment', 'replicaset', 'statefulset'].includes(type)) {
        if (status.readyReplicas === status.replicas && status.replicas > 0) return 'status-success';
        if (status.readyReplicas < status.replicas) return 'status-warning';
        if (status.unavailableReplicas > 0) return 'status-error';
    }

    return '';
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
    background: var(--card-bg, #1e1e1e);
    border: 1px solid var(--card-border, #333);
    padding: 0.5rem;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    min-width: 150px;
    transition: all 0.2s ease;
}

.graph-node-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.graph-node-card-header {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding-bottom: 4px;
}

.graph-node-card-title {
    font-weight: 600;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
}

.graph-node-card-content {
    font-size: 12px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Status Colors */
.status-success {
    border-left: 4px solid #10b981; /* Green */
}
.status-warning {
    border-left: 4px solid #f59e0b; /* Amber */
}
.status-error {
    border-left: 4px solid #ef4444; /* Red */
}
</style>
