<template>
    <DataTable :value="crbTableData" v-model:filters="filters"
    paginator :rows="5" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getClusterRoleBindList" />
        </div>
    </template>
    <template #empty> No cluster role bindings found. </template>
    <template #loading> Loading cluster role bindings. Please wait. </template>

    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.name" variant="link" @click="gotoCRBDetails(data)" />
        </template>
    </Column>
    <Column field="role" header="Role" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="`${data.roleref.kind}/${data.roleref.name}`" variant="link" @click="gotoCRDetails(data)" />
        </template>
    </Column>
    <Column field="users" header="Users" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.users }}
        </template>
    </Column>
    <Column field="groups" header="Groups" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.groups }}
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
import { HelperUtils } from '../../../utils/helpers';
import { globalStore } from '../../../store/store';
import { useRouter } from 'vue-router';
import TimeAgo from 'javascript-time-ago';
import type { ClusterRoleBindListType, ClusterRoleBindTableItem, ClusterRoleBindType } from '@src/types/clusterRoleBinding.type';


const crbListData = ref<ClusterRoleBindListType| null>(null);
const crbTableData = ref<ClusterRoleBindTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const isNamespace = ref(false);
const router = useRouter();

const getClusterRoleBindList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'clusterRoleBindingList',
        command: HelperUtils.prepareCommand(kubeCmds
        .getNonNamespacedResourceByType.replace("{{resType}}", 'clusterrolebindings'))
    });
}

const gotoCRBDetails = (data: ClusterRoleBindTableItem) => {
    // this is a root level item
    globalStore.breadcrumbItems = [];
    router.push({name: 'clusterRoleBindoverview', params: {crbname: data.name}});
}

const gotoCRDetails = (data: ClusterRoleBindTableItem) => {
    // this is a root level item
    if(data.roleref.kind.toLowerCase() == 'clusterrole'){
        globalStore.breadcrumbItems = [];
        router.push({name: 'clusterRoleoverview', params: {crname: data.roleref.name}});
    }
    
}


window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "clusterRoleBindingList"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as ClusterRoleBindListType;
        
        if(configDetails?.items && configDetails?.items?.length > 0){
            const timeAgo = new TimeAgo('en-US');
            const tData = configDetails.items.map((item:ClusterRoleBindType) => {
                const timeStamp = item?.metadata?.creationTimestamp || (new Date()).toISOString();
                const age = timeAgo.format(new Date(timeStamp));

                const users = item?.subjects?.filter((sub: any) => sub?.kind == 'User').map((sub: any) => {
                    return `${sub?.name}`;
                }).join(', ') || '';
                const groups = item?.subjects?.filter((sub: any) => sub?.kind == 'Group').map((sub: any) => {
                    return `${sub?.name}`;
                }).join(', ') || '';
                return {          
                    name: item?.metadata?.name || '',
                    users: users,
                    groups: groups,
                    roleref: {
                        name: item?.roleRef?.name || '',
                        kind: item?.roleRef?.kind || ''
                    },
                    age: age,
                    timestamp: timeStamp,
                } as ClusterRoleBindTableItem
            });
            crbTableData.value = [...tData];
            crbListData.value = configDetails;
        }else{
            crbTableData.value = [];
            crbListData.value = null;
        }
    }
});

onMounted(() => {
    getClusterRoleBindList();
    if(globalStore.namespace !== null){
        isNamespace.value = true;
    }
});


</script>
<style scoped>


</style>