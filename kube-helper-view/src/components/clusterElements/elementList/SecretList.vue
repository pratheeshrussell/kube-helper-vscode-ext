<template>
    <Message v-if="errorMessage" severity="error" :closable="true" @close="errorMessage = null">{{ errorMessage }}</Message>
    <DataTable :value="secretTableData" v-model:filters="filters"
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
            <RefreshData :reloadFunction="getSecretList" />
        </div>
    </template>
    <template #empty> No Secrets found. </template>
    <template #loading> Loading Secrets. Please wait. </template>

    <Column v-if="!isNamespaceSelected" field="namespace" header="Namespace" style="min-width: 12rem" sortable>
        <template #body="{ data }">
            <Button :label="data.namespace" variant="link" @click="gotoNamespaceDetails(data.namespace)" />
        </template>
    </Column>
    <Column field="name" header="Name" style="min-width: 12rem" sortable>
        <template #body="{ data }">
            <Button :label="data.name" class="selectable" variant="link" @click="gotoSecretDetails(data)" />
        </template>
    </Column>
    <Column field="type" header="Type" style="min-width: 12rem" sortable>
        <template #body="{ data }">
            {{ data.type }}
        </template>
    </Column>
    <Column field="dataCount" header="Data Entries" style="min-width: 8rem" sortable>
        <template #body="{ data }">
            {{ data.dataCount }}
        </template>
    </Column>
    <Column field="age" header="Age" style="min-width: 10rem" sortable :sort-key="(d) => new Date(d.timestamp).getTime()">
        <template #body="{ data }">
            {{ data.age }}
        </template>
    </Column>
    </DataTable>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { kubeCmds } from '../../../constants/commands';
import { MessageTypes } from '@common/messageTypes';
import TimeAgo from 'javascript-time-ago';
import { HelperUtils } from '../../../utils/helpers';
import { globalStore } from '../../../store/store';
import { useRouter } from 'vue-router';
import type { SecretListType, SecretTableItem, SecretType as K8sSecret } from '@src/types/secret.type'; // Use K8sSecret alias for clarity
import Message from 'primevue/message';
import RefreshData from '../../common/RefreshData.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

const secretTableData = ref<SecretTableItem[]>([]);
const loading = ref(true);
const errorMessage = ref<string | null>(null);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});
const router = useRouter();

const isNamespaceSelected = computed(() => globalStore.namespace !== null && globalStore.namespace !== '');

const getSecretList = () => {
    loading.value = true;
    errorMessage.value = null;
    let command = kubeCmds.getNamespacedResourceByType.replace("{{resType}}", 'secrets'); // Corrected resType to 'secrets'
    if (!isNamespaceSelected.value) {
        command = `kubectl get secrets -A -o json`;
    }

    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'secretList',
        command: isNamespaceSelected.value ? HelperUtils.prepareCommand(command) : command
    });
}

const gotoNamespaceDetails = (namespaceName: string) => {
    router.push({name: 'namespaceoverview', params: {namespace: namespaceName}});
}

const gotoSecretDetails = (data: SecretTableItem) => {
    const targetNamespace = data.namespace || globalStore.namespace;
    if (!targetNamespace) {
        errorMessage.value = "Namespace is missing for this Secret.";
        console.error("Namespace missing for Secret:", data.name);
        return;
    }

    const params: any = { secretname: data.name, namespace: targetNamespace };

    let breadcrumbNavTarget = 'secretlist';
    if (globalStore.namespace && globalStore.namespace !== '') {
        breadcrumbNavTarget = 'secretlistns';
    }

    globalStore.breadcrumbItems = [
        ...(globalStore.namespace && globalStore.namespace !== '' ?
            [{label: globalStore.namespace, params:{namespace: globalStore.namespace}, navigateTo: 'namespaceoverview', index: 0}]
            : []),
        {label: 'Secrets', params: (globalStore.namespace ? {namespace: globalStore.namespace} : {}), navigateTo: breadcrumbNavTarget, index: (globalStore.namespace ? 1:0)},
    ];

    router.push({ name: 'secretoverview', params: params });
}

window.addEventListener('message', (event) => {
    if(event.data.type === MessageTypes.RUN_CMD_RESULT && event.data.subType === 'secretList'){
        loading.value = false;
        errorMessage.value = null;
        try {
            const messageData = event.data.data;
            if (messageData?.error) {
                console.error("Error fetching Secret list:", messageData.errormessage, messageData.output);
                errorMessage.value = `Error fetching Secrets: ${messageData.errormessage || 'Unknown error'}. ${messageData.output || ''}`.trim();
                secretTableData.value = [];
                return;
            }

            const jsonData = messageData.output ? messageData.output : messageData;
            if (typeof jsonData !== 'string') {
                throw new Error("Invalid data format received for Secret list.");
            }
            const list = JSON.parse(jsonData) as SecretListType;

            if(list?.items){
                const timeAgo = new TimeAgo('en-US');
                secretTableData.value = list.items.map((item: K8sSecret) => {
                    const timestamp = item.metadata?.creationTimestamp || new Date().toISOString();
                    return {
                        uid: item.metadata?.uid || `${item.metadata?.namespace}-${item.metadata?.name}`, // Fallback for uid
                        namespace: item.metadata?.namespace || 'default',
                        name: item.metadata?.name || '-',
                        type: item.type || 'Opaque',
                        age: timeAgo.format(new Date(timestamp)),
                        timestamp: timestamp,
                        dataCount: item.data ? Object.keys(item.data).length : 0,
                    };
                });
            } else {
                secretTableData.value = [];
                if (!list || !list.items) {
                    errorMessage.value = "Failed to parse Secret list data or no items found.";
                }
            }
        } catch (e: any) {
            console.error("Error processing secretList message:", e);
            errorMessage.value = `Failed to process Secret list: ${e.message}`;
            secretTableData.value = [];
        }
    }
});

onMounted(() => {
    getSecretList();
    if (!isNamespaceSelected.value) {
        globalStore.breadcrumbItems = [{label: 'Secrets', navigateTo: 'secretlist', index: 0}];
    } else {
         globalStore.breadcrumbItems = [
            {label: globalStore.namespace, params:{namespace: globalStore.namespace}, navigateTo: 'namespaceoverview', index: 0},
            {label: 'Secrets', params:{namespace: globalStore.namespace}, navigateTo: 'secretlistns', index: 1}
        ];
    }
});
</script>

<style scoped>
.selectable {
    cursor: pointer;
}
</style>