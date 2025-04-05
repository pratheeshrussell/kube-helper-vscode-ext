<template>
    <DataTable :value="saTableData" v-model:filters="filters"
    paginator :rows="5" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getSaList" />
        </div>
    </template>
    <template #empty> No sa found. </template>
    <template #loading> Loading sa. Please wait. </template>

    <Column v-if="!isNamespace" field="namespace" header="Namespace" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.namespace" variant="link" @click="gotoNamespaceDetails(data.namespace)" />
        </template>
    </Column>
    
    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }"> 
            <Button :label="data.name" variant="link" @click="gotoSaDetails(data)" />
        </template>
    </Column>
    <Column field="secretsCount" header="Secret Count" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.secretsCount }}
        </template>
    </Column>
    <Column field="imagePullSecrets" header="Image Pull Secrets" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.imagePullSecrets }}
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
import type { ServiceAccountListType, ServiceAccountTableItem } from '@src/types/serviceAccount.type';


const saListData = ref<ServiceAccountListType | null>(null);
const saTableData = ref<ServiceAccountTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const isNamespace = ref(false);
const router = useRouter();

const getSaList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'saList',
        command: HelperUtils.prepareCommand(kubeCmds.getServiceAccountList)
    });
}

const gotoNamespaceDetails = (name: string) => {
    router.push({name: 'namespaceoverview', params: {namespace: name}});
}

const gotoSaDetails = (data: ServiceAccountTableItem) => {
    if(globalStore.namespace === null){
        globalStore.namespace = data.namespace;
        globalStore.breadcrumbItems = [
            {label: data.namespace, params:{namespace: data.namespace}
                , navigateTo: 'namespaceoverview', index: 0}
        ];
    }
    router.push({name: 'saoverview', params: {saname: data.name}});
}

window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "saList"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as ServiceAccountListType;
        
        if(configDetails?.items && configDetails?.items?.length > 0){
            const timeAgo = new TimeAgo('en-US');
            const tData = configDetails.items.map(item => {
                const timestamp = item.metadata?.creationTimestamp || (new Date()).toISOString();
                const age = timeAgo.format(new Date(timestamp));
                
                return {
                    namespace: item.metadata?.namespace || 'default',
                    name: item.metadata?.name,
                    imagePullSecrets: item.imagePullSecrets?.map((secret: any) => secret.name).join(', ') || '',
                    secretsCount: item?.secrets?.length.toString() ?? '0',
                    age: age,
                    timestamp: timestamp,
                } as ServiceAccountTableItem;
            });
            
            saTableData.value = [...tData];
            saListData.value = configDetails;
        }else{
            saTableData.value = [];
            saListData.value = null;
        }
    }
});

onMounted(() => {
    getSaList();
    if(globalStore.namespace !== null){
        isNamespace.value = true;
    }
});


</script>
<style scoped>


</style>