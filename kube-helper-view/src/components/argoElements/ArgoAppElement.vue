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
                <Tab value="resources">Resources</Tab>
                <Tab value="history">History</Tab>
                <Tab value="describe">Describe</Tab>
            </TabList>
            <TabPanels>
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
                <TabPanel value="describe">
                    <DescribeViewer :describeCommand="appDescribeCommand" />
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute, useRouter } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import EditResource from '../common/EditResource.vue';
import DeleteResource from '../common/DeleteResource.vue';
import { kubeCmds } from '@src/constants/commands';
import { MessageTypes } from '@common/messageTypes';
import { HelperUtils } from '../../utils/helpers';
import type { ArgoApplication, ArgoManagedResource } from '@src/types/argoApp.type';
import TimeAgo from 'javascript-time-ago';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Button from 'primevue/button';

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

onMounted(() => {
    const appname = route.params.appname;

    if (appname !== null && typeof appname === 'string') {
        appName.value = appname;
        isAppName.value = true;
        argoNamespace.value = globalStore.namespace || ''; // The namespace the app lives in

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
        .replace('{{argoNamespace}}', argoNamespace.value || 'argocd'); // fallback if needed
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
        } catch (e) {
            console.error('Failed to parse app details', e);
        }
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
</style>
