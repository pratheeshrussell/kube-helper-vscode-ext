<template>
    <!-- Standard Resource Node, External Traffic Node, or Pod Group Node -->
    <div 
        class="graph-node-card" 
        :class="[
            statusClass, 
            { 
                'is-pod-group': props.data.isPodGroup,
                'is-external-traffic': props.data.isExternalTraffic,
                'layout-horizontal': props.data.layoutDirection === 'LR'
            }
        ]"
    >
        <!-- Node Header -->
        <div class="graph-node-card-header">
            <div class="header-left">
                <i :class="['pi', iconClass, 'resource-icon']" />
                <div class="graph-node-card-title" :title="props.data.name">
                    {{ props.data.name }}
                </div>
            </div>
            <div class="header-right">
                <!-- Health Status Icon with Tooltip -->
                <i :class="['pi', healthIconClass, healthColorClass, 'health-indicator']" 
                   v-tooltip.top="healthTooltip" />
                
                <!-- Quick Action Menu Trigger (hidden on external traffic root) -->
                <Button 
                    v-if="!props.data.isExternalTraffic"
                    icon="pi pi-ellipsis-v" 
                    text 
                    rounded 
                    size="small" 
                    class="action-menu-btn" 
                    @click.stop="toggleMenu" 
                    aria-haspopup="true" 
                    aria-controls="node_action_menu"
                />
                <Menu ref="actionMenu" id="node_action_menu" :model="menuItems" :popup="true" />
            </div>
        </div>

        <!-- Node Body / Metadata -->
        <div class="graph-node-card-body">
            <!-- Normal Resource Details -->
            <div v-if="!props.data.isPodGroup && !props.data.isExternalTraffic && !props.data.isInternalTraffic" class="resource-meta-row">
                <span class="resource-type">{{ props.data.resourceType }}</span>
                <span v-if="creationAge" class="meta-badge age-badge" :title="'Created: ' + props.data.age">
                    {{ creationAge }}
                </span>
            </div>

            <!-- External Traffic Banner -->
            <div v-if="props.data.isExternalTraffic" class="external-traffic-banner">
                <i class="pi pi-globe me-1" />
                <span>Internet / Inbound Traffic</span>
            </div>

            <!-- Internal Traffic Banner -->
            <div v-if="props.data.isInternalTraffic" class="internal-traffic-banner">
                <i class="pi pi-server me-1" />
                <span>In-Cluster / Mesh Clients</span>
            </div>

            <!-- Service Ports & Type (Traffic Mode) -->
            <div v-if="props.data.servicePorts && props.data.servicePorts.length > 0" class="service-ports-container">
                <div class="service-ports-row">
                    <span class="svc-type-chip">{{ props.data.serviceType || 'ClusterIP' }}</span>
                    <span class="svc-ports-text">
                        {{ formattedPorts }}
                    </span>
                </div>
            </div>

            <!-- ExternalName Service Display -->
            <div v-if="props.data.isExternalName" class="external-name-row">
                <span class="external-name-chip" :title="props.data.externalName">
                    <i class="pi pi-external-link me-1" /> {{ props.data.externalName }}
                </span>
            </div>

            <!-- Ingress Hosts / Paths (Traffic Mode) -->
            <div v-if="props.data.ingressHosts && props.data.ingressHosts.length > 0" class="ingress-hosts-container">
                <span class="ingress-host-chip" v-for="(h, idx) in props.data.ingressHosts.slice(0, 2)" :key="idx">
                    {{ h }}
                </span>
            </div>

            <!-- Pod Group Matrix Display -->
            <div v-if="props.data.isPodGroup && props.data.podGroup" class="pod-group-container">
                <div class="pod-group-header">
                    <span class="pod-group-label">Endpoints</span>
                    <span class="pod-group-counter" :class="podGroupHealthClass">
                        {{ props.data.podGroup.readyCount }}/{{ props.data.podGroup.totalCount }} Ready
                    </span>
                </div>
                <div class="pod-matrix">
                    <span 
                        v-for="(pod, idx) in props.data.podGroup.pods" 
                        :key="idx" 
                        class="pod-chip" 
                        :class="getPodChipClass(pod)"
                        v-tooltip.top="getPodChipTooltip(pod)"
                        @click.stop="onPodChipClick(pod)"
                    />
                </div>
            </div>

            <!-- Extra Metadata Badges (Restarts, Image, External URL, Network Policy) -->
            <div class="metadata-chips-row">
                <!-- Headless Service Badge -->
                <span v-if="props.data.isHeadless" class="meta-badge headless-badge" title="Headless Service (ClusterIP: None)">
                    Headless
                </span>

                <!-- NetworkPolicy Security Shield Badge -->
                <span v-if="props.data.hasNetworkPolicy" class="meta-badge netpol-badge" 
                      v-tooltip.top="netPolTooltip">
                    <i class="pi pi-shield" /> NetPol
                </span>

                <!-- Container Restarts Warning -->
                <span v-if="props.data.restarts && props.data.restarts > 0" class="meta-badge restart-badge" 
                      :class="{ 'high-restarts': props.data.restarts > 5 }"
                      :title="props.data.restarts + ' container restart(s)'">
                    <i class="pi pi-replay" /> {{ props.data.restarts }}
                </span>

                <!-- Image Tag -->
                <span v-if="props.data.imageTag" class="meta-badge image-badge" :title="props.data.imageTag">
                    <i class="pi pi-tag" /> {{ props.data.imageTag }}
                </span>

                <!-- External URL Quick Link -->
                <a v-if="props.data.externalUrl" :href="props.data.externalUrl" target="_blank" 
                   class="meta-badge link-badge" @click.stop title="Open Ingress / LoadBalancer URL">
                    <i class="pi pi-external-link" /> Open
                </a>
            </div>
        </div>

        <!-- Subtree Collapse / Expand Handle -->
        <div v-if="props.data.childCount && props.data.childCount > 0" 
             class="collapse-toggle-btn" 
             :class="{ 
                 'is-collapsed': props.data.isCollapsed,
                 'pos-right': props.data.layoutDirection === 'LR'
             }"
             :title="props.data.isCollapsed ? 'Expand ' + props.data.childCount + ' child items' : 'Collapse subtree'"
             @click.stop="onToggleCollapse">
            <i :class="['pi', props.data.isCollapsed ? 'pi-plus' : 'pi-minus']" />
            <span v-if="props.data.isCollapsed" class="collapsed-count">{{ props.data.childCount }}</span>
        </div>
    </div>

    <!-- Scale Workload Dialog -->
    <Dialog v-model:visible="isScaleDialogVisible" modal header="Scale Workload" :style="{ width: '350px' }">
        <div class="scale-dialog-content">
            <p>Scale <strong>{{ props.data.name }}</strong> ({{ props.data.resourceType }}):</p>
            <div class="scale-input-group">
                <label>Desired Replicas:</label>
                <InputNumber v-model="targetReplicas" :min="0" :max="100" showButtons class="w-full" />
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" text severity="secondary" @click="isScaleDialogVisible = false" />
            <Button label="Scale" severity="primary" @click="confirmScale" />
        </template>
    </Dialog>

    <!-- Port Forward Dialog -->
    <Dialog v-model:visible="isPortFwdDialogVisible" modal header="Port Forward" :style="{ width: '400px' }">
        <div class="port-fwd-content">
            <p>Port forward to <strong>{{ props.data.name }}</strong>:</p>
            <div class="input-field-group">
                <label>Port Mapping (Local:Remote, e.g. 8080:80):</label>
                <InputText v-model="portMapping" placeholder="8080:80" class="w-full" />
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" text severity="secondary" @click="isPortFwdDialogVisible = false" />
            <Button label="Forward" severity="primary" @click="confirmPortForward" />
        </template>
    </Dialog>

    <!-- Vue Flow Dynamic Connection Handles (TB vs LR) -->
    <Handle 
        v-if="shouldShowOutputNode" 
        :class="['custom-handle', 'is-connected']" 
        :id="nodeOutputId" 
        type="source"
        :position="sourceHandlePosition" 
        :connectable="false" 
    />
    <Handle 
        v-if="shouldShowInputNode" 
        :class="['custom-handle', 'is-connected']" 
        :id="nodeInputId" 
        type="target"
        :position="targetHandlePosition" 
        :connectable="false" 
    />
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core';
import { computed, ref } from 'vue';
import TimeAgo from 'javascript-time-ago';
import Button from 'primevue/button';
import Menu from 'primevue/menu';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import 'primeicons/primeicons.css';
import type { PodSummary, ServicePortInfo, NetworkPolicySummary } from '../../types/graph.type';

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

