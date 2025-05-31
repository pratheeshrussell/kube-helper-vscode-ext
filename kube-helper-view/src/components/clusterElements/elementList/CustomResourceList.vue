<template>
    <Message v-if="errorMessage" severity="error" :closable="true" @close="errorMessage = null">{{ errorMessage }}</Message>
    <div v-if="crdKind" class="p-mb-2">
        <h3>{{ crdKind }} <span v-if="crdScope === 'Namespaced' && namespace">(Namespace: {{ namespace }})</span></h3>
    </div>
    <DataTable :value="crTableData" v-model:filters="filters"
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
            <RefreshData :reloadFunction="getCRList" />
        </div>
    </template>
    <template #empty> No {{ crdKind || 'items' }} found. </template>
    <template #loading> Loading {{ crdKind || 'items' }}. Please wait. </template>

    <Column field="name" header="Name" style="min-width: 20rem" sortable>
        <template #body="{ data }">
            <Button :label="data.name" class="selectable p-button-link" @click="gotoCRDetails(data)" />
        </template>
    </Column>
    <Column v-if="crdScope === 'Namespaced'" field="namespace" header="Namespace" style="min-width: 12rem" sortable>
         <template #body="{ data }">
            <Button v-if="data.namespace" :label="data.namespace" variant="link" @click="gotoNamespaceDetails(data.namespace)" />
            <span v-else>-</span>
        </template>
    </Column>
    <Column field="age" header="Age" style="min-width: 10rem" sortable :sort-key="(d: CRTableItem) => new Date(d.timestamp).getTime()">
        <template #body="{ data }">
            {{ data.age }}
        </template>
    </Column>
    </DataTable>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'; // Removed onMounted
import { FilterMatchMode } from '@primevue/core/api';
import { MessageTypes } from '@common/messageTypes';
import { HelperUtils } from '../../../utils/helpers';
import { globalStore } from '../../../store/store';
import { useRoute, useRouter } from 'vue-router';
import type { CRListType, CRTableItem, K8sCR } from '@src/types/cr.type';
// import type { K8sCRDSpec } from '@src/types/crd.type'; // Removed K8sCRDSpec

import Message from 'primevue/message';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import RefreshData from '../../common/RefreshData.vue';
import TimeAgo from 'javascript-time-ago'; // Ensured TimeAgo is imported

const crTableData = ref<CRTableItem[]>([]);
const loading = ref(true);
const errorMessage = ref<string | null>(null);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

const route = useRoute();
const router = useRouter();

const crdFullName = ref<string | null>(null);
const crdGroup = ref<string | null>(null);
const crdVersion = ref<string | null>(null);
const crdKind = ref<string | null>(null);
const crdScope = ref<'Namespaced' | 'Cluster' | null>(null);
const namespace = ref<string | null>(null);

const getCRList = () => {
    if (!crdFullName.value || !crdKind.value) {
        errorMessage.value = "CRD information is missing to fetch resources.";
        loading.value = false;
        return;
    }
    loading.value = true;
    errorMessage.value = null;
    let resourceToGet = crdFullName.value;
    let command = `kubectl get ${resourceToGet}`;

    if (crdScope.value === 'Namespaced') {
        if (namespace.value) {
            command += ` -n ${namespace.value}`;
        } else {
            command += ` -A`;
        }
    }
    command += ` -o json`;

    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'crList',
        command: HelperUtils.prepareCommand(command)
    });
}

const processRouteParams = () => {
    const fullName = route.params.crdFullName as string;
    const group = route.query.group as string;
    const version = route.query.version as string;
    const kind = route.query.kind as string;
    const scope = route.query.scope as ('Namespaced' | 'Cluster');

    crdFullName.value = fullName;
    crdGroup.value = group;
    crdVersion.value = version;
    crdKind.value = kind;
    crdScope.value = scope;

    if (scope === 'Namespaced') {
        namespace.value = globalStore.namespace;
    } else {
        namespace.value = null;
    }

    if (fullName && kind) {
        getCRList();
        updateBreadcrumbs();
    } else {
        errorMessage.value = "CRD details not fully specified in route.";
    }
};

const updateBreadcrumbs = () => {
    if (!crdFullName.value || !crdKind.value) return;

    const crdListBreadcrumb = { label: 'Custom Resource Definitions', navigateTo: 'crdlist', params: null, index: 0 };
    const crListLinkParams = { crdFullName: crdFullName.value! };
    const crBreadcrumb = {
        label: `${crdKind.value} (for ${crdFullName.value})`,
        navigateTo: 'crlist',
        params: crListLinkParams,
        index: 1
    };

    let breadcrumbs = [crdListBreadcrumb, crBreadcrumb];
    globalStore.breadcrumbItems = breadcrumbs as any;
};

const gotoCRDetails = (crData: CRTableItem) => {
    if (!crdFullName.value || !crdKind.value || !crdGroup.value || !crdVersion.value || !crdScope.value) {
        errorMessage.value = "CRD definition details are missing, cannot navigate.";
        return;
    }

    const params: any = {
        crdFullName: crdFullName.value,
        crName: crData.name,
    };
    if (crdScope.value === 'Namespaced') {
        if (!crData.namespace) {
            errorMessage.value = `Namespace for ${crData.name} is missing. Cannot navigate.`;
            return;
        }
        params.namespace = crData.namespace;
    }

    router.push({
        name: crdScope.value === 'Namespaced' ? 'crdetailns' : 'crdetail',
        params: params,
        query: {
            kind: crdKind.value,
            group: crdGroup.value,
            version: crdVersion.value,
            scope: crdScope.value,
        }
    });
};

const gotoNamespaceDetails = (ns: string) => {
    router.push({ name: 'namespaceoverview', params: { namespace: ns } });
};

watch(() => route.fullPath, () => {
    processRouteParams();
}, { immediate: true });

window.addEventListener('message', (event) => {
    if(event.data.type === MessageTypes.RUN_CMD_RESULT && event.data.subType === 'crList'){
        loading.value = false;
        errorMessage.value = null;
        try {
            const messageData = event.data.data;
            if (messageData?.error) {
                errorMessage.value = `Error fetching ${crdKind.value || 'items'}: ${messageData.errormessage || 'Unknown error'}. ${messageData.output || ''}`.trim();
                crTableData.value = [];
                return;
            }

            const jsonData = messageData.output ? messageData.output : messageData;
             if (typeof jsonData !== 'string') {
                throw new Error("Invalid data format received for CR list.");
            }
            const list = JSON.parse(jsonData) as CRListType;

            if(list?.items){
                const timeAgoInstance = new TimeAgo('en-US'); // Corrected usage of TimeAgo
                crTableData.value = list.items.map((item: K8sCR) => {
                    const timestamp = item.metadata?.creationTimestamp || new Date().toISOString();
                    return {
                        uid: item.metadata.uid,
                        name: item.metadata.name,
                        namespace: item.metadata.namespace,
                        age: timeAgoInstance.format(new Date(timestamp)), // Corrected usage
                        timestamp: timestamp,
                    };
                });
            } else {
                crTableData.value = [];
                 if (!list || !list.items) {
                    errorMessage.value = `No ${crdKind.value || 'items'} found or failed to parse data.`;
                }
            }
        } catch (e: any) {
            errorMessage.value = `Failed to process ${crdKind.value || 'items'} list: ${e.message}`;
            crTableData.value = [];
        }
    }
});
</script>

<style scoped>
.selectable {
    cursor: pointer;
}
</style>
