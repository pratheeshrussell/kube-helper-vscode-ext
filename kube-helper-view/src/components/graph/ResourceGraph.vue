<template>
    <div class="graph-container">
        <!-- Graph Toolbar -->
        <div class="graph-toolbar">
            <div class="toolbar-left">
                <!-- Search Box -->
                <IconField class="search-field">
                    <InputIcon class="pi pi-search" />
                    <InputText v-model="searchQuery" placeholder="Search resources..." class="search-input" />
                </IconField>

                <!-- View Mode Switcher (Workloads vs Traffic Flow) -->
                <div class="filter-pill-group">
                    <Button 
                        icon="pi pi-sitemap"
                        label="Workloads" 
                        size="small" 
                        :severity="selectedViewMode === 'workload' ? 'primary' : 'secondary'"
                        :outlined="selectedViewMode !== 'workload'"
                        @click="setViewMode('workload')"
                        v-tooltip.bottom="'Ownership hierarchy (Deployments ➔ ReplicaSets ➔ Pods)'"
                    />
                    <Button 
                        icon="pi pi-globe"
                        label="Traffic Flow" 
                        size="small" 
                        :severity="selectedViewMode === 'traffic' ? 'primary' : 'secondary'"
                        :outlined="selectedViewMode !== 'traffic'"
                        @click="setViewMode('traffic')"
                        v-tooltip.bottom="'Network routing topology (Internet ➔ Ingress ➔ Service ➔ Endpoints)'"
                    />
                </div>

                <!-- Health Triage Filter (in workload mode) -->
                <div class="filter-pill-group" v-if="selectedViewMode === 'workload'">
                    <Button 
                        label="All" 
                        size="small" 
                        :severity="selectedHealthFilter === 'all' ? 'primary' : 'secondary'"
                        :outlined="selectedHealthFilter !== 'all'"
                        @click="setHealthFilter('all')" 
                    />
                    <Button 
                        label="Degraded ⚠️" 
                        size="small" 
                        :severity="selectedHealthFilter === 'degraded' ? 'danger' : 'secondary'"
                        :outlined="selectedHealthFilter !== 'degraded'"
                        @click="setHealthFilter('degraded')"
                        v-tooltip.bottom="'Show only failing or degraded resources'"
                    />
                    <Button 
                        label="Progressing 🔄" 
                        size="small" 
                        :severity="selectedHealthFilter === 'progressing' ? 'warn' : 'secondary'"
                        :outlined="selectedHealthFilter !== 'progressing'"
                        @click="setHealthFilter('progressing')"
                        v-tooltip.bottom="'Show starting or updating resources'"
                    />
                    <Button 
                        label="Healthy ✅" 
                        size="small" 
                        :severity="selectedHealthFilter === 'healthy' ? 'success' : 'secondary'"
                        :outlined="selectedHealthFilter !== 'healthy'"
                        @click="setHealthFilter('healthy')"
                        v-tooltip.bottom="'Show healthy resources'"
                    />
                </div>

                <!-- Category Filter (in workload mode) -->
                <Select 
                    v-if="selectedViewMode === 'workload'"
                    v-model="selectedCategory" 
                    :options="categoryOptions" 
                    optionLabel="label" 
                    optionValue="value" 
                    placeholder="Category" 
                    class="category-select" 
                    @change="onCategoryChange"
                />
            </div>

            <div class="toolbar-right">
                <!-- Layout Direction Toggle (LR vs TB) -->
                <Button 
                    :icon="selectedLayoutDirection === 'LR' ? 'pi pi-arrows-h' : 'pi pi-arrows-v'" 
                    :label="selectedLayoutDirection === 'LR' ? 'Horizontal (LR)' : 'Vertical (TB)'"
                    severity="secondary"
                    size="small"
                    outlined
                    @click="toggleLayoutDirection"
                    v-tooltip.bottom="'Toggle horizontal (left-to-right) or vertical (top-to-bottom) layout'"
                />

                <!-- Group Pods Toggle -->
                <Button 
                    :icon="isGroupPods ? 'pi pi-th-large' : 'pi pi-table'" 
                    :label="isGroupPods ? 'Grouped Pods' : 'Ungrouped Pods'"
                    :severity="isGroupPods ? 'primary' : 'secondary'"
                    size="small"
                    outlined
                    @click="toggleGroupPods"
                    v-tooltip.bottom="'Toggle compact grouping of replica pods'"
                />

                <!-- Expand / Collapse All -->
                <Button 
                    v-if="selectedViewMode === 'workload'"
                    icon="pi pi-sort-alt" 
                    label="Toggle All" 
                    severity="secondary" 
                    size="small" 
                    outlined
                    @click="toggleExpandCollapseAll"
                    v-tooltip.bottom="'Expand or collapse all subtrees'"
                />

                <!-- Fit View -->
                <Button 
                    icon="pi pi-arrows-alt" 
                    label="Fit View" 
                    severity="secondary" 
                    size="small" 
                    outlined
                    @click="onFitView"
                    v-tooltip.bottom="'Fit graph to screen [F]'"
                />

                <!-- Refresh Graph -->
                <Button 
                    icon="pi pi-refresh" 
                    severity="secondary" 
                    size="small" 
                    outlined
                    @click="getGraphData"
                    v-tooltip.bottom="'Refresh resources'"
                />

                <!-- Keyboard Shortcuts Help -->
                <Button 
                    icon="pi pi-question-circle" 
                    severity="secondary" 
                    size="small" 
                    text 
                    rounded
                    v-tooltip.bottom="'Shortcuts:\n[F] Fit view\n[G] Toggle group\n[H] Toggle layout (LR/TB)\n[1] Workloads view\n[2] Traffic view\n[Esc] Close details'"
                />
            </div>
        </div>

        <!-- Active Filter Notification Bar -->
        <div v-if="hiddenFilterCount > 0" class="filter-indicator-bar">
            <span>
                <i class="pi pi-filter me-1" />
                <strong>{{ hiddenFilterCount }}</strong> resource(s) hidden by active filters
            </span>
            <Button label="Reset Filters" size="small" text class="clear-filters-btn" @click="resetAllFilters" />
        </div>

        <!-- Main Graph Canvas Area -->
        <div class="graph-canvas-wrapper">
            <!-- Vue Flow Canvas -->
            <VueFlow 
                id="main-resource-graph"
                :nodes="filteredNodes" 
                :edges="displayedEdges" 
                :fit-view-on-init="true" 
                class="vue-flow-container"
            >
                <Controls position="top-left" />
                <template #node-custom="props">
                    <ResourceGraphNode 
                        :id="props.id" 
                        :data="props.data" 
                        @toggle-collapse="onToggleCollapse"
                        @select-pod="onSelectPod"
                        @action="onNodeAction"
                    />
                </template>
            </VueFlow>

            <!-- Loading Spinner Overlay -->
            <div v-if="isLoading" class="graph-loading-overlay">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" fill="transparent" animationDuration=".8s" />
                <span class="loading-text">Loading cluster topology...</span>
            </div>

            <!-- Empty State Overlay -->
            <div v-if="!isLoading && nodes.length === 0" class="graph-empty-overlay">
                <i class="pi pi-sitemap empty-icon" />
                <h3 class="empty-title">No resources found</h3>
                <p class="empty-desc">
                    No Kubernetes resources matched the current filters in namespace <strong>{{ globalStore.namespace || 'default' }}</strong>
                </p>
                <Button label="Refresh Graph" icon="pi pi-refresh" size="small" @click="getGraphData" />
            </div>
        </div>

        <!-- Delete Resource Confirmation Dialog -->
        <Dialog 
            v-model:visible="isDeleteDialogVisible" 
            modal 
            header="Delete Resource" 
            :style="{ width: '420px' }"
        >
            <div class="delete-dialog-body">
                <i class="pi pi-exclamation-triangle delete-warn-icon" />
                <div>
                    <p class="delete-warn-text">
                        Are you sure you want to delete <strong>{{ deleteCandidate?.type }}/{{ deleteCandidate?.name }}</strong>?
                    </p>
                    <p class="delete-subtext text-muted">
                        Namespace: <strong>{{ globalStore.namespace }}</strong><br>
                        This action cannot be undone.
                    </p>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" text severity="secondary" @click="isDeleteDialogVisible = false" />
                <Button label="Delete" severity="danger" icon="pi pi-trash" @click="confirmDelete" />
            </template>
        </Dialog>

        <!-- Resource Details Drawer -->
        <Drawer 
            v-model:visible="isDescribeVisible" 
            position="right" 
            class="resource-details-drawer"
            :style="{ width: '55vw' }"
        >

            <template #header>
                <div class="drawer-header">
                    <h3>{{ selectedNode?.data?.name }}</h3>
                    <span class="resource-type">{{ selectedNode?.data?.resourceType }}</span>
                </div>
            </template>
            <Tabs v-model:value="activeTab" class="details-tabs">
                <TabList>
                    <Tab value="overview">Overview</Tab>
                    <Tab value="events">Events</Tab>
                    <Tab value="logs" v-if="supportsLogs">Logs</Tab>
                    <Tab value="describe">Describe</Tab>
                    <Tab value="yaml">YAML</Tab>
                </TabList>
                <TabPanels class="details-tab-panels">
                    <!-- 1. Overview & Conditions Tab -->
                    <TabPanel value="overview" class="details-tab-panel">
                        <ResourceOverviewTab v-if="selectedNode" :node="selectedNode" />
                    </TabPanel>

                    <!-- 2. Events Tab -->
                    <TabPanel value="events" class="details-tab-panel">
                        <div class="drawer-event-container" v-if="resourceEventCommand">
                            <EventList :event-command="resourceEventCommand" />
                        </div>
                        <div v-else class="p-3 text-muted">No event query available.</div>
                    </TabPanel>

                    <!-- 3. Logs Tab -->
                    <TabPanel value="logs" class="details-tab-panel" v-if="supportsLogs">
                        <div class="drawer-logs-container" v-if="resourceLogCommand">
                            <LogViewer :log-command="resourceLogCommand" />
                        </div>
                    </TabPanel>

                    <!-- 4. Describe Tab -->
                    <TabPanel value="describe" class="details-tab-panel">
                        <div class="resource-details-content">
                            <v-ace-editor v-model:value="describeOutput" readonly lang="text" theme="cloud_editor_dark"
                                class="ace-editor-full" />
                        </div>
                    </TabPanel>

                    <!-- 5. YAML Tab -->
                    <TabPanel value="yaml" class="details-tab-panel">
                        <div class="resource-details-content">
                            <v-ace-editor v-model:value="yamlOutput" readonly lang="yaml" theme="cloud_editor_dark"
                                class="ace-editor-full" />
                        </div>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Drawer>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Controls } from '@vue-flow/controls';
