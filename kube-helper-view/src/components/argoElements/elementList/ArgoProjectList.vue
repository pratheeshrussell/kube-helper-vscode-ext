<template>
    <DataTable :value="projectTableData" v-model:filters="filters"
    paginator :rows="10" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getProjectList" />
        </div>
    </template>
    <template #empty> No Argo CD projects found. </template>
    <template #loading> Loading projects. Please wait. </template>

    <Column field="namespace" header="Namespace" style="min-width: 10rem">
        <template #body="{ data }">
            {{ data.namespace }}
        </template>
    </Column>
    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.name" variant="link" @click="gotoProjectDetails(data)" />
        </template>
    </Column>
    <Column field="description" header="Description" style="min-width: 14rem">
        <template #body="{ data }">
            {{ data.description || '-' }}
        </template>
    </Column>
    <Column field="sourceRepos" header="Source Repos" style="min-width: 14rem">
        <template #body="{ data }">
            <span :title="data.sourceRepos">{{ truncate(data.sourceRepos, 50) }}</span>
        </template>
    </Column>
    <Column field="destinations" header="Destinations" style="min-width: 10rem">
        <template #body="{ data }">
            {{ data.destinations }}
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
import type { ArgoProjectList, ArgoProject, ArgoProjectTableItem } from '@src/types/argoProject.type';

const projectTableData = ref<ArgoProjectTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const router = useRouter();

const getProjectList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'argoProjectList',
        command: HelperUtils.prepareCommand(kubeCmds.getArgoCDProjects)
    });
};

const gotoProjectDetails = (data: ArgoProjectTableItem) => {
    if (globalStore.namespace === null) {
        globalStore.namespace = data.namespace;
    }
    router.push({ name: 'argoprojectoverview', params: { projectname: data.name } });
};

const truncate = (str: string, len: number) => {
    if (!str) return '-';
    return str.length > len ? str.substring(0, len) + '...' : str;
};

const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'argoProjectList') {
        loading.value = false;
        try {
            const data = typeof event.data.data === 'string'
                ? JSON.parse(event.data.data) as ArgoProjectList
                : event.data.data as ArgoProjectList;

            if (data?.items?.length > 0) {
                const timeAgo = new TimeAgo('en-US');
                const tData = data.items.map((item: ArgoProject) => {
                    const timestamp = item.metadata?.creationTimestamp || new Date().toISOString();
                    const age = timeAgo.format(new Date(timestamp));

                    const sourceRepos = item.spec?.sourceRepos?.join(', ') || '-';
                    const destCount = item.spec?.destinations?.length || 0;
                    const destinations = destCount > 0 ? `${destCount} destination(s)` : '-';

                    return {
                        namespace: item.metadata?.namespace || 'default',
                        name: item.metadata?.name || '-',
                        description: item.spec?.description || '',
                        sourceRepos: sourceRepos,
                        destinations: destinations,
                        age: age,
                    } as ArgoProjectTableItem;
                });
                projectTableData.value = [...tData];
            } else {
                projectTableData.value = [];
            }
        } catch (e) {
            console.error('Error parsing Argo projects:', e);
            projectTableData.value = [];
        }
    }
};

onMounted(() => {
    window.addEventListener('message', handleMessage);
    getProjectList();
});

onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
});
</script>

<style scoped>
</style>
