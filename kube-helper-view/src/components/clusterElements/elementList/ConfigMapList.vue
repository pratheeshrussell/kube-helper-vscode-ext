<template>
    <DataTable :value="cmTableData" v-model:filters="filters"
    paginator :rows="5" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getConfigMapList" />
        </div>
    </template>
    <template #empty> No configmap found. </template>
    <template #loading> Loading configmap. Please wait. </template>

    <Column v-if="!isNamespace" field="namespace" header="Namespace" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.namespace" variant="link" @click="gotoNamespaceDetails(data.namespace)" />
        </template>
    </Column>
    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.name" variant="link" @click="gotoCMDetails(data)" />
        </template>
    </Column>
    <Column field="age" header="Age" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.age }}
        </template>
    </Column>
    <Column field="data-count" header="Data Count" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.dataCount }}
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

import type { ConfigMapListType, ConfigMapTableItem,ConfigMapType } from '@src/types/configMap';

const cmListData = ref<ConfigMapListType| null>(null);
const cmTableData = ref<ConfigMapTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const isNamespace = ref(false);
const router = useRouter();

const getConfigMapList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'configmapList',
        command: HelperUtils.prepareCommand(kubeCmds.getConfigMap)
    });
}

const gotoNamespaceDetails = (name: string) => {
    router.push({name: 'namespaceoverview', params: {namespace: name}});
}

const gotoCMDetails = (data: ConfigMapTableItem) => {
    if(globalStore.namespace === null){
        globalStore.namespace = data.namespace;
        globalStore.breadcrumbItems = [
            {label: data.namespace, params:{namespace: data.namespace}
                , navigateTo: 'namespaceoverview', index: 0}
        ];
    }
    router.push({name: 'configmapoverview', params: {cmname: data.name}});
}


window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "configmapList"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as ConfigMapListType;
        
        if(configDetails?.items && configDetails?.items?.length > 0){
            const timeAgo = new TimeAgo('en-US');
            const tData = configDetails.items.map((item:ConfigMapType) => {
                const timeStamp = item?.metadata?.creationTimestamp || (new Date()).toISOString();
                const age = timeAgo.format(new Date(timeStamp));
                
                return {
                    age: age,
                    timestamp: timeStamp,
                    name: item?.metadata?.name || '',
                    dataCount: item?.data ? Object.keys(item.data).length : 0,
                    namespace: item?.metadata?.namespace || 'default',
                } as ConfigMapTableItem
            });
            cmTableData.value = [...tData];
            cmListData.value = configDetails;
        }else{
            cmTableData.value = [];
            cmListData.value = null;
        }
    }
});

onMounted(() => {
    getConfigMapList();
    if(globalStore.namespace !== null){
        isNamespace.value = true;
    }
});


</script>
<style scoped>


</style>