const emit = defineEmits(['action', 'toggle-collapse', 'select-pod']);

const { getEdges } = useVueFlow();
const actionMenu = ref();
const isScaleDialogVisible = ref(false);
const isPortFwdDialogVisible = ref(false);
const targetReplicas = ref(1);
const portMapping = ref('');

const timeAgo = new TimeAgo('en-US');

// Dynamic handle positions for Horizontal (LR) vs Vertical (TB)
const sourceHandlePosition = computed(() => {
    return props.data.layoutDirection === 'LR' ? Position.Right : Position.Bottom;
});

const targetHandlePosition = computed(() => {
    return props.data.layoutDirection === 'LR' ? Position.Left : Position.Top;
});

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

const creationAge = computed(() => {
    if (!props.data.age) return null;
    try {
        return timeAgo.format(new Date(props.data.age), 'mini');
    } catch (e) {
        return null;
    }
});

const formattedPorts = computed(() => {
    const ports: ServicePortInfo[] = props.data.servicePorts || [];
    if (ports.length === 0) return '';
    return ports.map(p => `${p.port} ➔ ${p.targetPort}/${p.protocol}`).join(', ');
});

const netPolTooltip = computed(() => {
    const policies: NetworkPolicySummary[] = props.data.networkPolicies || [];
    if (policies.length === 0) return 'Protected by NetworkPolicy';
    const names = policies.map(p => `${p.name} (${p.kind})`).join(', ');
    return `Protected by NetworkPolicy: ${names}`;
});

