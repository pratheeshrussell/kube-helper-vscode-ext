<template>
    <DataTable :value="namespaceTableData" v-model:filters="filters"
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
    <template #empty> No namespace found. </template>
    <template #loading> Loading namespaces. Please wait. </template>

    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.name" variant="link" @click="gotoNamespaceDetails(data.name)" />
        </template>
    </Column>
    <Column field="status" header="Status" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.status }}
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
import type { NamespaceTableItem, NamespaceType } from '../../../types/namespace.type';
import { FilterMatchMode } from '@primevue/core/api';
import { kubeCmds } from '../../../constants/commands';
import { MessageTypes } from '@common/messageTypes';
import TimeAgo from 'javascript-time-ago';
import { HelperUtils } from '../../../utils/helpers';
import { useRouter } from 'vue-router';

const namespaceData = ref<NamespaceType| null>(null);
const namespaceTableData = ref<NamespaceTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const router = useRouter();

const getNamespacesDetails = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'namespaceDetails',
        command: HelperUtils.prepareCommand(kubeCmds.getNamespaces)
    });
}

const gotoNamespaceDetails = (name: string) => {
    router.push({name: 'namespaceoverview', params: {namespace: name}});
}

window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "namespaceDetails"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as NamespaceType;
        
        if(configDetails?.items?.length > 0){
            const timeAgo = new TimeAgo('en-US');
            const tData = configDetails.items.map(item => {
                const age = timeAgo.format(new Date(item.metadata.creationTimestamp));

                return {
                    name: item.metadata.name,
                    status: item.status.phase,
                    age: age,
                    timestamp: item.metadata.creationTimestamp
                }
            });
            
            namespaceTableData.value = [...tData];
            namespaceData.value = configDetails;
        }else{
            namespaceTableData.value = [];
            namespaceData.value = null;
        }
    }
});

onMounted(() => {
    getNamespacesDetails();
});

</script>
<style scoped>


</style>