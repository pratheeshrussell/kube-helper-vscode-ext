<template>
    <DataTable :value="scTableData" v-model:filters="filters"
    paginator :rows="5" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getScList" />
        </div>
    </template>
    <template #empty> No storage class found. </template>
    <template #loading> Loading sc. Please wait. </template>
    
    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.name }}
        </template>
    </Column>
    <Column field="provisioner" header="Provisioner" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.provisioner }}
        </template>
    </Column>
    <Column field="reclaim-policy" header="Reclaim Policy" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.reclaimPolicy }}
        </template>
    </Column>
    <Column field="volBindingMode" header="Vol Binding mode" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.volBindingMode }}
        </template>
    </Column>
    <Column field="allowVolumeExpansion" header="Allow Vol Expansion" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.allowVolumeExpansion }}
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
import type { SCListType, SCTableItem } from '@src/types/sc.type';


const scListData = ref<SCListType| null>(null);
const scTableData = ref<SCTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});

const getScList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'pvcList',
        command: HelperUtils.prepareCommand(kubeCmds.getScList)
    });
}

window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "pvcList"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as SCListType;
        
        if(configDetails?.items && configDetails?.items?.length > 0){
            const timeAgo = new TimeAgo('en-US');
            const tData = configDetails.items.map(item => {
                const timestamp = item.metadata?.creationTimestamp || (new Date()).toISOString();
                const age = timeAgo.format(new Date(timestamp));
                
                return {
                    name: item.metadata?.name,
                    provisioner: item.provisioner,
                    reclaimPolicy: item.reclaimPolicy,
                    volBindingMode: item.volumeBindingMode,
                    allowVolumeExpansion: item.allowVolumeExpansion ? 'true' : 'false',
                    timestamp: timestamp,
                    age: age,
                } as SCTableItem;
            });
            
            scTableData.value = [...tData];
            scListData.value = configDetails;
        }else{
            scTableData.value = [];
            scListData.value = null;
        }
    }
});

onMounted(() => {
    getScList();
});


</script>
<style scoped>


</style>