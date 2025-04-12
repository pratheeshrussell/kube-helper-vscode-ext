<template>
    <DataTable :value="ingressTableData" v-model:filters="filters"
    paginator :rows="5" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getIngressList" />
        </div>
    </template>
    <template #empty> No ingress found. </template>
    <template #loading> Loading ingress. Please wait. </template>

    <Column v-if="!isNamespace" field="namespace" header="Namespace" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.namespace" variant="link" @click="gotoNamespaceDetails(data.namespace)" />
        </template>
    </Column>
    
    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.name" variant="link" @click="gotoIngressDetails(data.name)" />
        </template>
    </Column>
    <Column field="class" header="Class" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.class }}
        </template>
    </Column>
    <Column field="hosts" header="Hosts" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.hosts }}
        </template>
    </Column>
    <Column field="address" header="Address" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.address }}
        </template>
    </Column>
    <Column field="ports" header="Ports" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.ports }}
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
import type { IngressListType, IngressTableItem } from '@src/types/ingress.type';


const ingressListData = ref<IngressListType| null>(null);
const ingressTableData = ref<IngressTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const isNamespace = ref(false);
const router = useRouter();

const getIngressList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'ingressList',
        command: HelperUtils.prepareCommand(kubeCmds
        .getNamespacedResourceByType.replace("{{resType}}", 'ingress'))
    });
}

const gotoNamespaceDetails = (name: string) => {
    router.push({name: 'namespaceoverview', params: {namespace: name}});
}

const gotoIngressDetails = (name: string) => {
    router.push({name: 'ingressoverview', params: {ingressname: name}});
}



window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "ingressList"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as IngressListType;
        
        if(configDetails?.items && configDetails?.items?.length > 0){
            const timeAgo = new TimeAgo('en-US');
            const tData = configDetails.items.map(item => {
                const timestamp = item.metadata?.creationTimestamp || (new Date()).toISOString();
                const age = timeAgo.format(new Date(timestamp));

                const address = item.status?.loadBalancer?.ingress?.map(ingress => ingress.ip).join(', ');
                const ports = item.spec?.rules?.map(rule => {
                    if(rule.http?.paths && rule.http?.paths?.length > 0){
                        return ((rule.http?.paths[0]?.backend?.service?.port?.number) ?? undefined);
                    }
                    return undefined;
                }).filter(port => port !== undefined).join(', ');
                return {
                    namespace: item.metadata?.namespace || 'default',
                    name: item.metadata?.name,
                    class: item.spec?.ingressClassName ?? '',
                    hosts: item.spec?.rules?.map(rule => rule.host).join(', '),
                    address: address ?? '',
                    ports: ports ?? '',
                    
                    age: age,
                    timestamp: timestamp,
                } as IngressTableItem;
            });
            
            ingressTableData.value = [...tData];
            ingressListData.value = configDetails;
        }else{
            ingressTableData.value = [];
            ingressListData.value = null;
        }
    }
});

onMounted(() => {
    getIngressList();
    if(globalStore.namespace !== null){
        isNamespace.value = true;
    }
});


</script>
<style scoped>


</style>