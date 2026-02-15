<template>
    <DataTable :value="appSetTableData" v-model:filters="filters"
    paginator :rows="10" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getAppSetList" />
        </div>
    </template>
    <template #empty> No Argo CD application sets found. </template>
    <template #loading> Loading application sets. Please wait. </template>

    <Column field="namespace" header="Namespace" style="min-width: 10rem">
        <template #body="{ data }">
            {{ data.namespace }}
        </template>
    </Column>
    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.name }}
        </template>
    </Column>
    <Column field="project" header="Project" style="min-width: 8rem">
        <template #body="{ data }">
            {{ data.project }}
        </template>
    </Column>
    <Column field="generators" header="Generators" style="min-width: 10rem">
        <template #body="{ data }">
            {{ data.generators }}
        </template>
    </Column>
    <Column field="templateApp" header="Template App" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.templateApp }}
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
import type { ArgoApplicationSetList, ArgoApplicationSet, ArgoAppSetTableItem, ArgoAppSetGenerator } from '@src/types/argoAppSet.type';

const appSetTableData = ref<ArgoAppSetTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});

const getAppSetList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'argoAppSetList',
        command: HelperUtils.prepareCommand(kubeCmds.getArgoCDAppSets)
    });
};

const getGeneratorTypes = (generators?: ArgoAppSetGenerator[]): string => {
    if (!generators || generators.length === 0) return '-';
    const types: string[] = [];
    for (const gen of generators) {
        if (gen.list) types.push('list');
        if (gen.clusters) types.push('clusters');
        if (gen.git) types.push('git');
        if (gen.matrix) types.push('matrix');
        if (gen.merge) types.push('merge');
        if (gen.pullRequest) types.push('pullRequest');
        if (gen.scmProvider) types.push('scmProvider');
        if (gen.clusterDecisionResource) types.push('clusterDecision');
    }
    return types.length > 0 ? types.join(', ') : '-';
};

const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'argoAppSetList') {
        loading.value = false;
        try {
            const data = typeof event.data.data === 'string'
                ? JSON.parse(event.data.data) as ArgoApplicationSetList
                : event.data.data as ArgoApplicationSetList;

            if (data?.items?.length > 0) {
                const timeAgo = new TimeAgo('en-US');
                const tData = data.items.map((item: ArgoApplicationSet) => {
                    const timestamp = item.metadata?.creationTimestamp || new Date().toISOString();
                    const age = timeAgo.format(new Date(timestamp));

                    return {
                        namespace: item.metadata?.namespace || 'default',
                        name: item.metadata?.name || '-',
                        generators: getGeneratorTypes(item.spec?.generators),
                        templateApp: item.spec?.template?.metadata?.name || '-',
                        project: item.spec?.template?.spec?.project || '-',
                        age: age,
                    } as ArgoAppSetTableItem;
                });
                appSetTableData.value = [...tData];
            } else {
                appSetTableData.value = [];
            }
        } catch (e) {
            console.error('Error parsing Argo application sets:', e);
            appSetTableData.value = [];
        }
    }
};

onMounted(() => {
    window.addEventListener('message', handleMessage);
    getAppSetList();
});

onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
});
</script>

<style scoped>
</style>
