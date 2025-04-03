<template>
    <DataTable :value="endpointTableData" v-model:filters="filters"
    paginator :rows="5" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getEndpointList" />
        </div>
    </template>
    <template #empty> No endpoints found. </template>
    <template #loading> Loading endpoints. Please wait. </template>

    <Column v-if="!isNamespace" field="namespace" header="Namespace" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.namespace" variant="link" @click="gotoNamespaceDetails(data.namespace)" />
        </template>
    </Column>
    
    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
           {{ data.name }}
        </template>
    </Column>
    <Column field="endpoints" header="Endpoints" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.endpoints }}
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
import type { EndpointsListType, EndpointsTableItem } from '@src/types/endpoint.type';

const endpointListData = ref<EndpointsListType| null>(null);
const endpointTableData = ref<EndpointsTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const isNamespace = ref(false);
const router = useRouter();

const getEndpointList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'endpointList',
        command: HelperUtils.prepareCommand(kubeCmds.getEndpointList)
    });
}

const gotoNamespaceDetails = (name: string) => {
    router.push({name: 'namespaceoverview', params: {namespace: name}});
}

window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "endpointList"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as EndpointsListType;
        
        if(configDetails?.items && configDetails?.items?.length > 0){
            const timeAgo = new TimeAgo('en-US');
            const tData = configDetails.items.map(item => {
                const timestamp = item.metadata?.creationTimestamp || (new Date()).toISOString();
                const age = timeAgo.format(new Date(timestamp));

                const endpointList = item.subsets ? item.subsets.map((subset, i) => {
                    return subset.addresses?.map((address) => {
                        const port = subset.ports![i].port;
                        return `${address.ip}:${port}`;
                    }).join(', ');
                }).join(', ') : '<none>';
                return {
                    namespace: item.metadata?.namespace || 'default',
                    name: item.metadata?.name,
                    endpoints: endpointList,
                    
                    age: age,
                    timestamp: timestamp,
                } as EndpointsTableItem;
            });
            
            endpointTableData.value = [...tData];
            endpointListData.value = configDetails;
        }else{
            endpointTableData.value = [];
            endpointListData.value = null;
        }
    }
});

onMounted(() => {
    getEndpointList();
    if(globalStore.namespace !== null){
        isNamespace.value = true;
    }
});


</script>
<style scoped>


</style>