<template>
    <DataTable :value="roleTableData" v-model:filters="filters"
    paginator :rows="5" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getRoleList" />
        </div>
    </template>
    <template #empty> No roles found. </template>
    <template #loading> Loading roles. Please wait. </template>

    <Column v-if="!isNamespace" field="namespace" header="Namespace" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.namespace" variant="link" @click="gotoNamespaceDetails(data.namespace)" />
        </template>
    </Column>
    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.name" variant="link" @click="gotoRoleDetails(data)" />
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
import type { RoleListType, RoleTableItem, RoleType } from '@src/types/role.type';

const roleListData = ref<RoleListType| null>(null);
const roleTableData = ref<RoleTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const isNamespace = ref(false);
const router = useRouter();

const getRoleList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'roleList',
        command: HelperUtils.prepareCommand(kubeCmds
        .getNamespacedResourceByType.replace("{{resType}}", 'roles'))
    });
}

const gotoRoleDetails = (data: RoleTableItem) => {
    if(globalStore.namespace === null){
        globalStore.namespace = data.namespace;
        globalStore.breadcrumbItems = [
            {label: data.namespace, params:{namespace: data.namespace}
                , navigateTo: 'namespaceoverview', index: 0}
        ];
    }
    router.push({name: 'roleoverview', params: {rolename: data.name}});
}

const gotoNamespaceDetails = (name: string) => {
    router.push({name: 'namespaceoverview', params: {namespace: name}});
}


window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "roleList"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as RoleListType;
        
        if(configDetails?.items && configDetails?.items?.length > 0){
            const tData = configDetails.items.map((item:RoleType) => {
                const timeStamp = item?.metadata?.creationTimestamp || (new Date()).toISOString();
                
                return {          
                    name: item?.metadata?.name || '',
                    namespace: item?.metadata?.namespace || 'default',
                    createdAt: timeStamp,
                } as RoleTableItem
            });
            roleTableData.value = [...tData];
            roleListData.value = configDetails;
        }else{
            roleTableData.value = [];
            roleListData.value = null;
        }
    }
});

onMounted(() => {
    getRoleList();
    if(globalStore.namespace !== null){
        isNamespace.value = true;
    }
});


</script>
<style scoped>


</style>