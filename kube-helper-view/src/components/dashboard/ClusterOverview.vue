<template>
    <div class="cluster-overview">
        <Card>
            <template #title>Cluster Info</template>
            <template #content>
                <div class="info-row">
                    <strong>Context:</strong>
                    <span>{{ contextName }}</span>
                </div>
                <div class="info-row">
                    <strong>Namespace:</strong>
                    <Tag :value="namespace || 'All Namespaces'" severity="info" />
                </div>
            </template>
        </Card>

        <Card style="margin-top: 1rem">
            <template #title>Quick Stats</template>
            <template #content>
                <div class="stats-grid">
                    <div class="stat-item">
                        <i class="pi pi-box stat-icon"></i>
                        <div>
                            <div class="stat-label">Pods</div>
                            <div class="stat-value">{{ stats.pods }}</div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="pi pi-server stat-icon"></i>
                        <div>
                            <div class="stat-label">Deployments</div>
                            <div class="stat-value">{{ stats.deployments }}</div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="pi pi-sitemap stat-icon"></i>
                        <div>
                            <div class="stat-label">Services</div>
                            <div class="stat-value">{{ stats.services }}</div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="pi pi-circle stat-icon"></i>
                        <div>
                            <div class="stat-label">Nodes</div>
                            <div class="stat-value">{{ stats.nodes }}</div>
                        </div>
                    </div>
                </div>
            </template>
        </Card>

        <Card style="margin-top: 1rem">
            <template #title>Quick Actions</template>
            <template #content>
                <div class="actions-grid">
                    <Button label="All Resources" icon="pi pi-list" outlined @click="$emit('navigate', 'resources')" />
                    <Button label="Graph View" icon="pi pi-share-alt" outlined @click="$emit('navigate', 'graph')" />
                    <Button label="Namespaces" icon="pi pi-folder" outlined @click="$emit('navigate', 'namespaces')" />
                </div>
            </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { globalStore } from '../../store/store';

// PrimeVue components
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Button from 'primevue/button';

const contextName = ref('');
const namespace = ref<string | null>(null);

const stats = ref({
    pods: '-',
    deployments: '-',
    services: '-',
    nodes: '-'
});

defineEmits<{
    navigate: [view: string];
}>();

onMounted(() => {
    contextName.value = globalStore.context || '';
    namespace.value = globalStore.namespace;

    // TODO: Fetch actual stats - for now showing placeholders
    // This could be done by running kubectl commands or using existing data
});
</script>

<style scoped>
.cluster-overview {
    padding: 1rem;
    height: 100%;
    overflow-y: auto;
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
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background-color: var(--surface-ground);
    border-radius: 6px;
}

.stat-icon {
    font-size: 1.5rem;
    color: var(--primary-color);
}

.stat-label {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    text-transform: uppercase;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
}

.actions-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
</style>
