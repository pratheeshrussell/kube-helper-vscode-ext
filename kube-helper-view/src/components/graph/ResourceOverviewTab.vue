<template>
    <div class="resource-overview-tab">
        <!-- Top Summary Card -->
        <div class="summary-card mb-3">
            <div class="summary-header">
                <div class="summary-title-group">
                    <span class="summary-kind">{{ node?.data?.resourceType || node?.resourceType }}</span>
                    <h4 class="summary-name">{{ node?.data?.name || node?.name }}</h4>
                </div>
                <div class="summary-health">
                    <Tag 
                        :value="healthStatus.toUpperCase()" 
                        :severity="healthSeverity" 
                        class="health-tag"
                    />
                </div>
            </div>
            
            <div v-if="healthReason" class="health-reason-alert mb-2">
                <i class="pi pi-info-circle me-1" /> {{ healthReason }}
            </div>

            <div class="summary-meta-grid">
                <div class="meta-item" v-if="namespace">
                    <span class="meta-label">Namespace:</span>
                    <span class="meta-val">{{ namespace }}</span>
                </div>
                <div class="meta-item" v-if="creationTime">
                    <span class="meta-label">Created:</span>
                    <span class="meta-val">{{ creationAge }} ({{ creationTime }})</span>
                </div>
                <div class="meta-item" v-if="restartsCount !== undefined && restartsCount > 0">
                    <span class="meta-label">Total Restarts:</span>
                    <span class="meta-val text-warning font-bold">⚠️ {{ restartsCount }}</span>
                </div>
            </div>
        </div>

        <!-- Workload Replica Metrics (Deployments, ReplicaSets, StatefulSets, DaemonSets) -->
        <div v-if="hasReplicasInfo" class="replicas-section mb-3">
            <h5 class="section-title">Replica Status</h5>
            <div class="replica-cards-grid">
                <div class="replica-card">
                    <span class="replica-num">{{ desiredReplicas }}</span>
                    <span class="replica-label">Desired</span>
                </div>
                <div class="replica-card" :class="{ 'card-success': readyReplicas === desiredReplicas }">
                    <span class="replica-num">{{ readyReplicas }}</span>
                    <span class="replica-label">Ready</span>
                </div>
                <div class="replica-card">
                    <span class="replica-num">{{ updatedReplicas }}</span>
                    <span class="replica-label">Updated</span>
                </div>
                <div class="replica-card" :class="{ 'card-danger': unavailableReplicas > 0 }">
                    <span class="replica-num">{{ unavailableReplicas }}</span>
                    <span class="replica-label">Unavailable</span>
                </div>
            </div>
        </div>

        <!-- Pod Group Summary Table (for PodGroup nodes) -->
        <div v-if="isPodGroup && podGroupData" class="podgroup-section mb-3">
            <h5 class="section-title">Grouped Pods ({{ podGroupData.readyCount }}/{{ podGroupData.totalCount }} Ready)</h5>
            <DataTable :value="podGroupData.pods" size="small" class="podgroup-table">
                <Column field="name" header="Pod Name" style="min-width: 150px">
                    <template #body="{ data }">
                        <strong>{{ data.name }}</strong>
                    </template>
                </Column>
                <Column field="phase" header="Phase" style="width: 110px">
                    <template #body="{ data }">
                        <Tag :value="data.phase" :severity="data.ready ? 'success' : (data.health === 'degraded' ? 'danger' : 'warn')" />
                    </template>
                </Column>
                <Column field="restarts" header="Restarts" style="width: 90px">
                    <template #body="{ data }">
                        <span :class="{ 'text-danger font-bold': data.restarts > 0 }">{{ data.restarts }}</span>
                    </template>
                </Column>
                <Column field="healthReason" header="Status Detail">
                    <template #body="{ data }">
                        <span>{{ data.healthReason || '-' }}</span>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Service Ports & Networking (Services) -->
        <div v-if="servicePorts.length > 0" class="service-ports-section mb-3">
            <h5 class="section-title">Service Ports & Routing</h5>
            <div class="summary-meta-grid mb-2">
                <div class="meta-item">
                    <span class="meta-label">Type:</span>
                    <span class="meta-val">{{ rawData.serviceType || rawData.spec?.type || 'ClusterIP' }}</span>
                </div>
                <div class="meta-item" v-if="rawData.clusterIP || rawData.spec?.clusterIP">
                    <span class="meta-label">Cluster IP:</span>
                    <span class="meta-val font-mono">{{ rawData.clusterIP || rawData.spec?.clusterIP }}</span>
                </div>
                <div class="meta-item" v-if="rawData.externalName || rawData.spec?.externalName">
                    <span class="meta-label">External Name:</span>
                    <span class="meta-val font-mono">{{ rawData.externalName || rawData.spec?.externalName }}</span>
                </div>
            </div>
            <DataTable :value="servicePorts" size="small" class="ports-table">
                <Column field="name" header="Port Name">
                    <template #body="{ data }">
                        <span>{{ data.name || '-' }}</span>
                    </template>
                </Column>
                <Column field="port" header="Port" style="width: 90px" />
                <Column field="targetPort" header="Target Port" style="width: 110px" />
                <Column field="protocol" header="Protocol" style="width: 90px" />
                <Column field="nodePort" header="NodePort" style="width: 100px">
                    <template #body="{ data }">
                        <span>{{ data.nodePort || '-' }}</span>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Containers Status (Pods) -->
        <div v-if="containerStatuses.length > 0" class="containers-section mb-3">
            <h5 class="section-title">Container Statuses ({{ containerStatuses.length }})</h5>
            <div class="container-list">
                <div v-for="(cs, idx) in containerStatuses" :key="idx" class="container-card">
                    <div class="container-header">
                        <div class="container-name-row">
                            <i class="pi pi-box me-1" />
                            <strong>{{ cs.name }}</strong>
                            <Tag :value="cs.ready ? 'Ready' : 'Not Ready'" :severity="cs.ready ? 'success' : 'danger'" class="ms-2" />
                        </div>
                        <span class="container-restarts" v-if="cs.restartCount > 0">
                            {{ cs.restartCount }} restarts
                        </span>
                    </div>
                    <div class="container-image">
                        <span class="image-label">Image:</span> {{ cs.image }}
                    </div>
                    <div class="container-state">
                        <span class="state-label">State:</span>
                        <span v-if="cs.state?.running" class="text-success">Running since {{ formatTime(cs.state.running.startedAt) }}</span>
                        <span v-else-if="cs.state?.waiting" class="text-warning">
                            Waiting: <strong>{{ cs.state.waiting.reason }}</strong>
                            <span v-if="cs.state.waiting.message"> - {{ cs.state.waiting.message }}</span>
                        </span>
                        <span v-else-if="cs.state?.terminated" class="text-danger">
                            Terminated: <strong>{{ cs.state.terminated.reason || 'Exit Code ' + cs.state.terminated.exitCode }}</strong>
                            <span v-if="cs.state.terminated.message"> - {{ cs.state.terminated.message }}</span>
                        </span>
                        <span v-else>Unknown</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Kubernetes Conditions Table -->
        <div v-if="conditions.length > 0" class="conditions-section mb-3">
            <h5 class="section-title">Conditions</h5>
            <DataTable :value="conditions" size="small" class="conditions-table">
                <Column field="type" header="Type" style="min-width: 130px">
                    <template #body="{ data }">
                        <strong>{{ data.type }}</strong>
                    </template>
                </Column>
                <Column field="status" header="Status" style="width: 90px">
                    <template #body="{ data }">
                        <Tag 
                            :value="data.status" 
                            :severity="getConditionSeverity(data.type, data.status)" 
                        />
                    </template>
                </Column>
                <Column field="reason" header="Reason" style="min-width: 120px">
                    <template #body="{ data }">
                        <span>{{ data.reason || '-' }}</span>
                    </template>
                </Column>
                <Column field="message" header="Message">
                    <template #body="{ data }">
                        <span class="condition-message">{{ data.message || '-' }}</span>
                    </template>
                </Column>
                <Column field="lastTransitionTime" header="Age" style="width: 100px">
                    <template #body="{ data }">
                        <span>{{ formatAge(data.lastTransitionTime) }}</span>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Labels & Selectors -->
        <div v-if="labelsCount > 0" class="labels-section">
            <h5 class="section-title">Labels</h5>
            <div class="labels-grid">
                <span v-for="(val, key) in labels" :key="key" class="label-pill">
                    <span class="label-key">{{ key }}</span>: <span class="label-val">{{ val }}</span>
                </span>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import TimeAgo from 'javascript-time-ago';
