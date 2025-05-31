<template>
    <Message v-if="errorMessage" severity="error" :closable="true" @close="errorMessage = null">{{ errorMessage }}</Message>
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
            <Button :label="data.name" class="selectable" variant="link" @click="gotoPodDetails(data)" />
        </template>
    </Column>
    <Column field="owner" header="Owner" style="min-width: 12rem">
        <template #body="{ data }">
            <span v-if="data.primaryOwner != null" class="selectable" v-tooltip="data.primaryOwner.kind">
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

    <Column header="Actions" style="min-width: 10rem">
        <template #body="{ data }">
            <SplitButton :model="getPodActions(data)" label="View Details"
                         @click="gotoPodDetails(data)"
                         class="p-button-sm" />
        </template>
    </Column>

    </DataTable>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { MenuItem } from 'primevue/menuitem';
import { FilterMatchMode } from '@primevue/core/api';
import { kubeCmds } from '../../../constants/commands';
import { MessageTypes } from '@common/messageTypes';
import TimeAgo from 'javascript-time-ago';
import { HelperUtils } from '../../../utils/helpers';

import { globalStore } from '../../../store/store';
import { useRouter } from 'vue-router';
import type { PodListType, PodTableItem } from '@src/types/podList.type';

const podListData = ref<PodListType| null>(null);
const podTableData = ref<PodTableItem[]>([]);
const loading = ref(true);
const errorMessage = ref<string | null>(null);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const isNamespace = ref(false);
const router = useRouter();

