<template>
    <DataTable v-model:expandedRows="expandedRows" :value="cmTableData" v-model:filters="filters"
    paginator :rows="5" dataKey="key" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getCmData" />
        </div>
    </template>
    <template #empty> No data found. </template>
    <template #loading> Loading config. Please wait. </template>
    <Column expander style="width: 5rem" />
    <Column field="key" header="Key" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.key }}
        </template>
    </Column>
    <Column field="value" header="Value" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.value.length > 10 ? data.value.slice(0, 7) : data.value }}{{ data.value.length > 10 ? '...' : '' }}
        </template>
    </Column>
    <template #expansion="slotProps">
        <div>
            {{ slotProps.data.value }}
        </div>
    </template>
    </DataTable>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { kubeCmds } from '../../../constants/commands';
import { MessageTypes } from '@common/messageTypes';
import { HelperUtils } from '../../../utils/helpers';
import { useRoute } from 'vue-router';

import type { ConfigMapDataTableItem,ConfigMapType } from '@src/types/configMap';

const route = useRoute();

const cmName = ref('');
const cmData = ref<ConfigMapType| null>(null);
const cmTableData = ref<ConfigMapDataTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const expandedRows = ref({});

const getCmData = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'cmData',
        command: HelperUtils.prepareCommand(kubeCmds.getConfigMapByName
        .replace("{{cmname}}", cmName.value)),
    });
}

window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "cmData"){
        
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as ConfigMapType;
        if(configDetails?.data && Object.keys(configDetails.data).length > 0){
            const tData = Object.entries(configDetails.data).map(([key, value]) => {
                return {
                    key: key,
                    value: value,
                } as ConfigMapDataTableItem;
            });
            cmTableData.value = [...tData];
            cmData.value = configDetails;
        }else{
            cmTableData.value = [];
            cmData.value = null;
        }
    }
});

onMounted(() => {
    if((route.params.cmname !== null ) && 
    (typeof route.params.cmname === 'string')){
        cmName.value = route.params.cmname;
        getCmData();
    }
    
});


</script>
<style scoped>


</style>