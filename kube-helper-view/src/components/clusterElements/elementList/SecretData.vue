<template>
    <DataTable v-model:expandedRows="expandedRows" :value="secretTableData" v-model:filters="filters"
    paginator :rows="5" dataKey="key" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getSecretData" />
        </div>
    </template>
    <template #empty> No data found. </template>
    <template #loading> Loading secret. Please wait. </template>
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
import type { SecretDataTableItem, SecretListType, SecretType } from '@src/types/secret.type';

const route = useRoute();

const secretName = ref('');
const secretListData = ref<SecretListType| null>(null);
const secretTableData = ref<SecretDataTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const expandedRows = ref({});

const getSecretData = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'secretData',
        command: HelperUtils.prepareCommand(
            kubeCmds.getNamespacedResourceByName.replace("{{resType}}", 'secret')
            .replace("{{resName}}", secretName.value)),
    });
}

window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "secretData"){
        
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as SecretType;
        if(configDetails?.data && Object.keys(configDetails.data).length > 0){
            const tData = Object.entries(configDetails.data).map(([key, value]) => {
                return {
                    key: key,
                    value: value,
                } as SecretDataTableItem;
            });
            secretTableData.value = [...tData];
            secretListData.value = configDetails;
        }else{
            secretTableData.value = [];
            secretListData.value = null;
        }
    }
});

onMounted(() => {
    if((route.params.secretname !== null ) && 
    (typeof route.params.secretname === 'string')){
        secretName.value = route.params.secretname;
        getSecretData();
    }
    
});


</script>
<style scoped>


</style>