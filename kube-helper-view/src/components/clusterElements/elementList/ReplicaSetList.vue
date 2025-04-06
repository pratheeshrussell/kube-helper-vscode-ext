<template>
    <DataTable :value="replsetTableData" v-model:filters="filters"
    paginator :rows="5" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getReplicaSetList" />
        </div>
    </template>
    <template #empty> No replicaset found. </template>
    <template #loading> Loading replicasets. Please wait. </template>

    <Column v-if="!isNamespace" field="namespace" header="Namespace" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.namespace" variant="link" @click="gotoNamespaceDetails(data.namespace)" />
        </template>
    </Column>
    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.name" variant="link" @click="gotoReplSetDetails(data)" />
        </template>
    </Column>
    <Column field="desired" header="Desired" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.desired }}
        </template>
    </Column>
    <Column field="current" header="Current" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.current }}
        </template>
    </Column>
    <Column field="ready" header="Ready" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.ready }}
        </template>
    </Column>

    <Column field="containers" header="Containers" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.containers }}
        </template>
    </Column>
    <Column field="images" header="Images" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.images }}
        </template>
    </Column>

    <Column field="selector" header="Selector" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.selector }}
        </template>
    </Column>

    
    <Column field="age" header="Age" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.age }}
        </template>
    </Column>

    </DataTable>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { kubeCmds } from '../../../constants/commands';
import { MessageTypes } from '@common/messageTypes';
import TimeAgo from 'javascript-time-ago';
import { HelperUtils } from '../../../utils/helpers';

import { globalStore } from '../../../store/store';
import { useRouter } from 'vue-router';
import type { ReplicaSetListType, ReplicasetTableItem, ReplicaSetType } from '@src/types/replicaset.type';

const replsetListData = ref<ReplicaSetListType| null>(null);
const replsetTableData = ref<ReplicasetTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const isNamespace = ref(false);
const router = useRouter();

const getReplicaSetList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'replicasetList',
        command: HelperUtils.prepareCommand(kubeCmds.getReplSetList)
    });
}

const gotoNamespaceDetails = (name: string) => {
    router.push({name: 'namespaceoverview', params: {namespace: name}});
}

const gotoReplSetDetails = (data: ReplicasetTableItem) => {
    if(globalStore.namespace === null){
        globalStore.namespace = data.namespace;
        globalStore.breadcrumbItems = [
            {label: data.namespace, params:{namespace: data.namespace}
                , navigateTo: 'namespaceoverview', index: 0}
        ];
    }
    router.push({name: 'replsetoverview', params: {rsname: data.name}});
}

window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "replicasetList"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as ReplicaSetListType;
        
        if(configDetails?.items?.length > 0){
            const timeAgo = new TimeAgo('en-US');
            const tData = configDetails.items.map((item: ReplicaSetType) => {
                const timestamp = item.metadata?.creationTimestamp || (new Date()).toISOString();
                const age = timeAgo.format(new Date(timestamp));
                
                const containers = item.spec?.template?.spec?.containers.map((container: any) => {
                    return container.name;
                }).join(', ') || '-';
                const images = item.spec?.template?.spec?.containers.map((container: any) => {
                    return container.image;
                }).join(', ') || '-';

                const selector = item.spec?.selector?.matchLabels ? Object.entries(item.spec?.selector?.matchLabels).map(([key, value]) => `${key}=${value}`).join(', ') : '-';
                return {
                    namespace: item.metadata?.namespace || 'default',
                    name: item.metadata?.name || '-',
                    age: age, 
                    desired: item.status?.replicas.toString() || '0',
                    current: item.status?.availableReplicas?.toString() || '0',
                    ready: item.status?.readyReplicas?.toString() || '0',
                    containers: containers,
                    images: images,
                    selector: selector
                } as ReplicasetTableItem;
            });
            
            replsetTableData.value = [...tData];
            replsetListData.value = configDetails;
        }else{
            replsetTableData.value = [];
            replsetListData.value = null;
        }
    }
});

onMounted(() => {
    getReplicaSetList();
    if(globalStore.namespace !== null){
        isNamespace.value = true;
    }
});


</script>
<style scoped>


</style>