const iconClass = computed(() => {
    if (props.data.isExternalTraffic) return 'pi-globe';
    const type = (props.data.resourceType || '').toLowerCase();
    const map: Record<string, string> = {
        pod: 'pi-box',
        podgroup: 'pi-th-large',
        service: 'pi-share-alt',
        deployment: 'pi-cloud',
        replicaset: 'pi-clone',
        statefulset: 'pi-database',
        daemonset: 'pi-server',
        job: 'pi-cog',
        cronjob: 'pi-clock',
        configmap: 'pi-file',
        secret: 'pi-lock',
        sealedsecret: 'pi-key',
        certificate: 'pi-verified',
        ingress: 'pi-globe',
        gateway: 'pi-globe',
        httproute: 'pi-directions',
        virtualservice: 'pi-directions',
        persistentvolumeclaim: 'pi-save',
        persistentvolume: 'pi-hdd',
        serviceaccount: 'pi-id-card',
        node: 'pi-desktop',
        namespace: 'pi-folder',
        application: 'pi-sitemap',
        horizontalpodautoscaler: 'pi-arrows-h',
        networkpolicy: 'pi-shield',
        ciliumnetworkpolicy: 'pi-shield',
    };
    return map[type] || 'pi-box';
});

const healthInfo = computed(() => {
    return props.data.health || { status: 'healthy', reason: 'Active' };
});

const statusClass = computed(() => {
    if (props.data.isExternalTraffic) return 'status-external';
    const status = healthInfo.value.status;
    switch (status) {
        case 'healthy': return 'status-success';
        case 'progressing': return 'status-warning';
        case 'degraded': return 'status-error';
        case 'suspended': return 'status-suspended';
        default: return 'status-unknown';
    }
});

