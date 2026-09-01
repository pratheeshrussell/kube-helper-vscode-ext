<template>
    <div class="app-overview" v-if="!isAppName">
        <div>Unable to load application details</div>
    </div>
    <div class="app-overview" v-if="isAppName">
        <div class="d-flex flex-row-reverse p-2 app-options">
            <div class="d-flex align-items-center mx-2">
                <Button label="Sync" icon="pi pi-sync" severity="info" size="small" @click="syncApp" />
            </div>
            <div class="d-flex align-items-center mx-2">
                <Button label="Refresh" icon="pi pi-refresh" severity="secondary" size="small"
                    @click="refreshApp(false)" />
            </div>
            <div class="d-flex align-items-center mx-2">
                <Button label="Hard Refresh" icon="pi pi-bolt" severity="warn" size="small" @click="refreshApp(true)" />
            </div>
            <EditResource :editCommand="appEditCommand" buttonText="Edit App" />
            <DeleteResource :deleteCommand="appDelCommand" @deleted="handleAppDelete" />
        </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="overview">Overview</Tab>
                <Tab value="graph">Resource Tree</Tab>
                <Tab value="resources">Resources</Tab>
                <Tab value="history">History</Tab>
                <Tab value="describe">Describe</Tab>
            </TabList>
            <TabPanels>
                <!-- Overview Tab -->
                <TabPanel value="overview">
                    <div class="overview-grid" v-if="appDetails">
                        <!-- Status Cards -->
                        <div class="card-row mb-3">
                            <Card class="status-card">
                                <template #title>Sync Status</template>
                                <template #content>
                                    <div class="status-item">
                                        <Tag :value="appDetails.status?.sync?.status || 'Unknown'"
                                            :severity="getSyncSeverity(appDetails.status?.sync?.status || '')" />
                                    </div>
                                    <div class="status-item mt-2">
                                        <strong>Revision:</strong> {{ appDetails.status?.sync?.revision || '-' }}
                                    </div>
                                </template>
                            </Card>

                            <Card class="status-card">
                                <template #title>Health Status</template>
                                <template #content>
                                    <div class="status-item">
                                        <Tag :value="appDetails.status?.health?.status || 'Unknown'"
                                            :severity="getHealthSeverity(appDetails.status?.health?.status || '')" />
                                    </div>
                                    <div class="status-item mt-2">
                                        <small>{{ appDetails.status?.health?.message || '-' }}</small>
                                    </div>
                                </template>
                            </Card>
                        </div>

                        <!-- Details Grid -->
                        <div class="card-row mb-3">
                            <Card class="info-card">
                                <template #title>Source</template>
                                <template #content>
                                    <div class="info-line"><strong>Repo:</strong> {{ appDetails.spec?.source?.repoURL ||
                                        '-' }}</div>
                                    <div class="info-line"><strong>Path:</strong> {{ appDetails.spec?.source?.path ||
                                        '-' }}</div>
                                    <div class="info-line"><strong>Target Rev:</strong> {{
                                        appDetails.spec?.source?.targetRevision || 'HEAD' }}</div>
                                </template>
                            </Card>

                            <Card class="info-card">
                                <template #title>Destination</template>
                                <template #content>
                                    <div class="info-line"><strong>Server:</strong> {{
                                        appDetails.spec?.destination?.server || appDetails.spec?.destination?.name ||
                                        '-' }}</div>
                                    <div class="info-line"><strong>Namespace:</strong> {{
                                        appDetails.spec?.destination?.namespace || '-' }}</div>
                                </template>
                            </Card>
                        </div>

                        <!-- Operation State -->
                        <Card class="mb-3" v-if="appDetails.status?.operationState">
                            <template #title>Last Operation State</template>
                            <template #content>
                                <div class="info-line">
                                    <strong>Phase:</strong>
                                    <Tag :value="appDetails.status.operationState.phase"
                                        :severity="appDetails.status.operationState.phase === 'Succeeded' ? 'success' : 'danger'" />
                                </div>
                                <div class="info-line mt-2"><strong>Message:</strong> {{
                                    appDetails.status.operationState.message || '-' }}</div>
                                <div class="info-line"><strong>Finished At:</strong> {{
                                    appDetails.status.operationState.finishedAt || '-' }}</div>
                            </template>
                        </Card>

                        <!-- Conditions -->
                        <Card v-if="appDetails.status?.conditions && appDetails.status.conditions.length > 0">
                            <template #title>Conditions</template>
                            <template #content>
                                <div v-for="(cond, idx) in appDetails.status.conditions" :key="idx"
                                    class="condition-item mb-2 p-2 border-round surface-border border-1">
                                    <strong>{{ cond.type }}</strong>: {{ cond.message }}
                                </div>
                            </template>
                        </Card>
                    </div>
                    <div v-else class="p-3">
                        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i> Loading details...
                    </div>
                </TabPanel>

                <!-- Dedicated Resource Tree Graph Tab -->
                <TabPanel value="graph">
                    <div class="argo-graph-wrapper">
                        <div class="argo-graph-toolbar">
                            <IconField class="search-field">
                                <InputIcon class="pi pi-search" />
                                <InputText v-model="graphSearchQuery" placeholder="Search managed resources..." class="search-input" />
                            </IconField>
                            <Button icon="pi pi-arrows-alt" label="Fit View" size="small" severity="secondary" outlined @click="onFitGraphView" />
                        </div>

                        <div class="argo-vue-flow-container">
                            <VueFlow 
                                id="argo-app-flow"
                                :nodes="filteredGraphNodes" 
                                :edges="graphEdges" 
                                :fit-view-on-init="true"
                                class="argo-flow"
                            >
                                <Controls position="top-left" />
                                <template #node-custom="props">
                                    <ResourceGraphNode 
                                        :id="props.id" 
                                        :data="props.data" 
                                        @action="onGraphNodeAction"
                                    />
                                </template>
                            </VueFlow>
                        </div>
                    </div>
                </TabPanel>

                <!-- Resources Table Tab -->
                <TabPanel value="resources">
                    <div v-if="appDetails?.status?.resources">
                        <DataTable :value="appDetails.status.resources" :paginator="true" :rows="10" dataKey="name">
                            <template #empty> No managed resources found. </template>
                            <Column field="kind" header="Kind" style="min-width: 10rem"></Column>
                            <Column field="name" header="Name" style="min-width: 12rem">
                                <template #body="{ data }">
                                    <Button v-if="NAVIGABLE_KINDS[data.kind]" :label="data.name" variant="link" @click="gotoResourceDetails(data)" class="p-0 text-left" />
                                    <span v-else>{{ data.name }}</span>
                                </template>
                            </Column>
                            <Column field="namespace" header="Namespace"></Column>
                            <Column field="status" header="Sync Status">
                                <template #body="{ data }">
                                    <Tag v-if="data.status" :value="data.status" :severity="getSyncSeverity(data.status)" />
                                    <span v-else>-</span>
                                </template>
                            </Column>
                            <Column field="health" header="Health">
                                <template #body="{ data }">
                                    <Tag v-if="data.health?.status" :value="data.health.status" :severity="getHealthSeverity(data.health.status)" />
                                    <span v-else>-</span>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                    <div v-else class="p-3">
                        No resources reported.
                    </div>
                </TabPanel>

                <!-- History Tab -->
                <TabPanel value="history">
                    <div v-if="appDetails?.status?.history">
                        <DataTable :value="appDetails.status.history" :paginator="true" :rows="10" dataKey="id">
                            <template #empty> No sync history found. </template>
                            <Column field="id" header="ID"></Column>
                            <Column field="revision" header="Revision">
                                <template #body="{ data }">
                                    <span v-tooltip.top="data.revision">{{ formatRevision(data.revision) }}</span>
                                </template>
                            </Column>
                            <Column field="deployedAt" header="Deployed At">
                                <template #body="{ data }">
                                    {{ formatTimeAgo(data.deployedAt) }}
                                </template>
                            </Column>
                            <Column field="source" header="Source">
                                <template #body="{ data }">
                                    {{ data.source?.repoURL || '-' }}
                                </template>
                            </Column>
                            <Column field="pathOrChart" header="Path / Chart">
                                <template #body="{ data }">
                                    {{ data.source?.path || data.source?.chart || '-' }}
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                    <div v-else class="p-3">
                        No sync history available.
                    </div>
                </TabPanel>

                <!-- Describe Tab -->
                <TabPanel value="describe">
                    <DescribeViewer :describeCommand="appDescribeCommand" />
                </TabPanel>
            </TabPanels>
        </Tabs>

        <!-- Drawer for inspecting graph nodes -->
        <Drawer 
            v-model:visible="isDrawerVisible" 
            position="right" 
            class="resource-details-drawer"
            :style="{ width: '50vw' }"
        >
            <template #header>
                <div class="drawer-header">
                    <h3>{{ selectedGraphNode?.data?.name }}</h3>
                    <span class="resource-type">{{ selectedGraphNode?.data?.resourceType }}</span>
                </div>
            </template>
            <Tabs v-model:value="drawerTab" class="details-tabs">
                <TabList>
                    <Tab value="describe">Describe</Tab>
                    <Tab value="yaml">YAML</Tab>
                </TabList>
                <TabPanels class="details-tab-panels">
                    <TabPanel value="describe" class="details-tab-panel">
                        <div class="resource-details-content">
                            <v-ace-editor v-model:value="drawerDescribeOutput" readonly lang="text" theme="cloud_editor_dark" class="ace-editor-full" />
                        </div>
                    </TabPanel>
                    <TabPanel value="yaml" class="details-tab-panel">
                        <div class="resource-details-content">
                            <v-ace-editor v-model:value="drawerYamlOutput" readonly lang="yaml" theme="cloud_editor_dark" class="ace-editor-full" />
                        </div>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Drawer>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute, useRouter } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import EditResource from '../common/EditResource.vue';
