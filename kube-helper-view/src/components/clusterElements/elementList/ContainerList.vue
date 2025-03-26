<template>
    <DataTable :value="containerTableData" v-model:filters="filters"
    paginator :rows="10" dataKey="id" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData v-if="podName != null" :reloadFunction="getPodDetails" />
        </div>
    </template>
    <template #empty> No containers found. </template>
    <template #loading> Loading containers. Please wait. </template>


    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.name" variant="link" @click="gotoContainerDetails(data)" />
        </template>
    </Column>
    <Column field="image" header="Image" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.image }}
        </template>
    </Column>
    <Column field="type" header="Type" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.type }}
        </template>
    </Column>
    <Column field="status" header="Status" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.status }}
        </template>
    </Column>
    <Column field="reason" header="Reason" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.reason }}
        </template>
    </Column>
    <Column field="exitcode" header="Exit Code" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.exitcode }}
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
import en from 'javascript-time-ago/locale/en';
import { HelperUtils } from '../../../utils/helpers';
import { useRoute, useRouter } from 'vue-router';
import type { Container, ContainerStatus, ContainerStatusState, ContainerTableItem, PodListTypeItem, TableContainerTypes } from '@src/types/podList.type';

TimeAgo.addDefaultLocale(en)

const podName = ref<string| null>(null);
const podData = ref<PodListTypeItem| null>(null);
const containerTableData = ref<ContainerTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const router = useRouter();
const route = useRoute();

const getPodDetails = () => {
    if(podName.value == null){
        return;
    }
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'getPodByName',
        command: HelperUtils.prepareCommand(kubeCmds.getPodByName.replace('{{podname}}', podName.value))
    });
}

window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "getPodByName"){
        // console.log('pod details ', podName.value);
        // console.log('pod details ', event.data.data);
        
        const configDetails = JSON.parse(event.data.data) as PodListTypeItem;
        const localcontainerTableData: ContainerTableItem[] = [];
        
        if(configDetails?.spec?.initContainers && configDetails?.spec?.initContainers?.length > 0){
           const initItems:ContainerTableItem[] = extractTableData(
            configDetails.spec.initContainers, 
            configDetails.status.initContainerStatuses!,
            'init');
           localcontainerTableData.push(...initItems);
        }
        if(configDetails?.spec?.containers?.length > 0){
            const containerItems:ContainerTableItem[] = extractTableData(
                configDetails.spec.containers, 
                configDetails.status.containerStatuses,
                'container');
            localcontainerTableData.push(...containerItems);
        }
        if(localcontainerTableData.length > 0){
            containerTableData.value = [...localcontainerTableData];
            podData.value = configDetails;
        }else{
            containerTableData.value = [];
            podData.value = null;
        }
    }
});

const gotoContainerDetails = (data: ContainerTableItem) => {
    if(podName.value != null){
        console.log('pod details ', data);
        router.push({name: 'containeroverview', params: {
            podname: podName.value,
            container: data.name}});
    }
}

const extractTableData = (containers: Container[],statuses: ContainerStatus[], type: TableContainerTypes):ContainerTableItem[] => {
    //const timeAgo = new TimeAgo('en-US');
    let tableData:ContainerTableItem[] = [];
    if(containers?.length > 0){
        containers.forEach(container => {
            const containerstatus = statuses.find(s => s.name === container.name);
            const state = containerstatus?.state;
            let status: ContainerStatusState | null =null;
            let reason: string | null = null;
            let exitcode: string | null = null;
            if(state){
                const activeState = Object.keys(state)[0];
                if(activeState){
                    status = activeState as ContainerStatusState;
                    reason = (state as any)[activeState]?.reason;
                    exitcode = (state as any)[activeState]?.exitCode;
                }
                tableData.push({
                    name: container.name,
                    image: container.image,
                    type: type,
                    status: status ? status.toString() : '',
                    reason: reason ?? '',
                    exitcode: exitcode ?? ''
                })
            }
        });
    }
    return tableData;
};

onMounted(() => {
    const curpodName = route.params.podname;
    if(curpodName !== null && typeof curpodName === 'string'){
        podName.value = curpodName;
        getPodDetails();
    }
    
});

</script>
<style scoped>


</style>