import { MessageTypes } from '@common/messageTypes';
import { globalStore } from '../../store/store';
import { parseGraphData, type ParseGraphResult } from '../../utils/graph-parser';
import type { Node, Edge } from '@vue-flow/core';
import ELK from 'elkjs/lib/elk.bundled.js';
import ResourceGraphNode from './ResourceGraphNode.vue';
import ResourceOverviewTab from './ResourceOverviewTab.vue';
import EventList from '../common/EventList.vue';
import LogViewer from '../common/LogViewer.vue';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Button from 'primevue/button';
import Select from 'primevue/select';
import Drawer from 'primevue/drawer';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import { VAceEditor } from 'vue3-ace-editor';

import '@vue-flow/controls/dist/style.css';
import { EDGE_STYLE } from './graphConstants';
import { HelperUtils } from '@src/utils/helpers';
import { kubeCmds } from '@src/constants/commands';
import type { PodSummary, GraphViewMode, LayoutDirection } from '../../types/graph.type';

const rawGraphResources = ref<Record<string, any>>({});
const allParsedNodes = ref<Node[]>([]);
const allParsedEdges = ref<Edge[]>([]);
const parentToChildrenMap = ref<Record<string, string[]>>({});
const childToParentsMap = ref<Record<string, string[]>>({});

