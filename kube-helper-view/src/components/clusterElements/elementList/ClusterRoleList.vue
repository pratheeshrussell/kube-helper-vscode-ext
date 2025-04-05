<template>
    <DataTable :value="crTableData" v-model:filters="filters"
    paginator :rows="5" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getClusterRoleList" />
        </div>
    </template>
    <template #empty> No cluster roles found. </template>
    <template #loading> Loading cluster roles. Please wait. </template>

    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.name" variant="link" @click="gotoCRDetails(data)" />
        </template>
    </Column>
    <Column field="createdAt" header="Created at" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.createdAt }}
        </template>
    </Column>
    </DataTable>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { kubeCmds } from '../../../constants/commands';
import { MessageTypes } from '@common/messageTypes';
import { HelperUtils } from '../../../utils/helpers';
import { globalStore } from '../../../store/store';
import { useRouter } from 'vue-router';
import type { ClusterRoleListType, ClusterRoleTableItem, ClusterRoleType } from '@src/types/clusterRole.type';

const crListData = ref<ClusterRoleListType| null>(null);
const crTableData = ref<ClusterRoleTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const isNamespace = ref(false);
const router = useRouter();

const getClusterRoleList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'clusterRoleList',
        command: HelperUtils.prepareCommand(kubeCmds.getClusterRoleList)
    });
}

const gotoCRDetails = (data: ClusterRoleTableItem) => {
    // this is a root level item
    globalStore.breadcrumbItems = [];
    router.push({name: 'clusterRoleoverview', params: {crname: data.name}});
}


window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "clusterRoleList"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as ClusterRoleListType;
        
        if(configDetails?.items && configDetails?.items?.length > 0){
            const tData = configDetails.items.map((item:ClusterRoleType) => {
                const timeStamp = item?.metadata?.creationTimestamp || (new Date()).toISOString();
                
                return {          
                    name: item?.metadata?.name || '',
                    createdAt: timeStamp,
                } as ClusterRoleTableItem
            });
            crTableData.value = [...tData];
            crListData.value = configDetails;
        }else{
            crTableData.value = [];
            crListData.value = null;
        }
    }
});

onMounted(() => {
    getClusterRoleList();
    if(globalStore.namespace !== null){
        isNamespace.value = true;
    }
});


</script>
<style scoped>


</style>