import Tag from 'primevue/tag';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const props = defineProps<{
    node?: any;
}>();

const timeAgo = new TimeAgo('en-US');

const rawData = computed(() => {
    return props.node?.data || props.node || {};
});

const healthStatus = computed(() => {
    return rawData.value.health?.status || 'unknown';
});

const healthReason = computed(() => {
    return rawData.value.health?.reason || '';
});

const healthSeverity = computed(() => {
    switch (healthStatus.value) {
        case 'healthy': return 'success';
        case 'progressing': return 'warn';
        case 'degraded': return 'danger';
        case 'suspended': return 'secondary';
        default: return 'info';
    }
});

const namespace = computed(() => {
    return rawData.value.metadata?.namespace || rawData.value.status?.namespace || '';
});

const creationTime = computed(() => {
    return rawData.value.metadata?.creationTimestamp || rawData.value.age || '';
});

const creationAge = computed(() => {
    if (!creationTime.value) return '';
    try {
        return timeAgo.format(new Date(creationTime.value));
    } catch {
        return '';
    }
});

const restartsCount = computed(() => {
    return rawData.value.restarts;
});

const isPodGroup = computed(() => {
    return !!rawData.value.isPodGroup || !!rawData.value.podGroup;
});

const podGroupData = computed(() => {
    return rawData.value.podGroup || null;
});