const nodes = ref<Node[]>([]);
const displayedEdges = ref<Edge[]>([]);

const isLoading = ref(false);
const isDescribeVisible = ref(false);
const isDeleteDialogVisible = ref(false);
const deleteCandidate = ref<{ type: string; name: string } | null>(null);

const describeOutput = ref('');
const yamlOutput = ref('');
const searchQuery = ref('');
const selectedNode = ref<Node | null>(null);
const activeTab = ref('overview');

const isGroupPods = ref(true);
const selectedViewMode = ref<GraphViewMode>('workload');
const selectedLayoutDirection = ref<LayoutDirection>('TB');
const collapsedNodeIds = ref<Set<string>>(new Set());

// Triage Filters
const selectedHealthFilter = ref<'all' | 'degraded' | 'progressing' | 'healthy'>('all');
const selectedCategory = ref<string>('all');

const categoryOptions = [
    { label: 'All Kinds', value: 'all' },
    { label: 'Workloads', value: 'workloads' },
    { label: 'Networking', value: 'networking' },
    { label: 'Config & Storage', value: 'config' },
    { label: 'CRDs', value: 'crds' },
];

const { onPaneClick, onNodeClick, getConnectedEdges, fitView } = useVueFlow({ id: 'main-resource-graph' });
const elk = new ELK();

