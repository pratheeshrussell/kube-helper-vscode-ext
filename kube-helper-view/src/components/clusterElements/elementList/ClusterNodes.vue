<template>
    <DataTable :value="nodeTableData" v-model:filters="filters"
    paginator :rows="10" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="flex justify-end">
          <IconField>
            <InputIcon>
                <i class="pi pi-search" />
            </InputIcon>
            <InputText v-model="filters['global'].value" placeholder="Global Search" />
          </IconField>
        </div>
    </template>
    <template #empty> No nodes found. </template>
    <template #loading> Loading nodes. Please wait. </template>

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
    <Column field="roles" header="Roles" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.roles }}
        </template>
    </Column>
    
    <Column field="age" header="Age" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.age }}
        </template>
    </Column>
    <Column field="version" header="Version" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.version }}
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
import type { ClusterNodeTableData, ClusterNodeType } from '../../../types/clustertype.type';
import { HelperUtils } from '../../../utils/helpers';


const nodeData = ref<ClusterNodeType| null>(null);
const nodeTableData = ref<ClusterNodeTableData[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});

const getNodeDetails = () => {
    loading.value = true;
    // TODO replace context or it wont work
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'clusterNodeDetails',
        command: HelperUtils.prepareCommand(kubeCmds.getClusterNodes)
    });
}

window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "clusterNodeDetails"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as ClusterNodeType;
        
        if(configDetails?.items?.length > 0){
            const timeAgo = new TimeAgo('en-US');
            const tData = configDetails.items.map(item => {
                const age = timeAgo.format(new Date(item.metadata.creationTimestamp));
                const lastCondition = item.status.conditions.slice(-1)[0];

                const status = lastCondition.status == "True" ? "Ready" : "Not Ready";
                const intIp= item.status.addresses.find(addr => addr.type == "InternalIP");
                const extIp = item.status.addresses.find(addr => addr.type == "ExternalIP");

                const roleKey = Object.keys(item.metadata.labels).filter(key => 
                key.startsWith("node-role.kubernetes.io/")).map(key => {
                    return key.replace("node-role.kubernetes.io/", "");
                });
                return {
                    name: item.metadata.name,
                    age: age,
                    timestamp: item.metadata.creationTimestamp,
                    roles: roleKey ? roleKey.join(",") : "",
                    status: status,
                    version: item.status?.nodeInfo?.kubeletVersion,
                    internalIp: intIp ? intIp.address : "<none>",
                    externalIp: extIp ? extIp.address : "<none>",
                    kernelVersion: item.status?.nodeInfo?.kernelVersion,
                    osImage: item.status?.nodeInfo?.osImage,
                    containerRuntime: item.status?.nodeInfo?.containerRuntimeVersion
                }
            });
            
            nodeTableData.value = [...tData];
            nodeData.value = configDetails;
        }else{
            nodeTableData.value = [];
            nodeData.value = null;
        }
    }
});

onMounted(() => {
    getNodeDetails();
});

</script>
<style scoped>


</style>