import DeleteResource from '../common/DeleteResource.vue';
import ResourceGraphNode from '../graph/ResourceGraphNode.vue';
import { VueFlow, useVueFlow, type Node, type Edge } from '@vue-flow/core';
import { Controls } from '@vue-flow/controls';
import ELK from 'elkjs/lib/elk.bundled.js';
import { parseArgoAppTree } from '../../utils/graph-parser';
import { kubeCmds } from '@src/constants/commands';
import { MessageTypes } from '@common/messageTypes';
import { HelperUtils } from '../../utils/helpers';
import type { ArgoApplication, ArgoManagedResource } from '@src/types/argoApp.type';
import TimeAgo from 'javascript-time-ago';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Drawer from 'primevue/drawer';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import { VAceEditor } from 'vue3-ace-editor';

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';

const route = useRoute();
const router = useRouter();

const appName = ref('');
const argoNamespace = ref('');
const isAppName = ref(false);
const value = ref('overview');

const appDescribeCommand = ref('');
const appEditCommand = ref('');
const appDelCommand = ref('');
const appDetails = ref<ArgoApplication | null>(null);

// Graph State
const graphNodes = ref<Node[]>([]);
const graphEdges = ref<Edge[]>([]);
const graphSearchQuery = ref('');
const selectedGraphNode = ref<Node | null>(null);
const isDrawerVisible = ref(false);
const drawerTab = ref('describe');
const drawerDescribeOutput = ref('');
const drawerYamlOutput = ref('');

