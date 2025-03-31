<template>
    <DataTable :value="pvcTableData" v-model:filters="filters"
    paginator :rows="5" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getPvcList" />
        </div>
    </template>
    <template #empty> No pvc found. </template>
    <template #loading> Loading pvc. Please wait. </template>

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
    <Column field="status" header="Status" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.status }}
        </template>
    </Column>
    <Column field="volume" header="Volume" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.volume }}
        </template>
    </Column>
    <Column field="capacity" header="Capacity" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.capacity }}
        </template>
    </Column>
    <Column field="accessModes" header="Access Mode" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.accessModes }}
        </template>
    </Column>
    <Column field="storage-class" header="Storage Class" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.storageClassName }}
        </template>
    </Column>
    <Column field="vol-attribution-class" header="Vol attribution class" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.volAttributionClass }}
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
import type { PVCListType, PVCTableItem } from '@src/types/pvc.type';

const pvcListData = ref<PVCListType| null>(null);
const pvcTableData = ref<PVCTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const isNamespace = ref(false);
const router = useRouter();

const getPvcList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'pvcList',
        command: HelperUtils.prepareCommand(kubeCmds.getPvcList)
    });
}

const gotoNamespaceDetails = (name: string) => {
    router.push({name: 'namespaceoverview', params: {namespace: name}});
}



window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "pvcList"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as PVCListType;
        
        if(configDetails?.items && configDetails?.items?.length > 0){
            const timeAgo = new TimeAgo('en-US');
            const tData = configDetails.items.map(item => {
                const timestamp = item.metadata?.creationTimestamp || (new Date()).toISOString();
                const age = timeAgo.format(new Date(timestamp));
                
                return {
                    namespace: item.metadata?.namespace || 'default',
                    name: item.metadata?.name,
                    status: item.status?.phase,
                    capacity: item.status?.capacity?.storage || "0",
                    accessModes: item.spec?.accessModes?.join(', ') || "N/A",
                    storageClassName: item.spec?.storageClassName,         
                    volume: item.spec?.volumeName || "N/A",
                    volAttributionClass: item.spec?.volumeAttributesClassName || '<unset>',
                    age: age,
                    timestamp: timestamp,
                } as PVCTableItem;
            });
            
            pvcTableData.value = [...tData];
            pvcListData.value = configDetails;
        }else{
            pvcTableData.value = [];
            pvcListData.value = null;
        }
    }
});

onMounted(() => {
    getPvcList();
    if(globalStore.namespace !== null){
        isNamespace.value = true;
    }
});


</script>
<style scoped>


</style>