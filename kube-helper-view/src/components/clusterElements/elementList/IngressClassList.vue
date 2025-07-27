<template>
    <DataTable :value="icTableData" v-model:filters="filters"
    paginator :rows="5" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getIcList" />
        </div>
    </template>
    <template #empty> No ingress class found. </template>
    <template #loading> Loading ingress classes. Please wait. </template>
    
    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
            <span class="selectable">
                {{ data.name }}
            </span>
        </template>
    </Column>
    <Column field="controller" header="Controller" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.controller }}
        </template>
    </Column>
    <Column field="parameters" header="Parameters" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.parameters }}
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
import type { IngressClassListType, IngressClassTableItem } from '@src/types/ingressClass.type';


const icListData = ref<IngressClassListType| null>(null);
const icTableData = ref<IngressClassTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});

const getIcList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'ingressclassList',
        command: HelperUtils.prepareCommand(kubeCmds
        .getNonNamespacedResourceByType.replace("{{resType}}", 'ingressclass'))
    });
}

window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "ingressclassList"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as IngressClassListType;
        
        if(configDetails?.items && configDetails?.items?.length > 0){
            const timeAgo = new TimeAgo('en-US');
            const tData = configDetails.items.map(item => {
                const timestamp = item.metadata?.creationTimestamp || (new Date()).toISOString();
                const age = timeAgo.format(new Date(timestamp));
                
                return {
                    name: item.metadata?.name,
                    controller: item.spec?.controller,
                    parameters: item.spec?.parameters?.name ?? '',
                    timestamp: timestamp,
                    age: age,
                } as IngressClassTableItem;
            });
            
            icTableData.value = [...tData];
            icListData.value = configDetails;
        }else{
            icTableData.value = [];
            icListData.value = null;
        }
    }
});

onMounted(() => {
    getIcList();
});


</script>
<style scoped>


</style>