const elk = new ELK();
const { fitView, onNodeClick } = useVueFlow({ id: 'argo-app-flow' });

const filteredGraphNodes = computed(() => {
    if (!graphSearchQuery.value) {
        return graphNodes.value.map(node => ({
            ...node,
            style: { ...node.style, opacity: 1 }
        }));
    }
    const query = graphSearchQuery.value.toLowerCase();
    return graphNodes.value.map(node => {
        const name = (node.data.name || '').toLowerCase();
        const type = (node.data.resourceType || '').toLowerCase();
        const isMatch = name.includes(query) || type.includes(query);
        return {
            ...node,
            style: { ...node.style, opacity: isMatch ? 1 : 0.2 }
        };
    });
});

const onFitGraphView = () => {
    fitView({ padding: 0.2, duration: 400 });
};

const renderArgoGraph = async () => {
    if (!appDetails.value) return;
    const parsed = parseArgoAppTree(appDetails.value);

    const graph = {
        id: 'argo-root',
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN',
            'elk.spacing.nodeNode': '60',
            'elk.layered.spacing.nodeNodeBetweenLayers': '80',
            'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF'
        },
        children: parsed.nodes.map((node) => ({
            id: node.id,
            width: 220,
            height: 80,
        })),
        edges: parsed.edges.map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target]
        })),
    };

    const { children } = await elk.layout(graph);

    graphNodes.value = parsed.nodes.map((node) => {
        const layoutNode = children?.find((n) => n.id === node.id);
        return {
            ...node,
            position: { x: layoutNode?.x || 0, y: layoutNode?.y || 0 },
        };
    });
    graphEdges.value = parsed.edges;
};