// Resource Commands for Diagnostic Drawer
const resourceEventCommand = computed(() => {
    if (!selectedNode.value || selectedNode.value.data.isExternalTraffic || selectedNode.value.data.isInternalTraffic) return '';
    const name = selectedNode.value.data.name;
    const kind = selectedNode.value.data.resourceType;
    return kubeCmds.getEventsPerResource
        .replace('{{resName}}', name)
        .replace('{{resType}}', kind);
});

const supportsLogs = computed(() => {
    if (!selectedNode.value || selectedNode.value.data.isExternalTraffic || selectedNode.value.data.isInternalTraffic) return false;
    const type = (selectedNode.value.data.resourceType || '').toLowerCase();
    return type === 'pod' || ['deployment', 'statefulset', 'daemonset'].includes(type) || selectedNode.value.data.isPodGroup;
});

const resourceLogCommand = computed(() => {
    if (!selectedNode.value || selectedNode.value.data.isExternalTraffic || selectedNode.value.data.isInternalTraffic) return '';
    const node = selectedNode.value.data;
    const type = (node.resourceType || '').toLowerCase();
    const name = node.name;

    if (type === 'pod') {
        return kubeCmds.getNamespacedResourceLogs
            .replace('{{resType}}', 'pod')
            .replace('{{resName}}', name);
    }
    if (node.isPodGroup && node.podGroup?.pods?.length > 0) {
        const firstPod = node.podGroup.pods[0].name;
        return kubeCmds.getNamespacedResourceLogs
            .replace('{{resType}}', 'pod')
            .replace('{{resName}}', firstPod);
    }
    return kubeCmds.getWorkloadLogs
        .replace('{{resType}}', type)
        .replace('{{resName}}', name);
});

// Category Match Helper
const matchesCategory = (type: string, category: string): boolean => {
    const kind = type.toLowerCase();
    const workloadKinds = ['deployment', 'replicaset', 'statefulset', 'daemonset', 'pod', 'job', 'cronjob', 'podgroup'];
    const networkKinds = ['service', 'ingress', 'gateway', 'httproute', 'virtualservice', 'networkpolicy', 'endpoint', 'endpointslices'];
    const configKinds = ['configmap', 'secret', 'persistentvolumeclaim', 'persistentvolume', 'serviceaccount'];

    if (category === 'workloads') return workloadKinds.includes(kind);
    if (category === 'networking') return networkKinds.includes(kind);
    if (category === 'config') return configKinds.includes(kind);
    if (category === 'crds') return !workloadKinds.includes(kind) && !networkKinds.includes(kind) && !configKinds.includes(kind);
    return true;
};

// Compute matching node opacity for search query
const filteredNodes = computed(() => {
    if (!searchQuery.value) {
        return nodes.value.map(node => ({
            ...node,
            style: {
                ...node.style,
                opacity: 1,
            }
        }));
    }
    const query = searchQuery.value.toLowerCase();
    return nodes.value.map(node => {
        const name = (node.data.name || '').toLowerCase();
        const type = (node.data.resourceType || '').toLowerCase();
        const isMatch = name.includes(query) || type.includes(query);
        return {
            ...node,
            style: {
                ...node.style,
                opacity: isMatch ? 1 : 0.2,
            }
        };
    });
});

const hiddenFilterCount = computed(() => {
    const total = allParsedNodes.value.length;
    const current = nodes.value.length;
    return Math.max(0, total - current);
});

// Helper to recursively find all descendant IDs of a node
const getDescendantIds = (nodeId: string, visited = new Set<string>()): Set<string> => {
    const children = parentToChildrenMap.value[nodeId] || [];
    children.forEach(childId => {
        if (!visited.has(childId)) {
            visited.add(childId);
            getDescendantIds(childId, visited);
        }
    });
    return visited;
};

// Transitive upstream pipeline traversal
const getTransitiveAncestors = (nodeId: string, visited = new Set<string>()): Set<string> => {
    const parents = childToParentsMap.value[nodeId] || [];
    parents.forEach(parentId => {
        if (!visited.has(parentId)) {
            visited.add(parentId);
            getTransitiveAncestors(parentId, visited);
        }
    });
    return visited;
};

// Transitive downstream pipeline traversal
const getTransitiveDescendants = (nodeId: string, visited = new Set<string>()): Set<string> => {
    const children = parentToChildrenMap.value[nodeId] || [];
    children.forEach(childId => {
        if (!visited.has(childId)) {
            visited.add(childId);
            getTransitiveDescendants(childId, visited);
        }
    });
    return visited;
};

