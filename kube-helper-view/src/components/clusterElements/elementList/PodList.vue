<template>
    <DataTable :value="podTableData" v-model:filters="filters"
    paginator :rows="5" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getPodList" />
        </div>
    </template>
    <template #empty> No pods found. </template>
    <template #loading> Loading pods. Please wait. </template>

    <Column v-if="!isNamespace" field="namespace" header="Namespace" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.namespace" variant="link" @click="gotoNamespaceDetails(data.namespace)" />
        </template>
    </Column>
    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.name" variant="link" @click="gotoPodDetails(data)" />
        </template>
    </Column>
    <Column field="owner" header="Owner" style="min-width: 12rem">
        <template #body="{ data }">
            <span v-if="data.primaryOwner != null" v-tooltip="data.primaryOwner.kind">
                {{data.primaryOwner.name}}
            </span>
            <span v-else> - </span>
        </template>
    </Column>
    <Column field="ready" header="Ready" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.ready }}
        </template>
    </Column>
    <Column field="status" header="Status" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.status }}
        </template>
    </Column>
    <Column field="restarts" header="Restarts" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.restarts }}
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
import type { PodListType, PodTableItem } from '../../../types/podList.type';
import { globalStore } from '../../../store/store';
import { useRouter } from 'vue-router';

const podListData = ref<PodListType| null>(null);
const podTableData = ref<PodTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const isNamespace = ref(false);
const router = useRouter();

const getPodList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'podList',
        command: HelperUtils.prepareCommand(kubeCmds.getPodList)
    });
}

const gotoNamespaceDetails = (name: string) => {
    router.push({name: 'namespaceoverview', params: {namespace: name}});
}

const gotoPodDetails = (data: PodTableItem) => {
    if(globalStore.namespace === null){
        globalStore.namespace = data.namespace;
        globalStore.breadcrumbItems = [
            {label: data.namespace, params:{namespace: data.namespace}
                , navigateTo: 'namespaceoverview', index: 0}
        ];
    }
    router.push({name: 'podoverview', params: {podname: data.name}});
}

window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "podList"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as PodListType;
        
        if(configDetails?.items?.length > 0){
            const timeAgo = new TimeAgo('en-US');
            const tData = configDetails.items.map(item => {
                const age = timeAgo.format(new Date(item.metadata.creationTimestamp));
                
                let readyInitContainers = 0;
                let readyInitContainersTotal = 0;
                let initContainerError = '';
                let readyContainers = 0;
                let totalContainers = 0;
                item.status?.initContainerStatuses?.forEach((container, index) => {
                    if(container.state.terminated && container.state.terminated.exitCode == 0){
                        readyInitContainers++;
                    }else{
                       if(container.state.waiting && container.state.waiting?.reason != null){
                        initContainerError = `Init (${index}): ${container.state.waiting.reason}`;
                       } else if (container.state.terminated && container.state.terminated.exitCode != 0){
                        initContainerError = `Init (${index}): ${container.state.terminated.reason}`;
                       }
                    }
                    readyInitContainersTotal++;
                });
                //let containerError = 'TODO: SHOW ERROR';
                item.status?.containerStatuses?.forEach(container => {
                    if((container.state.terminated?.exitCode === 0) ||
                    (container.state.running !== undefined)){
                        readyContainers++;
                    }else{
                      //  containerError = "TODO: SHOW ERROR";
                    }
                    totalContainers++;
                });

                // Find status
                let status = '';
                if (item.status.phase === 'Failed') {
                    status = 'Failed';
                } else if (item.status.phase === 'Pending') {
                    if (readyInitContainers < readyInitContainersTotal) {
                        status = initContainerError || `Init: ${readyInitContainers}/${readyInitContainersTotal}`;
                    } else {
                        status = 'Pending';
                    }
                } else if (readyContainers === totalContainers) {
                    status = 'Ready';
                } else {
                    status = `Containers: ${readyContainers}/${totalContainers}`;
                }
                
                // identify owner resource
                const ownerReferences = item.metadata?.ownerReferences?.filter(ref => {
                    return ref.controller === true;
                }).map(ref => {
                    return {name: ref.name, kind: ref.kind};
                }) ?? null;

                // calculate restart count
                const initRestartCount = item.status?.initContainerStatuses?.reduce((acc, curr) => acc + curr.restartCount, 0) || 0;
                const containerRestartCount = item.status?.containerStatuses?.reduce((acc, curr) => acc + curr.restartCount, 0) || 0;
                let restartCount = 0;
                if(initRestartCount > 0){
                    restartCount = initRestartCount;
                }else{
                    restartCount = containerRestartCount;
                }
                return {
                    namespace: item.metadata.namespace,
                    name: item.metadata.name,
                    age: age,
                    timestamp: item.metadata.creationTimestamp,
                    primaryOwner:ownerReferences?.length > 0 ? ownerReferences[0] : null,
                    ready: `${readyContainers}/${totalContainers}`,
                    status: status,
                    restarts: restartCount.toString()
                }
            });
            
            podTableData.value = [...tData];
            podListData.value = configDetails;
        }else{
            podTableData.value = [];
            podListData.value = null;
        }
    }
});

onMounted(() => {
    getPodList();
    if(globalStore.namespace !== null){
        isNamespace.value = true;
    }
});


</script>
<style scoped>


</style>