onMounted(() => {
    const appname = route.params.appname;

    if (appname !== null && typeof appname === 'string') {
        appName.value = appname;
        isAppName.value = true;
        argoNamespace.value = globalStore.namespace || '';

        const baseParams = {
            '{{resType}}': 'application',
            '{{resName}}': appname
        };

        let cmdDesc: string = kubeCmds.describeArgoCDResource;
        let cmdEdit: string = kubeCmds.editArgoCDResource;
        let cmdDel: string = kubeCmds.deleteArgoCDResource;

        for (const [k, v] of Object.entries(baseParams)) {
            cmdDesc = cmdDesc.replace(k, v);
            cmdEdit = cmdEdit.replace(k, v);
            cmdDel = cmdDel.replace(k, v);
        }

        appDescribeCommand.value = cmdDesc;
        appEditCommand.value = cmdEdit;
        appDelCommand.value = cmdDel;

        globalStore.breadcrumbItems = [
            ...globalStore.breadcrumbItems,
            {
                label: appname,
                navigateTo: 'argoappoverview',
                params: { appname: appname },
                index: globalStore.breadcrumbItems.length
            }
        ];

        fetchAppDetails();
        window.addEventListener('message', handleMessage);
    }
});

onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
});

const fetchAppDetails = () => {
    let cmd = kubeCmds.getNamespacedResourceByName
        .replace('{{resType}}', 'application')
        .replace('{{resName}}', appName.value);

    cmd = HelperUtils.prepareCommand(cmd);

    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'argoAppDetails',
        command: cmd
    });
};

const syncApp = () => {
    let cmd = kubeCmds.syncArgoApp
        .replace('{{resName}}', appName.value)
        .replace('{{argoNamespace}}', argoNamespace.value || 'argocd');
    cmd = HelperUtils.prepareCommand(cmd);

    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_TERMINAL,
        command: cmd
    });
};

const refreshApp = (hard: boolean) => {
    const template = hard ? kubeCmds.hardRefreshArgoApp : kubeCmds.refreshArgoApp;
    let cmd = template
        .replace('{{resName}}', appName.value)
        .replace('{{argoNamespace}}', argoNamespace.value || 'argocd');
    cmd = HelperUtils.prepareCommand(cmd);

    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_TERMINAL,
        command: cmd
    });
};

const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'argoAppDetails') {
        try {
            const data = typeof event.data.data === 'string'
                ? JSON.parse(event.data.data)
                : event.data.data;
            appDetails.value = data as ArgoApplication;
            renderArgoGraph();
        } catch (e) {
            console.error('Failed to parse app details', e);
        }
    }
    if (event.data.type === 'argoNodeDescribe') {
        drawerDescribeOutput.value = event.data.data;
    }
    if (event.data.type === 'argoNodeYaml') {
        drawerYamlOutput.value = event.data.data;
    }
};

onNodeClick((event) => {
    const node = event.node;
    if (!node) return;

    selectedGraphNode.value = node;
    drawerTab.value = 'describe';
    isDrawerVisible.value = true;

    const ns = node.data.metadata?.namespace || globalStore.namespace;
    const ctx = globalStore.context;

    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'argoNodeDescribe',
        command: `kubectl describe ${node.data.resourceType} ${node.data.name} -n ${ns} --context=${ctx}`
    });
});

watch(drawerTab, (newTab) => {
    if (newTab === 'yaml' && selectedGraphNode.value) {
        const node = selectedGraphNode.value.data;
        const ns = node.metadata?.namespace || globalStore.namespace;
        const ctx = globalStore.context;

        drawerYamlOutput.value = 'Loading YAML...';
        tsvscode?.postMessage({
            type: MessageTypes.RUN_CMD_RESULT,
            subType: 'argoNodeYaml',
            command: `kubectl get ${node.resourceType} ${node.name} -n ${ns} --context=${ctx} -o yaml`
        });
    }
});

watch(value, (newTab) => {
    if (newTab === 'graph') {
        renderArgoGraph();
    }
});

const onGraphNodeAction = (action: { type: string; node: any; [key: string]: any }) => {
    const node = action.node;
    const type = node.resourceType;
    const name = node.name;
    const ns = node.metadata?.namespace || globalStore.namespace;
    const ctx = globalStore.context;

    if (action.type === 'logs') {
        const cmd = `kubectl logs ${type}/${name} -n ${ns} --context=${ctx} --all-containers=true --tail=100`;
        tsvscode?.postMessage({ type: MessageTypes.RUN_CMD_TERMINAL, command: cmd });
    } else if (action.type === 'terminal') {
        const cmd = `kubectl exec -it ${name} -n ${ns} --context=${ctx} -- sh -c "bash || sh"`;
        tsvscode?.postMessage({ type: MessageTypes.RUN_CMD_TERMINAL, command: cmd });
    } else if (action.type === 'restart') {
        const cmd = `kubectl rollout restart ${type}/${name} -n ${ns} --context=${ctx}`;
        tsvscode?.postMessage({ type: MessageTypes.RUN_CMD_TERMINAL, command: cmd });
    }
};