// Reset all edges to their original parsed styles
const resetEdgeStyles = () => {
    displayedEdges.value = displayedEdges.value.map(edge => ({
        ...edge,
        style: edge.data?.originalStyle || edge.style || { ...EDGE_STYLE.default }
    }));
};

// Recomputes graph layout considering grouping, viewMode, direction, filters, and collapsed subtrees
const updateGraphLayout = async () => {
    const isLR = selectedLayoutDirection.value === 'LR';

    // 1. Identify all hidden descendant nodes from collapsed parents
    const hiddenCollapsedIds = new Set<string>();
    collapsedNodeIds.value.forEach(parentId => {
        const descendants = getDescendantIds(parentId);
        descendants.forEach(id => hiddenCollapsedIds.add(id));
    });

    // 2. Filter visible nodes by collapsed state, health status, and category
    const visibleNodes = allParsedNodes.value
        .filter(n => {
            // Check collapsed state
            if (hiddenCollapsedIds.has(n.id)) return false;

            // Health & Category filters active in workload mode
            if (selectedViewMode.value === 'workload') {
                if (selectedHealthFilter.value !== 'all') {
                    const health = n.data.health?.status || 'healthy';
                    if (selectedHealthFilter.value === 'degraded' && health !== 'degraded') return false;
                    if (selectedHealthFilter.value === 'progressing' && health !== 'progressing') return false;
                    if (selectedHealthFilter.value === 'healthy' && health !== 'healthy') return false;
                }

                if (selectedCategory.value !== 'all') {
                    if (!matchesCategory(n.data.resourceType, selectedCategory.value)) return false;
                }
            }

            return true;
        })
        .map(n => ({
            ...n,
            data: {
                ...n.data,
                layoutDirection: selectedLayoutDirection.value,
                viewMode: selectedViewMode.value,
                isCollapsed: collapsedNodeIds.value.has(n.id)
            }
        }));

    const visibleNodeIdSet = new Set(visibleNodes.map(n => n.id));
    const visibleEdges = allParsedEdges.value.filter(e => 
        visibleNodeIdSet.has(e.source) && visibleNodeIdSet.has(e.target)
    );

    // 3. Run ELK layout
    const layouted = await getLayoutedElements(visibleNodes, visibleEdges, isLR);
    nodes.value = layouted.nodes;
    displayedEdges.value = layouted.edges.map(edge => ({
        ...edge,
        style: edge.data?.originalStyle || edge.style || { ...EDGE_STYLE.default }
    }));
};

const getLayoutedElements = async (nodesToLayout: Node[], edgesToLayout: Edge[], isLR: boolean) => {
    const graph = {
        id: 'root',
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': isLR ? 'RIGHT' : 'DOWN',
            'elk.spacing.nodeNode': isLR ? '50' : '60',
            'elk.layered.spacing.nodeNodeBetweenLayers': isLR ? '90' : '80',
            'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF'
        },
        children: nodesToLayout.map((node) => {
            const isPodGroup = node.data.isPodGroup;
            const approxWidth = HelperUtils.approximateTextWidth(node.data.name || '', node.data.resourceType || '');
            const width = isPodGroup ? 240 : Math.max(210, approxWidth + 40);
            const height = isPodGroup ? 100 : 80;
            return {
                id: node.id,
                width,
                height,
            };
        }),
        edges: edgesToLayout.map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target]
        })),
    };

    const { children } = await elk.layout(graph);

    return {
        nodes: nodesToLayout.map((node) => {
            const layoutNode = children?.find((n) => n.id === node.id);
            return {
                ...node,
                position: { x: layoutNode?.x || 0, y: layoutNode?.y || 0 },
            };
        }),
        edges: edgesToLayout,
    };
};

const processParsedGraph = async (parseResult: ParseGraphResult) => {
    allParsedNodes.value = parseResult.nodes;
    allParsedEdges.value = parseResult.edges;
    parentToChildrenMap.value = parseResult.parentToChildren;
    childToParentsMap.value = parseResult.childToParents;

    // Prune stale collapsed node IDs
    const validIds = new Set(parseResult.nodes.map(n => n.id));
    const nextCollapsed = new Set<string>();
    collapsedNodeIds.value.forEach(id => {
        if (validIds.has(id)) nextCollapsed.add(id);
    });
    collapsedNodeIds.value = nextCollapsed;

    await updateGraphLayout();
};

const getGraphData = () => {
    isLoading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.GET_GRAPH_RESOURCES,
        namespace: globalStore.namespace,
        context: globalStore.context,
    });
};

