<template>
    <DataTable :value="appTableData" v-model:filters="filters"
    paginator :rows="10" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getAppList" />
        </div>
    </template>
    <template #empty> No Argo CD applications found. </template>
    <template #loading> Loading applications. Please wait. </template>

    <Column field="namespace" header="Namespace" style="min-width: 10rem">
        <template #body="{ data }">
            {{ data.namespace }}
        </template>
    </Column>
    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.name" variant="link" @click="gotoAppDetails(data)" />
        </template>
    </Column>
    <Column field="project" header="Project" style="min-width: 8rem">
        <template #body="{ data }">
            {{ data.project }}
        </template>
    </Column>
    <Column field="syncStatus" header="Sync Status" style="min-width: 8rem">
        <template #body="{ data }">
            <Tag :value="data.syncStatus" :severity="getSyncSeverity(data.syncStatus)" />
        </template>
    </Column>
    <Column field="healthStatus" header="Health" style="min-width: 8rem">
        <template #body="{ data }">
            <Tag :value="data.healthStatus" :severity="getHealthSeverity(data.healthStatus)" />
        </template>
    </Column>
    <Column field="repoURL" header="Repo URL" style="min-width: 14rem">
        <template #body="{ data }">
            <span :title="data.repoURL">{{ truncate(data.repoURL, 40) }}</span>
        </template>
    </Column>
    <Column field="targetRevision" header="Revision" style="min-width: 8rem">
        <template #body="{ data }">
            {{ data.targetRevision }}
        </template>
    </Column>
    <Column field="destNamespace" header="Dest Namespace" style="min-width: 10rem">
        <template #body="{ data }">
            {{ data.destNamespace }}
        </template>
    </Column>
    <Column field="age" header="Age" style="min-width: 8rem">
        <template #body="{ data }">
            {{ data.age }}
        </template>
    </Column>

    </DataTable>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { kubeCmds } from '../../../constants/commands';
import { MessageTypes } from '@common/messageTypes';
import TimeAgo from 'javascript-time-ago';
import { HelperUtils } from '../../../utils/helpers';
import { globalStore } from '../../../store/store';
import { useRouter } from 'vue-router';
import Tag from 'primevue/tag';
import type { ArgoApplicationList, ArgoApplication, ArgoAppTableItem } from '@src/types/argoApp.type';

const appTableData = ref<ArgoAppTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const router = useRouter();

const getAppList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'argoAppList',
        command: HelperUtils.prepareCommand(kubeCmds.getArgoCDApplications)
    });
};

const gotoAppDetails = (data: ArgoAppTableItem) => {
    if (globalStore.namespace === null) {
        globalStore.namespace = data.namespace;
    }
    router.push({ name: 'argoappoverview', params: { appname: data.name } });
};

const truncate = (str: string, len: number) => {
    if (!str) return '-';
    return str.length > len ? str.substring(0, len) + '...' : str;
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

const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'argoAppList') {
        loading.value = false;
        try {
            const data = typeof event.data.data === 'string'
                ? JSON.parse(event.data.data) as ArgoApplicationList
                : event.data.data as ArgoApplicationList;

            if (data?.items?.length > 0) {
                const timeAgo = new TimeAgo('en-US');
                const tData = data.items.map((item: ArgoApplication) => {
                    const timestamp = item.metadata?.creationTimestamp || new Date().toISOString();
                    const age = timeAgo.format(new Date(timestamp));
                    const source = item.spec?.source || item.spec?.sources?.[0];

                    return {
                        namespace: item.metadata?.namespace || 'default',
                        name: item.metadata?.name || '-',
                        project: item.spec?.project || '-',
                        syncStatus: item.status?.sync?.status || 'Unknown',
                        healthStatus: item.status?.health?.status || 'Unknown',
                        repoURL: source?.repoURL || '-',
                        targetRevision: source?.targetRevision || 'HEAD',
                        destServer: item.spec?.destination?.server || item.spec?.destination?.name || '-',
                        destNamespace: item.spec?.destination?.namespace || '-',
                        age: age,
                    } as ArgoAppTableItem;
                });
                appTableData.value = [...tData];
            } else {
                appTableData.value = [];
            }
        } catch (e) {
            console.error('Error parsing Argo applications:', e);
            appTableData.value = [];
        }
    }
};

onMounted(() => {
    window.addEventListener('message', handleMessage);
    getAppList();
});

onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
});
</script>

<style scoped>
</style>
