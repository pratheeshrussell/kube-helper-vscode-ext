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
                <div class="stats-list">
                    <!-- PODS -->
                    <div class="stat-item">
                        <div class="stat-left">
                            <i class="pi pi-box stat-icon"></i>
                            <span class="stat-label">Pods</span>
                        </div>
                        <div class="stat-right">
                            <div class="stat-main-value">{{ stats.pods.running }} / {{ stats.pods.total }}</div>
                            <div class="stat-sub-texts" v-if="stats.pods.failed > 0 || stats.pods.pending > 0">
                                <span class="text-danger" v-if="stats.pods.failed > 0">{{ stats.pods.failed }} Failed</span>
                                <span class="text-warn" v-if="stats.pods.pending > 0">{{ stats.pods.pending }} Pending</span>
                            </div>
                        </div>
                    </div>

                    <!-- NODES -->
                    <div class="stat-item">
                        <div class="stat-left">
                            <i class="pi pi-server stat-icon"></i>
                            <span class="stat-label">Nodes</span>
                        </div>
                        <div class="stat-right">
                            <div class="stat-main-value">{{ stats.nodes.ready }} / {{ stats.nodes.total }}</div>
                            <div class="stat-sub-texts" v-if="stats.nodes.notReady > 0">
                                <span class="text-danger">{{ stats.nodes.notReady }} Not Ready</span>
                            </div>
                        </div>
                    </div>

                    <!-- DEPLOYMENTS -->
                    <div class="stat-item">
                        <div class="stat-left">
                            <i class="pi pi-sitemap stat-icon"></i>
                            <span class="stat-label">Deployments</span>
                        </div>
                        <div class="stat-right">
                            <div class="stat-main-value">{{ stats.deployments.ready }} / {{ stats.deployments.total }}</div>
                            <div class="stat-sub-texts" v-if="stats.deployments.failed > 0">
                                <span class="text-danger">{{ stats.deployments.failed }} Not Ready</span>
                            </div>
                        </div>
                    </div>

                    <!-- SERVICES -->
                    <div class="stat-item">
                        <div class="stat-left">
                            <i class="pi pi-circle stat-icon"></i>
                            <span class="stat-label">Services</span>
                        </div>
                        <div class="stat-right">
                            <div class="stat-main-value">{{ stats.services.total }}</div>
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
import { useRouter } from 'vue-router';

const contextName = ref('');
const namespace = ref<string | null>(null);
let pollingInterval: any = null;

const currentContext = globalStore.context;

const isArgoCDPresent = ref(false);
const router = useRouter();

const manageArgoCD = () => {
    router.push({ name: 'argocdoverview' });
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

.stats-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.stat-item {
    padding: 0.75rem 1.25rem;
    background-color: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
}

.stat-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.stat-right {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.stat-main-value {
    font-weight: bold;
    font-size: 1.1rem;
}

.stat-sub-texts {
    display: flex;
    gap: 0.5rem;
    font-size: 0.8rem;
}

.stat-icon {
    font-size: 1.25rem;
    color: var(--primary-color);
}

.stat-label {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    text-transform: uppercase;
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
</style>
