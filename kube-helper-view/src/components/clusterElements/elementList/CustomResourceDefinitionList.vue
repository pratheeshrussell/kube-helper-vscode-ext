<template>
    <Message v-if="errorMessage" severity="error" :closable="true" @close="errorMessage = null">{{ errorMessage }}</Message>
    <DataTable :value="crdTableData" v-model:filters="filters"
    paginator :rows="10" dataKey="uid" filterDisplay="row" :loading="loading"
    sortField="name" :sortOrder="1"
    >
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>
            <RefreshData :reloadFunction="getCRDList" />
        </div>
    </template>
    <template #empty> No Custom Resource Definitions found. </template>
    <template #loading> Loading Custom Resource Definitions. Please wait. </template>

    <Column field="name" header="Name" style="min-width: 20rem" sortable>
        <template #body="{ data }">
            <Button :label="data.name" class="selectable" variant="link" @click="gotoCRList(data)" />
        </template>
    </Column>
    <Column field="group" header="Group" style="min-width: 15rem" sortable />
    <Column field="version" header="Version" style="min-width: 8rem" sortable />
    <Column field="scope" header="Scope" style="min-width: 8rem" sortable />
    <Column field="kind" header="Kind" style="min-width: 12rem" sortable />

    </DataTable>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
// import { kubeCmds } from '../../../constants/commands'; // Removed as per build error fix
import { MessageTypes } from '@common/messageTypes';
import { HelperUtils } from '../../../utils/helpers';
import { globalStore } from '../../../store/store';
import { useRouter } from 'vue-router';
import type { CRDListType, CRDTableItem, K8sCRD, K8sCRDVersion } from '@src/types/crd.type'; // Added K8sCRDVersion

import Message from 'primevue/message';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import RefreshData from '../../common/RefreshData.vue';

const crdTableData = ref<CRDTableItem[]>([]);
const loading = ref(true);
const errorMessage = ref<string | null>(null);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});
const router = useRouter();

const getCRDList = () => {
    loading.value = true;
    errorMessage.value = null;
    const command = `kubectl get crds -o json`;

    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'crdList',
        command: HelperUtils.prepareCommand(command) // Removed 'false' argument
    });
}

const gotoCRList = (crdData: CRDTableItem) => {
    router.push({
        name: 'crlist',
        params: {
            crdFullName: crdData.name,
        },
        query: {
            group: crdData.group,
            version: crdData.version,
            kind: crdData.kind,
            scope: crdData.scope,
        }
    });
}

window.addEventListener('message', (event) => {
    if(event.data.type === MessageTypes.RUN_CMD_RESULT && event.data.subType === 'crdList'){
        loading.value = false;
        errorMessage.value = null;
        try {
            const messageData = event.data.data;
            if (messageData?.error) {
                console.error("Error fetching CRD list:", messageData.errormessage, messageData.output);
                errorMessage.value = `Error fetching CRDs: ${messageData.errormessage || 'Unknown error'}. ${messageData.output || ''}`.trim();
                crdTableData.value = [];
                return;
            }

            const jsonData = messageData.output ? messageData.output : messageData;
            if (typeof jsonData !== 'string') {
                throw new Error("Invalid data format received for CRD list.");
            }
            const list = JSON.parse(jsonData) as CRDListType;

            if(list?.items){
                crdTableData.value = list.items.map((item: K8sCRD) => {
                    const storedVersion = item.spec.versions.find((v: K8sCRDVersion) => v.storage)?.name || item.spec.versions[0]?.name || 'unknown';
                    return {
                        uid: item.metadata.uid,
                        name: item.metadata.name,
                        group: item.spec.group,
                        version: storedVersion,
                        scope: item.spec.scope,
                        kind: item.spec.names.kind,
                    };
                });
            } else {
                crdTableData.value = [];
                if (!list || !list.items) {
                    errorMessage.value = "Failed to parse CRD list data or no items found.";
                }
            }
        } catch (e: any) {
            console.error("Error processing crdList message:", e);
            errorMessage.value = `Failed to process CRD list: ${e.message}`;
            crdTableData.value = [];
        }
    }
});

onMounted(() => {
    getCRDList();
    globalStore.namespace = null;
    globalStore.breadcrumbItems = [{label: 'Custom Resource Definitions', navigateTo: 'crdlist', params: null, index: 0}];
});
</script>

<style scoped>
.selectable {
    cursor: pointer;
}
</style>