const setViewMode = async (mode: GraphViewMode) => {
    selectedViewMode.value = mode;
    collapsedNodeIds.value.clear();
    if (rawGraphResources.value) {
        const parsed = parseGraphData(rawGraphResources.value, { 
            groupPods: isGroupPods.value, 
            viewMode: selectedViewMode.value 
        });
        await processParsedGraph(parsed);
        onFitView();
    }
};

const toggleLayoutDirection = async () => {
    selectedLayoutDirection.value = selectedLayoutDirection.value === 'TB' ? 'LR' : 'TB';
    await updateGraphLayout();
    onFitView();
};

const setHealthFilter = async (filter: 'all' | 'degraded' | 'progressing' | 'healthy') => {
    selectedHealthFilter.value = filter;
    await updateGraphLayout();
};

const onCategoryChange = async () => {
    await updateGraphLayout();
};

const resetAllFilters = async () => {
    selectedHealthFilter.value = 'all';
    selectedCategory.value = 'all';
    collapsedNodeIds.value.clear();
    searchQuery.value = '';
    await updateGraphLayout();
    onFitView();
};

const toggleGroupPods = async () => {
    isGroupPods.value = !isGroupPods.value;
    collapsedNodeIds.value.clear();
    if (rawGraphResources.value) {
        const parsed = parseGraphData(rawGraphResources.value, { 
            groupPods: isGroupPods.value, 
            viewMode: selectedViewMode.value 
        });
        await processParsedGraph(parsed);
    }
};

const onToggleCollapse = async (nodeId: string) => {
    if (collapsedNodeIds.value.has(nodeId)) {
        collapsedNodeIds.value.delete(nodeId);
    } else {
        collapsedNodeIds.value.add(nodeId);
    }
    await updateGraphLayout();
};

const toggleExpandCollapseAll = async () => {
    if (collapsedNodeIds.value.size > 0) {
        collapsedNodeIds.value.clear();
    } else {
        Object.keys(parentToChildrenMap.value).forEach(parentId => {
            if (parentToChildrenMap.value[parentId]?.length > 0) {
                collapsedNodeIds.value.add(parentId);
            }
        });
    }
    await updateGraphLayout();
};

const onFitView = () => {
    fitView({ padding: 0.2, duration: 400 });
};

const describeResource = (resourceType: string, resourceName: string) => {
    tsvscode?.postMessage({
        type: MessageTypes.DESCRIBE_RESOURCE,
        resourceType,
        resourceName,
        namespace: globalStore.namespace,
        context: globalStore.context,
    });
};

const getResourceYaml = (resourceType: string, resourceName: string) => {
    yamlOutput.value = 'Loading YAML...';
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'resourceYaml',
        command: `kubectl get ${resourceType} ${resourceName} -n ${globalStore.namespace} --context=${globalStore.context} -o yaml`
    });
};

const onSelectPod = (pod: PodSummary) => {
    selectedNode.value = {
        id: `Pod/${pod.name}`,
        data: {
            resourceType: 'Pod',
            name: pod.name,
            status: pod.raw?.status,
            spec: pod.raw?.spec,
            metadata: pod.raw?.metadata,
            health: {
                status: pod.health,
                reason: pod.healthReason
            },
            restarts: pod.restarts,
        },
        position: { x: 0, y: 0 }
    };
    activeTab.value = 'overview';
    isDescribeVisible.value = true;
    describeResource('Pod', pod.name);
};