const healthIconClass = computed(() => {
    if (props.data.isExternalTraffic) return 'pi-check';
    const status = healthInfo.value.status;
    switch (status) {
        case 'healthy': return 'pi-check-circle';
        case 'progressing': return 'pi-spin pi-spinner';
        case 'degraded': return 'pi-exclamation-triangle';
        case 'suspended': return 'pi-pause-circle';
        default: return 'pi-question-circle';
    }
});

const healthColorClass = computed(() => {
    if (props.data.isExternalTraffic) return 'health-color-external';
    const status = healthInfo.value.status;
    switch (status) {
        case 'healthy': return 'health-color-success';
        case 'progressing': return 'health-color-warning';
        case 'degraded': return 'health-color-error';
        case 'suspended': return 'health-color-suspended';
        default: return 'health-color-unknown';
    }
});

const healthTooltip = computed(() => {
    if (props.data.isExternalTraffic) return 'External Traffic Source';
    const reason = healthInfo.value.reason || '';
    const msg = healthInfo.value.message ? ` - ${healthInfo.value.message}` : '';
    return `${healthInfo.value.status.toUpperCase()}: ${reason}${msg}`;
});

const podGroupHealthClass = computed(() => {
    if (!props.data.podGroup) return '';
    const { readyCount, totalCount } = props.data.podGroup;
    if (readyCount === totalCount && totalCount > 0) return 'text-success';
    if (readyCount === 0 && totalCount > 0) return 'text-danger';
    return 'text-warning';
});

const getPodChipClass = (pod: PodSummary) => {
    switch (pod.health) {
        case 'healthy': return 'pod-chip-success';
        case 'progressing': return 'pod-chip-warning';
        case 'degraded': return 'pod-chip-error';
        default: return 'pod-chip-unknown';
    }
};

const getPodChipTooltip = (pod: PodSummary) => {
    const restartsText = pod.restarts > 0 ? ` | ${pod.restarts} restarts` : '';
    return `${pod.name} (${pod.phase}${restartsText})\n${pod.healthReason || ''}`;
};

const onPodChipClick = (pod: PodSummary) => {
    emit('select-pod', pod);
};

const toggleMenu = (event: Event) => {
    actionMenu.value.toggle(event);
};

const onToggleCollapse = () => {
    emit('toggle-collapse', props.id);
};

const menuItems = computed(() => {
    const type = (props.data.resourceType || '').toLowerCase();
    const isPod = type === 'pod';
    const isWorkload = ['deployment', 'statefulset', 'daemonset'].includes(type);
    const isService = type === 'service';
    const isIngress = type === 'ingress';

    const items: any[] = [];

    if (isPod || isWorkload) {
        items.push({
            label: 'View Logs',
            icon: 'pi pi-align-left',
            command: () => emit('action', { type: 'logs', node: props.data })
        });
    }

    if (isPod) {
        items.push({
            label: 'Terminal (Exec)',
            icon: 'pi pi-terminal',
            command: () => emit('action', { type: 'terminal', node: props.data })
        });
    }

    if (isWorkload) {
        items.push({
            label: 'Restart (Rollout)',
            icon: 'pi pi-refresh',
            command: () => emit('action', { type: 'restart', node: props.data })
        });
        items.push({
            label: 'Scale Workload',
            icon: 'pi pi-arrows-v',
            command: () => {
                targetReplicas.value = props.data.spec?.replicas ?? 1;
                isScaleDialogVisible.value = true;
            }
        });
    }

    if (isPod || isService) {
        items.push({
            label: 'Port Forward',
            icon: 'pi pi-arrow-right-arrow-left',
            command: () => {
                portMapping.value = isService ? '8080:80' : '8080:8080';
                isPortFwdDialogVisible.value = true;
            }
        });
    }

    if (isIngress && props.data.externalUrl) {
        items.push({
            label: 'Open URL',
            icon: 'pi pi-globe',
            command: () => window.open(props.data.externalUrl, '_blank')
        });
    }

    items.push({
        separator: true
    });

    items.push({
        label: 'Describe',
        icon: 'pi pi-info-circle',
        command: () => emit('action', { type: 'describe', node: props.data })
    });

    items.push({
        label: 'Edit YAML',
        icon: 'pi pi-code',
        command: () => emit('action', { type: 'yaml', node: props.data })
    });

    items.push({
        label: 'Delete Resource',
        icon: 'pi pi-trash',
        class: 'text-danger',
        command: () => emit('action', { type: 'delete', node: props.data })
    });

    return items;
});

