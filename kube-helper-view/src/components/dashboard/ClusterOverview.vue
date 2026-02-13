<template>
    <div class="cluster-overview">
        <Card>
            <template #title>Cluster Info</template>
            <template #content>
                <div class="info-row">
                    <strong>Context:</strong>
                    <span>{{ contextName }}</span>
                </div>
            </template>
        </Card>

        <div v-if="isArgoCDPresent" class="argocd-section">
            <Button label="ArgoCD Resources" size="small" icon="pi pi-external-link" @click="manageArgoCD" />
        </div>

        <Card>
            <template #title>Cluster Status</template>
            <template #content>
                <div class="stats-grid">
                    <!-- PODS -->
                    <div class="stat-item">
                        <div class="stat-header">
                            <i class="pi pi-box stat-icon"></i>
                            <span class="stat-label">Pods</span>
                        </div>
                        <div class="knob-container">
                            <div class="stat-details">
                                <div class="stat-main-value">{{ stats.pods.running }} / {{ stats.pods.total }}</div>
                                <div class="stat-sub-text" v-if="stats.pods.failed > 0"><span class="text-danger">{{
                                    stats.pods.failed }} Failed</span></div>
                                <div class="stat-sub-text" v-if="stats.pods.pending > 0"><span class="text-warn">{{
                                    stats.pods.pending }} Pending</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- NODES -->
                    <div class="stat-item">
                        <div class="stat-header">
                            <i class="pi pi-server stat-icon"></i>
                            <span class="stat-label">Nodes</span>
                        </div>
                        <div class="knob-container">
                            <div class="stat-details">
                                <div class="stat-main-value">{{ stats.nodes.ready }} / {{ stats.nodes.total }}</div>
                                <div class="stat-sub-text" v-if="stats.nodes.notReady > 0"><span class="text-danger">{{
                                    stats.nodes.notReady }} Not Ready</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- DEPLOYMENTS -->
                    <div class="stat-item">
                        <div class="stat-header">
                            <i class="pi pi-sitemap stat-icon"></i>
                            <span class="stat-label">Deployments</span>
                        </div>
                        <div class="knob-container">
                            <div class="stat-details">
                                <div class="stat-main-value">{{ stats.deployments.ready }} / {{ stats.deployments.total
                                    }}</div>
                                <div class="stat-sub-text" v-if="stats.deployments.failed > 0"><span
                                        class="text-danger">{{
                                            stats.deployments.failed }} Not Ready</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- SERVICES -->
                    <div class="stat-item">
                        <div class="stat-header">
                            <i class="pi pi-circle stat-icon"></i>
                            <span class="stat-label">Services</span>
                        </div>

                        <div class="knob-container">
                            <div class="stat-details">
                                <div class="stat-main-value">{{ stats.services.total }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { globalStore } from '../../store/store';

// PrimeVue components
import Card from 'primevue/card';
import Button from 'primevue/button';
import { MessageTypes } from '@common/messageTypes';
import type { DeployStats, NodeStats, PodStats, ServiceStats } from '@src/types/stats.type';

const contextName = ref('');
const namespace = ref<string | null>(null);
let pollingInterval: any = null;

const currentContext = globalStore.context;

const isArgoCDPresent = ref(false);

const manageArgoCD = () => {
    console.log('Manage ArgoCD clicked');
    // TODO: Implement Manage ArgoCD functionality
};


const stats = ref<{
    pods: PodStats;
    nodes: NodeStats;
    deployments: DeployStats;
    services: ServiceStats;
}>({
    pods: { total: 0, running: 0, failed: 0, pending: 0, data: { failed: [], pending: [] } },
    nodes: { total: 0, ready: 0, notReady: 0 },
    deployments: { total: 0, ready: 0, failed: 0 },
    services: { total: 0 }
});

// Message handling
const handleMessage = (event: MessageEvent) => {
    const message = event.data;
    if (message.type === MessageTypes.CLUSTER_STATS_RESULT) {
        stats.value = message.data;
    } else if (message.type === MessageTypes.ARGOCD_STATUS_RESULT) {
        isArgoCDPresent.value = message.data;
    }
};

const fetchStats = () => {
    tsvscode?.postMessage(
        {
            type: MessageTypes.GET_CLUSTER_STATS,
            context: currentContext
        });
};

const getArgoCDStatus = () => {
    tsvscode?.postMessage({
        type: MessageTypes.CHECK_ARGOCD_STATUS,
        context: currentContext
    });
};

onMounted(() => {
    contextName.value = globalStore.context || '';
    namespace.value = globalStore.namespace;

    window.addEventListener('message', handleMessage);

    // Initial fetch
    fetchStats();
    getArgoCDStatus();

    // Start polling (30s)
    pollingInterval = setInterval(fetchStats, 30000);
});

onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
    if (pollingInterval) clearInterval(pollingInterval);
});
</script>

<style scoped>
.cluster-overview {
    padding: 1rem;
    height: 100%;
    overflow-y: auto;
}

.argocd-section {
    margin-bottom: 10px;
    display: flex;
    justify-content: end;
    align-items: flex-end;
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.stat-item {
    padding: 1rem;
    background-color: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.simple-stat {
    flex-direction: row;
    /* Keep simple stats horizontal-ish */
    gap: 1rem;
    justify-content: flex-start;
    text-align: left;
}

.stat-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    margin-bottom: 0.5rem;
    justify-content: center;
}

.knob-container {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.stat-details {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    font-size: 0.85rem;
}

.stat-icon {
    font-size: 1.2rem;
    color: var(--primary-color);
}

.stat-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    text-transform: uppercase;
}

.stat-main-value {
    font-weight: bold;
    font-size: 1.1rem;
    margin-bottom: 0.25rem;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
}

.text-danger {
    color: var(--red-500);
}

.text-warn {
    color: var(--orange-500);
}

.text-success {
    color: var(--green-500);
}

/* Responsive tweaks */
@media (max-width: 1024px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }
}
</style>
