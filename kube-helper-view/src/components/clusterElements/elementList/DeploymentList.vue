<template>
    <DataTable :value="deploymentTableData" v-model:filters="filters"
    paginator :rows="5" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getDeploymentList" />
        </div>
    </template>
    <template #empty> No deployment found. </template>
    <template #loading> Loading deployments. Please wait. </template>

    <Column v-if="!isNamespace" field="namespace" header="Namespace" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.namespace" variant="link" @click="gotoNamespaceDetails(data.namespace)" />
        </template>
    </Column>
    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.name" variant="link" @click="gotodeploymentDetails(data)" />
        </template>
    </Column>

    <Column field="ready" header="Ready" style="min-width: 12rem">
        <template #body="{ data }">
            {{ `${data.ready}/${data.totalReplicas}` }}
        </template>
    </Column>
    <Column field="upToDate" header="up to date" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.upToDate }}
        </template>
    </Column>
    <Column field="available" header="Available" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.available }}
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
import type { DeploymentListType, DeploymentTableItem, DeploymentType } from '@src/types/deployment.type';

const deploymentListData = ref<DeploymentListType| null>(null);
const deploymentTableData = ref<DeploymentTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const isNamespace = ref(false);
const router = useRouter();

const getDeploymentList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'deploymentList',
        command: HelperUtils.prepareCommand(kubeCmds.getDeploymentList)
    });
}

const gotoNamespaceDetails = (name: string) => {
    router.push({name: 'namespaceoverview', params: {namespace: name}});
}

const gotodeploymentDetails = (data: DeploymentTableItem) => {
    console.log('deployment details', data);
    if(globalStore.namespace === null){
        globalStore.namespace = data.namespace;
        globalStore.breadcrumbItems = [
            {label: data.namespace, params:{namespace: data.namespace}
                , navigateTo: 'namespaceoverview', index: 0}
        ];
    }
    router.push({name: 'deploymentoverview', params: {depname: data.name}});
}

window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "deploymentList"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as DeploymentListType;
        
        if(configDetails?.items?.length > 0){
            const timeAgo = new TimeAgo('en-US');
            const tData = configDetails.items.map((item: DeploymentType) => {
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
                    ready: item.status?.readyReplicas?.toString() || '0',
                    totalReplicas: item.status?.replicas?.toString() || '0',
                    upToDate: item.status?.updatedReplicas?.toString() || '0',
                    available: item.status?.availableReplicas?.toString() || '0',
                    containers: containers,
                    images: images,
                    selector: selector
                } as DeploymentTableItem;
            });
            
            deploymentTableData.value = [...tData];
            deploymentListData.value = configDetails;
        }else{
            deploymentTableData.value = [];
            deploymentListData.value = null;
        }
    }
});

onMounted(() => {
    getDeploymentList();
    if(globalStore.namespace !== null){
        isNamespace.value = true;
    }
});


</script>
<style scoped>


</style>