const confirmScale = () => {
    isScaleDialogVisible.value = false;
    emit('action', { type: 'scale-confirm', node: props.data, replicas: targetReplicas.value });
};

const confirmPortForward = () => {
    isPortFwdDialogVisible.value = false;
    emit('action', { type: 'portfwd-confirm', node: props.data, portMapping: portMapping.value });
};
</script>

<style scoped>
.graph-node-card {
    background-color: var(--surface-card, #1e1e1e);
    border: 1px solid var(--surface-border, #333);
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    min-width: 210px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    position: relative;
    transition: all 0.2s ease;
    cursor: pointer;
}

.graph-node-card:hover {
    border-color: var(--primary-color, #3B82F6);
    box-shadow: 0 6px 12px -2px rgba(59, 130, 246, 0.25);
    transform: translateY(-2px);
}

.graph-node-card.is-pod-group {
    min-width: 240px;
    background: linear-gradient(145deg, rgba(30, 30, 30, 0.95), rgba(40, 40, 40, 0.95));
}

.graph-node-card.is-external-traffic {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(30, 30, 30, 0.95));
    border-color: #3b82f6;
}

.graph-node-card.is-internal-traffic {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(30, 30, 30, 0.95));
    border-color: #6366f1;
}

/* Status Border Indicators */
.status-success {
    border-left: 4px solid #10B981;
}

.status-warning {
    border-left: 4px solid #F59E0B;
}

.status-error {
    border-left: 4px solid #EF4444;
}

.status-suspended {
    border-left: 4px solid #6B7280;
}

.status-unknown {
    border-left: 4px solid #8B5CF6;
}

.status-external {
    border-left: 4px solid #3b82f6;
}

.status-internal {
    border-left: 4px solid #6366f1;
}


/* Header */
.graph-node-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    overflow: hidden;
    flex-grow: 1;
}

