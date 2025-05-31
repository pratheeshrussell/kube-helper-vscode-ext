<template>
    <Message v-if="errorMessage" severity="error" :closable="true" @close="errorMessage = null">{{ errorMessage }}</Message>
    <DataTable :value="configMapTableData" v-model:filters="filters"
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

            <RefreshData :reloadFunction="getConfigMapList" />
        </div>
    </template>
    <template #empty> No ConfigMaps found. </template>
    <template #loading> Loading ConfigMaps. Please wait. </template>

    <Column v-if="!isNamespaceSelected" field="namespace" header="Namespace" style="min-width: 12rem" sortable>
        <template #body="{ data }">
            <Button :label="data.namespace" variant="link" @click="gotoNamespaceDetails(data.namespace)" />
        </template>
    </Column>
    <Column field="name" header="Name" style="min-width: 12rem" sortable>
        <template #body="{ data }">
            <Button :label="data.name" class="selectable" variant="link" @click="gotoConfigMapDetails(data)" />
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
    <!-- Add Actions Column if needed later, similar to PodList -->
    </DataTable>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { FilterMatchMode } from '@primevue/core/api'; // Corrected import
import { kubeCmds } from '../../../constants/commands';
import { MessageTypes } from '@common/messageTypes';
import TimeAgo from 'javascript-time-ago';
import { HelperUtils } from '../../../utils/helpers';
import { globalStore } from '../../../store/store';
import { useRouter } from 'vue-router';
import type { ConfigMapListType, ConfigMapTableItem, K8sConfigMap } from '@src/types/configMap.type';
import Message from 'primevue/message';
import RefreshData from '../../common/RefreshData.vue';

// PrimeVue component imports if not globally registered
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';


const configMapTableData = ref<ConfigMapTableItem[]>([]);
const loading = ref(true);
const errorMessage = ref<string | null>(null);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }, // Used FilterMatchMode correctly
});
const isNamespaceSelected = computed(() => globalStore.namespace !== null && globalStore.namespace !== '');
const router = useRouter();

const getConfigMapList = () => {
    loading.value = true;
    errorMessage.value = null;
    let command = kubeCmds.getNamespacedResourceByType.replace("{{resType}}", 'configmaps');
    if (!isNamespaceSelected.value) {
        // For cluster-wide, namespace in command template should be replaced with '-A' or an equivalent that prepareCommand understands
        // Assuming prepareCommand can handle namespace: null or "" by translating to -A or context only for non-namespaced calls
        // For getNamespacedResourceByType, it expects a namespace or -A.
        // Let's ensure the command is formed correctly for -A
        command = `kubectl get configmaps -A -o json`; // More direct for -A to avoid prepareCommand complexity with namespace field for this specific case
    }
    // If isNamespaceSelected is true, HelperUtils.prepareCommand will use globalStore.namespace

    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'configMapList',
        command: isNamespaceSelected.value ? HelperUtils.prepareCommand(command) : command
    });
}

const gotoNamespaceDetails = (namespaceName: string) => {
    router.push({name: 'namespaceoverview', params: {namespace: namespaceName}});
}

const gotoConfigMapDetails = (data: ConfigMapTableItem) => {
    const targetNamespace = data.namespace || globalStore.namespace;
    if (!targetNamespace) {
        errorMessage.value = "Namespace is missing for this ConfigMap.";
        console.error("Namespace missing for ConfigMap:", data.name);
        return;
    }

    const params: any = { cmname: data.name };
    if (targetNamespace) {
        params.namespace = targetNamespace;
    }

    // Handle breadcrumbs
    let breadcrumbNavTarget = 'configmaplist'; // Default for cluster-wide
    if (globalStore.namespace && globalStore.namespace !== '') { // If coming from a namespaced list
        breadcrumbNavTarget = 'configmaplistns';
    }

    globalStore.breadcrumbItems = [
        ...(globalStore.namespace && globalStore.namespace !== '' ?
            [{label: globalStore.namespace, params:{namespace: globalStore.namespace}, navigateTo: 'namespaceoverview', index: 0}]
            : []),
        {label: 'ConfigMaps', params: (globalStore.namespace ? {namespace: globalStore.namespace} : {}), navigateTo: breadcrumbNavTarget, index: (globalStore.namespace ? 1:0)},
    ];


    router.push({
        name: 'configmapoverview',
        params: params
    });
}

window.addEventListener('message', (event) => {
    if(event.data.type === MessageTypes.RUN_CMD_RESULT && event.data.subType === 'configMapList'){ // Check subType
        loading.value = false;
        errorMessage.value = null;
        try {
            const messageData = event.data.data;
            if (messageData?.error) {
                console.error("Error fetching ConfigMap list:", messageData.errormessage, messageData.output);
                errorMessage.value = `Error fetching ConfigMaps: ${messageData.errormessage || 'Unknown error'}. ${messageData.output || ''}`.trim();
                configMapTableData.value = [];
                return;
            }

            // Ensure messageData.output exists, as RUN_CMD_RESULT wraps the actual string in 'output'
            const jsonData = messageData.output ? messageData.output : messageData;
            if (typeof jsonData !== 'string') {
                throw new Error("Invalid data format received for ConfigMap list.");
            }
            const list = JSON.parse(jsonData) as ConfigMapListType;

            if(list?.items){
                const timeAgo = new TimeAgo('en-US');
                configMapTableData.value = list.items.map((item: K8sConfigMap) => { // Changed to K8sConfigMap
                    const timestamp = item.metadata?.creationTimestamp || new Date().toISOString();
                    return {
                        uid: item.metadata.uid,
                        namespace: item.metadata.namespace || 'default',
                        name: item.metadata.name || '-',
                        age: timeAgo.format(new Date(timestamp)),
                        timestamp: timestamp,
                        dataCount: (item.data ? Object.keys(item.data).length : 0) + (item.binaryData ? Object.keys(item.binaryData).length : 0),
                    };
                });
            } else {
                configMapTableData.value = [];
                if (!list || !list.items) {
                    errorMessage.value = "Failed to parse ConfigMap list data or no items found.";
                }
            }
        } catch (e: any) {
            console.error("Error processing configMapList message:", e);
            errorMessage.value = `Failed to process ConfigMap list: ${e.message}`;
            configMapTableData.value = [];
        }
    }
});

onMounted(() => {
    getConfigMapList();
    // Breadcrumb setup
    if (!isNamespaceSelected.value) {
        globalStore.breadcrumbItems = [{label: 'ConfigMaps', navigateTo: 'configmaplist', index: 0}];
    } else {
         globalStore.breadcrumbItems = [
            {label: globalStore.namespace, params:{namespace: globalStore.namespace}, navigateTo: 'namespaceoverview', index: 0},
            {label: 'ConfigMaps', params:{namespace: globalStore.namespace}, navigateTo: 'configmaplistns', index: 1}
        ];
    }
});
</script>
<style scoped>
.selectable {
    cursor: pointer;
}
/* PrimeVue components usually don't need explicit style for basic functionality */


</style>