const onNodeAction = (action: { type: string; node: any; [key: string]: any }) => {
    const node = action.node;
    const type = node.resourceType;
    const name = node.name;
    const ns = globalStore.namespace;
    const ctx = globalStore.context;

    switch (action.type) {
        case 'logs': {
            selectedNode.value = {
                id: `${type}/${name}`,
                data: node,
                position: { x: 0, y: 0 }
            };
            activeTab.value = 'logs';
            isDescribeVisible.value = true;
            break;
        }

        case 'terminal': {
            const cmd = `kubectl exec -it ${name} -n ${ns} --context=${ctx} -- sh -c "bash || sh"`;
            tsvscode?.postMessage({
                type: MessageTypes.RUN_CMD_TERMINAL,
                command: cmd
            });
            break;
        }

        case 'restart': {
            const cmd = `kubectl rollout restart ${type}/${name} -n ${ns} --context=${ctx}`;
            tsvscode?.postMessage({
                type: MessageTypes.RUN_CMD_TERMINAL,
                command: cmd
            });
            break;
        }

        case 'scale-confirm': {
            const replicas = action.replicas;
            const cmd = `kubectl scale ${type}/${name} --replicas=${replicas} -n ${ns} --context=${ctx}`;
            tsvscode?.postMessage({
                type: MessageTypes.RUN_CMD_TERMINAL,
                command: cmd
            });
            break;
        }

        case 'portfwd-confirm': {
            const mapping = action.portMapping || '8080:80';
            const target = type.toLowerCase() === 'service' ? `svc/${name}` : name;
            const cmd = `kubectl port-forward ${target} ${mapping} -n ${ns} --context=${ctx}`;
            tsvscode?.postMessage({
                type: MessageTypes.RUN_CMD_TERMINAL,
                command: cmd
            });
            break;
        }

        case 'describe': {
            selectedNode.value = {
                id: `${type}/${name}`,
                data: node,
                position: { x: 0, y: 0 }
            };
            activeTab.value = 'describe';
            isDescribeVisible.value = true;
            describeResource(type, name);
            break;
        }

        case 'yaml': {
            selectedNode.value = {
                id: `${type}/${name}`,
                data: node,
                position: { x: 0, y: 0 }
            };
            activeTab.value = 'yaml';
            getResourceYaml(type, name);
            isDescribeVisible.value = true;
            break;
        }

        case 'delete': {
            deleteCandidate.value = { type, name };
            isDeleteDialogVisible.value = true;
            break;
        }
    }
};

const confirmDelete = () => {
    if (!deleteCandidate.value) return;
    const { type, name } = deleteCandidate.value;
    const ns = globalStore.namespace;
    const ctx = globalStore.context;
    const cmd = `kubectl delete ${type} ${name} -n ${ns} --context=${ctx}`;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_TERMINAL,
        command: cmd
    });
    isDeleteDialogVisible.value = false;
    deleteCandidate.value = null;
};

const onMessage = async (event: MessageEvent) => {
    if (event.data.type === MessageTypes.GRAPH_RESOURCES_RESULT) {
        isLoading.value = false;
        rawGraphResources.value = event.data.data;
        const parsed = parseGraphData(event.data.data, { 
            groupPods: isGroupPods.value, 
            viewMode: selectedViewMode.value 
        });
        await processParsedGraph(parsed);
    }
    if (event.data.type === MessageTypes.DESCRIBE_RESOURCE_RESULT) {
        describeOutput.value = event.data.data;
    }
    if (event.data.type === 'resourceYaml') {
        yamlOutput.value = event.data.data;
    }
};

onNodeClick((event) => {
    const node = event.node;
    if (!node || node.data.isPodGroup || node.data.isExternalTraffic || node.data.isInternalTraffic) return;

    selectedNode.value = node;
    activeTab.value = 'overview';
    isDescribeVisible.value = true;

    if (selectedViewMode.value === 'traffic') {
        // Highlight full upstream + downstream traffic pipeline
        const ancestors = getTransitiveAncestors(node.id);
        const descendants = getTransitiveDescendants(node.id);
        const pipelineNodes = new Set([node.id, ...ancestors, ...descendants]);

        displayedEdges.value = displayedEdges.value.map(edge => {
            const isPipelineEdge = pipelineNodes.has(edge.source) && pipelineNodes.has(edge.target);
            if (isPipelineEdge) {
                const color = edge.data?.trafficColor || '#38bdf8';
                return {
                    ...edge,
                    style: {
                        ...(edge.data?.originalStyle || {}),
                        stroke: color,
                        strokeWidth: 3.5,
                        filter: 'drop-shadow(0 0 5px rgba(56, 189, 248, 0.7))'
                    }
                };
            }
            return {
                ...edge,
                style: {
                    ...(edge.data?.originalStyle || {}),
                    opacity: 0.15
                }
            };
        });
    } else {
        // Workload mode highlight
        const connectedEdges = getConnectedEdges(node.id);
        displayedEdges.value = displayedEdges.value.map(edge => {
            const isConnected = connectedEdges.some(e => e.id === edge.id);
            if (isConnected) {
                return {
                    ...edge,
                    style: {
                        ...(edge.data?.originalStyle || {}),
                        stroke: '#38bdf8',
                        strokeWidth: 2.5
                    }
                };
            }
            return {
                ...edge,
                style: {
                    ...(edge.data?.originalStyle || {}),
                    opacity: 0.2
                }
            };
        });
    }

    describeResource(node.data.resourceType, node.data.name);
});