.resource-icon {
    font-size: 1rem;
    color: var(--primary-color, #3B82F6);
    flex-shrink: 0;
}

.graph-node-card-title {
    font-weight: 600;
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-color, #ffffff);
}

.header-right {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
}

.health-indicator {
    font-size: 0.85rem;
}

.health-color-success { color: #10B981; }
.health-color-warning { color: #F59E0B; }
.health-color-error { color: #EF4444; }
.health-color-suspended { color: #6B7280; }
.health-color-unknown { color: #8B5CF6; }
.health-color-external { color: #3b82f6; }

.action-menu-btn {
    width: 22px !important;
    height: 22px !important;
    padding: 0 !important;
    color: #9ca3af !important;
}

.action-menu-btn:hover {
    color: #ffffff !important;
}

/* Body & Metadata */
.graph-node-card-body {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.resource-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
}

.resource-type {
    color: #9CA3AF;
    text-transform: uppercase;
    font-size: 0.7rem;
    letter-spacing: 0.5px;
}

.external-traffic-banner {
    font-size: 0.75rem;
    color: #93c5fd;
    display: flex;
    align-items: center;
}

.internal-traffic-banner {
    font-size: 0.75rem;
    color: #a5b4fc;
    display: flex;
    align-items: center;
}

.external-name-row {
    font-size: 0.75rem;
    background: rgba(255, 255, 255, 0.04);
    padding: 2px 6px;
    border-radius: 4px;
}

.external-name-chip {
    font-family: monospace;
    font-size: 0.7rem;
    color: #a5b4fc;
    display: flex;
    align-items: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}


/* Service Ports */
.service-ports-container {
    font-size: 0.75rem;
    background: rgba(255, 255, 255, 0.04);
    padding: 2px 6px;
    border-radius: 4px;
}

.service-ports-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.svc-type-chip {
    font-size: 0.65rem;
    background: rgba(59, 130, 246, 0.2);
    color: #93c5fd;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 600;
}

.svc-ports-text {
    font-family: monospace;
    font-size: 0.7rem;
    color: #d1d5db;
}

/* Ingress Hosts */
.ingress-hosts-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

.ingress-host-chip {
    font-size: 0.7rem;
    background: rgba(16, 185, 129, 0.15);
    color: #6ee7b7;
    padding: 1px 5px;
    border-radius: 4px;
    font-family: monospace;
}

/* Badges */
.metadata-chips-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    align-items: center;
}

.meta-badge {
    font-size: 0.7rem;
    padding: 1px 6px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
}

.age-badge {
    color: #9CA3AF;
    background: rgba(255, 255, 255, 0.05);
}

.headless-badge {
    background: rgba(148, 163, 184, 0.15);
    color: #cbd5e1;
    border: 1px solid rgba(148, 163, 184, 0.3);
    font-size: 0.65rem;
}


.netpol-badge {
    background: rgba(139, 92, 246, 0.2);
    color: #c4b5fd;
    border: 1px solid rgba(139, 92, 246, 0.4);
    font-weight: 600;
}

.restart-badge {
    background: rgba(245, 158, 11, 0.15);
    color: #FBBF24;
    border: 1px solid rgba(245, 158, 11, 0.3);
    font-weight: 600;
}

.restart-badge.high-restarts {
    background: rgba(239, 68, 68, 0.2);
    color: #F87171;
    border-color: rgba(239, 68, 68, 0.4);
}

.image-badge {
    background: rgba(59, 130, 246, 0.1);
    color: #93C5FD;
    max-width: 140px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.link-badge {
    background: rgba(16, 185, 129, 0.15);
    color: #6EE7B7;
    text-decoration: none;
}

.link-badge:hover {
    background: rgba(16, 185, 129, 0.25);
    text-decoration: underline;
}

/* Pod Group */
.pod-group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
}

.pod-group-label {
    color: #9CA3AF;
    text-transform: uppercase;
    font-size: 0.65rem;
}

.pod-group-counter {
    font-weight: 600;
}

.pod-matrix {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    max-height: 48px;
    overflow-y: auto;
}

.pod-chip {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.15s ease;
}

.pod-chip:hover {
    transform: scale(1.4);
}

.pod-chip-success { background-color: #10B981; }
.pod-chip-warning { background-color: #F59E0B; }
.pod-chip-error { background-color: #EF4444; }
.pod-chip-unknown { background-color: #8B5CF6; }

/* Subtree Collapse Toggle Button */
.collapse-toggle-btn {
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #262626;
    border: 1px solid #4b5563;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    color: #d1d5db;
    cursor: pointer;
    z-index: 10;
    transition: all 0.15s ease;
}

.collapse-toggle-btn.pos-right {
    bottom: auto;
    left: auto;
    top: 50%;
    right: -10px;
    transform: translateY(-50%);
}

.collapse-toggle-btn:hover {
    background: var(--primary-color, #3B82F6);
    color: #ffffff;
    border-color: var(--primary-color, #3B82F6);
    transform: scale(1.15) translateX(-50%);
}

.collapse-toggle-btn.pos-right:hover {
    transform: scale(1.15) translateY(-50%);
}

.collapse-toggle-btn.is-collapsed {
    background: var(--primary-color, #3B82F6);
    color: #ffffff;
    width: auto;
    border-radius: 10px;
    padding: 0 6px;
    gap: 2px;
}

.collapsed-count {
    font-size: 0.65rem;
    font-weight: 700;
}

.custom-handle {
    width: 8px !important;
    height: 8px !important;
    background-color: #4b5563 !important;
    border: 1px solid #1e1e1e !important;
}

.custom-handle.is-connected {
    background-color: var(--primary-color, #3B82F6) !important;
}

.scale-dialog-content,
.port-fwd-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.scale-input-group,
.input-field-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}
</style>