const servicePorts = computed(() => {
    return rawData.value.servicePorts || rawData.value.spec?.ports || [];
});

const hasReplicasInfo = computed(() => {
    const status = rawData.value.status;
    return status && (
        status.replicas !== undefined ||
        status.readyReplicas !== undefined ||
        status.desiredNumberScheduled !== undefined
    );
});


const desiredReplicas = computed(() => {
    const status = rawData.value.status;
    const spec = rawData.value.spec;
    return spec?.replicas ?? status?.replicas ?? status?.desiredNumberScheduled ?? 0;
});

const readyReplicas = computed(() => {
    const status = rawData.value.status;
    return status?.readyReplicas ?? status?.numberReady ?? 0;
});

const updatedReplicas = computed(() => {
    const status = rawData.value.status;
    return status?.updatedReplicas ?? status?.updatedNumberScheduled ?? readyReplicas.value;
});

const unavailableReplicas = computed(() => {
    const status = rawData.value.status;
    return status?.unavailableReplicas ?? status?.numberUnavailable ?? 0;
});

const containerStatuses = computed(() => {
    const status = rawData.value.status;
    if (!status) return [];
    return [
        ...(status.initContainerStatuses || []),
        ...(status.containerStatuses || [])
    ];
});

const conditions = computed(() => {
    const status = rawData.value.status;
    if (status?.conditions && Array.isArray(status.conditions)) {
        return status.conditions;
    }
    return [];
});

const labels = computed(() => {
    return rawData.value.metadata?.labels || {};
});

const labelsCount = computed(() => {
    return Object.keys(labels.value).length;
});

const getConditionSeverity = (type: string, status: string): string => {
    if (type === 'ReplicaFailure' || type === 'Corrupted') {
        return status === 'True' ? 'danger' : 'success';
    }
    if (status === 'True') return 'success';
    if (status === 'False') return 'danger';
    return 'warn';
};

const formatTime = (isoString?: string) => {
    if (!isoString) return '-';
    try {
        return timeAgo.format(new Date(isoString));
    } catch {
        return isoString;
    }
};

const formatAge = (isoString?: string) => {
    if (!isoString) return '-';
    try {
        return timeAgo.format(new Date(isoString), 'mini');
    } catch {
        return '-';
    }
};
</script>

<style scoped>
.resource-overview-tab {
    padding: 1rem;
    overflow-y: auto;
    height: 100%;
    color: var(--text-color, #e0e0e0);
}

.summary-card {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--surface-border, #333);
    border-radius: 8px;
    padding: 1rem;
}

.summary-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
}

.summary-kind {
    font-size: 0.75rem;
    color: #9ca3af;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
}

.summary-name {
    margin: 0;
    font-size: 1.15rem;
    word-break: break-all;
}

.health-reason-alert {
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: 4px;
    padding: 6px 10px;
    font-size: 0.85rem;
    color: #fbbf24;
}

.summary-meta-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.85rem;
    margin-top: 0.5rem;
}

.meta-item {
    display: flex;
    gap: 0.35rem;
}

.meta-label {
    color: #9ca3af;
}

.section-title {
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #d1d5db;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 4px;
}

/* Replica Cards Grid */
.replica-cards-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
}

.replica-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--surface-border, #333);
    border-radius: 6px;
    padding: 0.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
}

.replica-num {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f3f4f6;
}

.replica-label {
    font-size: 0.75rem;
    color: #9ca3af;
    text-transform: uppercase;
}

.replica-card.card-success .replica-num {
    color: #10b981;
}

.replica-card.card-danger .replica-num {
    color: #ef4444;
}

/* Container Cards */
.container-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.container-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--surface-border, #333);
    border-radius: 6px;
    padding: 0.6rem;
    font-size: 0.85rem;
}

.container-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.container-restarts {
    font-size: 0.8rem;
    color: #fbbf24;
}

.container-image {
    color: #9ca3af;
    font-size: 0.8rem;
    margin-bottom: 4px;
    word-break: break-all;
}

.container-state {
    font-size: 0.8rem;
}

/* Conditions Table */
.condition-message {
    font-size: 0.8rem;
    color: #d1d5db;
    word-break: break-word;
}

/* Labels */
.labels-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
}

.label-pill {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
}

.label-key {
    color: #93c5fd;
}

.label-val {
    color: #e5e7eb;
}
</style>