watch(activeTab, (newTab) => {
    if (newTab === 'yaml' && selectedNode.value && !selectedNode.value.data.isExternalTraffic && !selectedNode.value.data.isInternalTraffic) {
        getResourceYaml(selectedNode.value.data.resourceType, selectedNode.value.data.name);
    }
    if (newTab === 'describe' && selectedNode.value && !selectedNode.value.data.isExternalTraffic && !selectedNode.value.data.isInternalTraffic) {
        describeResource(selectedNode.value.data.resourceType, selectedNode.value.data.name);
    }
});

onPaneClick(() => {
    resetEdgeStyles();
});

const onKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const tagName = target?.tagName?.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || target?.closest('.ace_editor') || target?.isContentEditable) {
        return;
    }

    if (event.key === 'Escape') {
        isDescribeVisible.value = false;
        isDeleteDialogVisible.value = false;
        resetEdgeStyles();
    } else if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        onFitView();
    } else if (event.key === 'g' || event.key === 'G') {
        event.preventDefault();
        toggleGroupPods();
    } else if (event.key === 'h' || event.key === 'H') {
        event.preventDefault();
        toggleLayoutDirection();
    } else if (event.key === '1') {
        event.preventDefault();
        setViewMode('workload');
    } else if (event.key === '2') {
        event.preventDefault();
        setViewMode('traffic');
    }
};

onMounted(() => {
    window.addEventListener('message', onMessage);
    window.addEventListener('keydown', onKeyDown);
    getGraphData();
});

onUnmounted(() => {
    window.removeEventListener('message', onMessage);
    window.removeEventListener('keydown', onKeyDown);
});
</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.graph-container {
    height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-color, #121212);
}

.graph-toolbar {
    padding: 0.6rem 1rem;
    background-color: var(--surface-card, #1e1e1e);
    border-bottom: 1px solid var(--surface-border, #333);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.filter-pill-group {
    display: flex;
    gap: 0.25rem;
    align-items: center;
}

.category-select {
    width: 150px;
}

.toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.search-input {
    width: 200px;
}

/* Filter Indicator Bar */
.filter-indicator-bar {
    background: rgba(59, 130, 246, 0.12);
    border-bottom: 1px solid rgba(59, 130, 246, 0.25);
    padding: 4px 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.85rem;
    color: #93c5fd;
}

.clear-filters-btn {
    padding: 0 4px !important;
    font-size: 0.8rem !important;
    color: #60a5fa !important;
}

.vue-flow-container {
    flex-grow: 1;
    height: 100%;
    width: 100%;
}

.graph-canvas-wrapper {
    position: relative;
    flex-grow: 1;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.graph-loading-overlay {
    position: absolute;
    inset: 0;
    background: rgba(18, 18, 18, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    z-index: 20;
    backdrop-filter: blur(2px);
}

.loading-text {
    font-size: 0.95rem;
    color: #94a3b8;
    font-weight: 500;
}

.graph-empty-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    z-index: 10;
    pointer-events: auto;
    color: #94a3b8;
    text-align: center;
    padding: 2rem;
}

.empty-icon {
    font-size: 3rem;
    color: #475569;
}

.empty-title {
    margin: 0;
    font-size: 1.25rem;
    color: #f1f5f9;
}

.empty-desc {
    margin: 0;
    font-size: 0.9rem;
    max-width: 400px;
}

.delete-dialog-body {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 0.5rem 0;
}

.delete-warn-icon {
    font-size: 2.2rem;
    color: #ef4444;
    flex-shrink: 0;
}

.delete-warn-text {
    margin: 0 0 0.5rem 0;
    font-size: 0.95rem;
    color: #f1f5f9;
}

.delete-subtext {
    margin: 0;
    font-size: 0.85rem;
    color: #94a3b8;
}

/* Drawer Styles */

.resource-details-drawer .p-drawer-content {
    padding: 0 !important;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.drawer-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.drawer-header h3 {
    margin: 0;
    font-size: 1.25rem;
}

.resource-type {
    font-size: 0.875rem;
    color: #888;
    text-transform: uppercase;
}

/* Tabs Styles */
.details-tabs {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    height: 100%;
    overflow: hidden;
}

.details-tab-panels {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
}

.details-tab-panel {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
}

.drawer-event-container,
.drawer-logs-container {
    padding: 1rem;
    height: 100%;
    overflow-y: auto;
}

.resource-details-content {
    flex-grow: 1;
    background: #1e1e1e;
    color: #e0e0e0;
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.ace-editor-full {
    height: 100% !important;
    width: 100% !important;
}

pre {
    margin: 0;
    white-space: pre-wrap;
    font-family: monospace;
}
</style>