const handleAppDelete = () => {
    const lastBreadcrumb = globalStore.breadcrumbItems[globalStore.breadcrumbItems.length - 1];
    if (lastBreadcrumb && lastBreadcrumb.navigateTo === 'argoappoverview') {
        globalStore.breadcrumbItems.pop();
        router.back();
    }
};

const getSyncSeverity = (status: string): string => {
    switch (status) {
        case 'Synced': return 'success';
        case 'OutOfSync': return 'warn';
        case 'Unknown': return 'secondary';
        default: return 'info';
    }
};

const getHealthSeverity = (status: string): string => {
    switch (status) {
        case 'Healthy': return 'success';
        case 'Progressing': return 'info';
        case 'Degraded': return 'danger';
        case 'Suspended': return 'warn';
        case 'Missing': return 'danger';
        case 'Unknown': return 'secondary';
        default: return 'info';
    }
};

const NAVIGABLE_KINDS: Record<string, { routeName: string; paramKey: string }> = {
    'Pod':                { routeName: 'podoverview',             paramKey: 'podname' },
    'Deployment':         { routeName: 'deploymentoverview',      paramKey: 'depname' },
    'Service':            { routeName: 'svcoverview',             paramKey: 'svcname' },
    'ConfigMap':          { routeName: 'configmapoverview',       paramKey: 'cmname' },
    'Secret':             { routeName: 'secretoverview',          paramKey: 'secretname' },
    'Ingress':            { routeName: 'ingressoverview',         paramKey: 'ingressname' },
    'ReplicaSet':         { routeName: 'replsetoverview',         paramKey: 'rsname' },
    'Node':               { routeName: 'nodeoverview',            paramKey: 'nodename' },
    'ServiceAccount':     { routeName: 'saoverview',              paramKey: 'saname' },
    'Role':               { routeName: 'roleoverview',            paramKey: 'rolename' },
    'RoleBinding':        { routeName: 'rolebindoverview',        paramKey: 'rolebindname' },
    'ClusterRole':        { routeName: 'clusterRoleoverview',     paramKey: 'crname' },
    'ClusterRoleBinding': { routeName: 'clusterRoleBindoverview', paramKey: 'crbname' },
};

const gotoResourceDetails = (resource: ArgoManagedResource) => {
    if (!resource.kind || !resource.name) return;
    
    const routeConfig = NAVIGABLE_KINDS[resource.kind];
    if (routeConfig) {
        if (resource.namespace) {
            globalStore.namespace = resource.namespace;
            globalStore.breadcrumbItems = [
                {
                    label: resource.namespace,
                    params: { namespace: resource.namespace },
                    navigateTo: 'namespaceoverview',
                    index: 0
                }
            ];
        }
        router.push({ name: routeConfig.routeName, params: { [routeConfig.paramKey]: resource.name } });
    }
};

const timeAgo = new TimeAgo('en-US');
const formatTimeAgo = (timestamp?: string) => {
    if (!timestamp) return '-';
    return timeAgo.format(new Date(timestamp));
};

const formatRevision = (revision?: string) => {
    if (!revision) return '-';
    return revision.length > 7 ? revision.substring(0, 7) : revision;
};
</script>

<style scoped>
.app-options {
    background-color: var(--p-surface-900);
}

.overview-grid {
    display: flex;
    flex-direction: column;
    padding: 1rem;
}

.card-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
}

.info-line {
    margin-bottom: 0.5rem;
}

/* Argo Graph Styles */
.argo-graph-wrapper {
    height: 70vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-color, #121212);
}

.argo-graph-toolbar {
    padding: 0.5rem 1rem;
    background: var(--surface-card, #1e1e1e);
    border-bottom: 1px solid var(--surface-border, #333);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.argo-vue-flow-container {
    flex-grow: 1;
    height: 100%;
}

.argo-flow {
    width: 100%;
    height: 100%;
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

.resource-details-content {
    flex-grow: 1;
    background: #1e1e1e;
    color: #e0e0e0;
    overflow: hidden;
    height: 100%;
}

.ace-editor-full {
    height: 100% !important;
    width: 100% !important;
}
</style>