const getPodList = () => {
    loading.value = true;
    errorMessage.value = null;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'podList',
        command: HelperUtils.prepareCommand(kubeCmds
        .getNamespacedResourceByType.replace("{{resType}}", 'pod'))
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

const gotoPodLogs = (data: PodTableItem) => {
    if(globalStore.namespace === null){
        globalStore.namespace = data.namespace;
        globalStore.breadcrumbItems = [
            {label: data.namespace, params:{namespace: data.namespace}
                , navigateTo: 'namespaceoverview', index: 0}
        ];
    }
    router.push({name: 'podoverview', params: {podname: data.name}, query: { tab: '1' }}); // '1' for Logs tab
}

const gotoPodExec = (data: PodTableItem) => {
    // For now, navigates to details view where exec options are.
    // Future: could pass a query param like ?tab=exec if there's a dedicated exec tab/section.
    if(globalStore.namespace === null){
        globalStore.namespace = data.namespace;
        globalStore.breadcrumbItems = [
            {label: data.namespace, params:{namespace: data.namespace}
                , navigateTo: 'namespaceoverview', index: 0}
        ];
    }
    // Assuming Exec options are available on the pod overview page, no specific tab query needed for now.
    // PodElement.vue already shows RunExec at the top.
    router.push({name: 'podoverview', params: {podname: data.name}});
}

const gotoPodEdit = (data: PodTableItem) => {
    // For now, navigates to details view where edit options are.
    // PodElement.vue already shows EditResource at the top.
    // Future: could pass a query param like ?tab=edit if there's a dedicated edit tab/section.
    if(globalStore.namespace === null){
        globalStore.namespace = data.namespace;
        globalStore.breadcrumbItems = [
            {label: data.namespace, params:{namespace: data.namespace}
                , navigateTo: 'namespaceoverview', index: 0}
        ];
    }
    router.push({name: 'podoverview', params: {podname: data.name}, query: { action: 'edit' }}); // Or some other indicator. For now, just nav.
}

const handleDeletePod = (data: PodTableItem) => {
    // For now, navigates to details view where delete options are.
    // PodElement.vue already shows DeleteResource at the top.
    if(globalStore.namespace === null){
        globalStore.namespace = data.namespace;
        globalStore.breadcrumbItems = [
            {label: data.namespace, params:{namespace: data.namespace}
                , navigateTo: 'namespaceoverview', index: 0}
        ];
    }
    router.push({name: 'podoverview', params: {podname: data.name}, query: { action: 'delete' }}); // Or some other indicator.
}

const getPodActions = (podData: PodTableItem): MenuItem[] => {
    return [
        {
            label: 'View Logs',
            icon: 'pi pi-align-left',
            command: () => gotoPodLogs(podData)
        },
        {
            label: 'Exec into Pod',
            icon: 'pi pi-terminal',
            command: () => gotoPodExec(podData)
        },
        {
            label: 'Edit YAML',
            icon: 'pi pi-pencil',
            command: () => gotoPodEdit(podData)
        },
        {
            label: 'Delete',
            icon: 'pi pi-trash',
            command: () => handleDeletePod(podData)
        }
    ];
}

window.addEventListener('message', (event) => {
    if(event.data.type == "podList"){
        loading.value = false;
        errorMessage.value = null;
        try {
            const messageData = event.data.data;
            if (messageData?.error) {
                console.error("Error fetching pod list:", messageData.errormessage);
                errorMessage.value = `Error fetching pod list: ${messageData.errormessage || 'Unknown error'}`;
                podTableData.value = [];
                podListData.value = null;
                return;
            }

            const configDetails = JSON.parse(messageData.output || messageData) as PodListType; // messageData could be string or {output: string, error: boolean, ...}

            if(configDetails?.items?.length > 0){
                const timeAgo = new TimeAgo('en-US');
                const tData = configDetails.items.map(item => {
                    const timestamp = item.metadata?.creationTimestamp || (new Date()).toISOString();
                const age = timeAgo.format(new Date(timestamp));
                
                let readyInitContainers = 0;
                let readyInitContainersTotal = 0;
                let initContainerError = '';
                let readyContainers = 0;
                let totalContainers = 0;
                item.status?.initContainerStatuses?.forEach((container, index) => {
                    if(container?.state && container.state.terminated && container.state.terminated.exitCode == 0){
                        readyInitContainers++;
                    }else{
                       if(container?.state && container.state.waiting && container.state.waiting?.reason != null){
                        initContainerError = `Init (${index}): ${container.state.waiting.reason}`;
                       } else if (container?.state && container.state.terminated && container.state.terminated.exitCode != 0){
                        initContainerError = `Init (${index}): ${container.state.terminated.reason}`;
                       }
                    }
                    readyInitContainersTotal++;
                });
                //let containerError = 'TODO: SHOW ERROR';
                item.status?.containerStatuses?.forEach(container => {
                    if(container?.state && ((container.state.terminated?.exitCode === 0) ||
                    (container.state.running !== undefined))){
                        readyContainers++;
                    }else{
                      //  containerError = "TODO: SHOW ERROR";
                    }
                    totalContainers++;
                });

                // Find status
                let status = '';
                if (item.status && item.status.phase === 'Failed') {
                    status = 'Failed';
                } else if (item.status && item.status.phase === 'Pending') {
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
                    namespace: item.metadata?.namespace || 'default',
                    name: item.metadata?.name || '-',
                    age: age,
                    timestamp: timestamp,
                    primaryOwner:ownerReferences && ownerReferences?.length > 0 ? ownerReferences[0] : null,
                    ready: `${readyContainers}/${totalContainers}`,
                    status: status,
                    restarts: restartCount.toString()
                }
            });
            
                podTableData.value = [...tData];
                podListData.value = configDetails;
            }else{
                // No items, but not necessarily an error from the command itself
                podTableData.value = [];
                podListData.value = null;
                if (!configDetails || !configDetails.items) { // If parsing failed or items is not an array
                     // This case might be redundant if error is caught by messageData.error or JSON.parse
                    errorMessage.value = "Failed to parse pod list data or no items found.";
                }
            }
        } catch (e: any) {
            console.error("Error processing podList message:", e);
            errorMessage.value = `Failed to process pod list data: ${e.message}`;
            podTableData.value = [];
            podListData.value = null;
        }
    }
});

onMounted(() => {
    getPodList(); // This will also reset errorMessage.value
    if(globalStore.namespace !== null){
        isNamespace.value = true;
    }
});


</script>
<style scoped>


</style>