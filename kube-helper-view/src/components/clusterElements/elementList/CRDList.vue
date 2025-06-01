<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { MessageTypes } from '@common/messageTypes';
import { kubeCmds } from '../../../constants/commands';
import type { KubeCustomResourceDefinition, KubeCustomResourceDefinitionVersion, KubeCRDList } from '@apptypes/crd.type';
import { globalStore } from '../../../store/store';
import { useRouter } from 'vue-router';

const crds = ref<KubeCustomResourceDefinition[]>([]);
const loading = ref(false);
const filterText = ref('');
const router = useRouter();

const fetchCRDs = () => {
    loading.value = true;
    tsvscode.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'getCRDs',
        command: kubeCmds.getCRDs,
        data: {
            output: 'json', // Request JSON output
        }
    });
};

// Listener for messages from the extension backend
window.addEventListener('message', (event) => {
    if (event.data.subType === 'getCRDs') { // Check subType, as type is RUN_CMD_RESULT
        loading.value = false;
        const response = event.data.data; // This is the { success, stdout, stderr, error? } object

        if (response && response.success) {
            if (response.stderr) {
                console.warn(`Stderr content for getCRDs: ${response.stderr}`);
                // Optionally show a warning:
                // tsvscode.postMessage({ type: MessageTypes.SHOW_WARNING, payload: `Warning (CRDs): ${response.stderr}` });
            }
            try {
                const crdList = JSON.parse(response.stdout) as KubeCRDList;
                crds.value = crdList.items.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
            } catch (e) {
                console.error('Error parsing CRD list:', e, response.stdout);
                tsvscode.postMessage({
                    type: MessageTypes.SHOW_ERROR,
                    payload: `Error parsing CRD list: ${e}`,
                });
                crds.value = [];
            }
        } else { // Handles response.success === false or unexpected structure
            const errorMessage = response?.error || `Unknown error for getCRDs.`;
            const errorDetails = response?.stderr || '';
            console.error(`Error for getCRDs:`, errorMessage, errorDetails);
            tsvscode.postMessage({ type: MessageTypes.SHOW_ERROR, payload: `Error fetching CRDs: ${errorMessage} ${errorDetails}`.trim() });
            crds.value = [];
        }
    }
});

const filteredCRDs = computed(() => {
    if (!filterText.value) {
        return crds.value;
    }
    return crds.value.filter(crd =>
        crd.metadata.name.toLowerCase().includes(filterText.value.toLowerCase())
    );
});

const viewCRs = (crd: KubeCustomResourceDefinition) => {
    // Navigate to a route that will display CRs for this CRD
    // This route will be defined later in Router.ts
    globalStore.breadcrumbItems = [
        { label: 'Cluster Overview', navigateTo: 'clusteroverview', params: null, index: 0 },
        { label: 'CRDs', navigateTo: 'crdlist', params: null, index: 1 }, // Assuming 'crdlist' is the route for this component
        { label: crd.spec.names.kind, navigateTo: 'crlist', params: { crdName: crd.metadata.name }, index: 2 }
    ];
    router.push({ name: 'crlist', params: { crdName: crd.metadata.name } });
};

const viewCRDDetails = (crd: KubeCustomResourceDefinition) => {
    // Navigate to a route that will display CRD details
    // This route will be defined later in Router.ts
    globalStore.breadcrumbItems = [
        { label: 'Cluster Overview', navigateTo: 'clusteroverview', params: null, index: 0 },
        { label: 'CRDs', navigateTo: 'crdlist', params: null, index: 1 },
        { label: crd.metadata.name, navigateTo: 'crddetail', params: { crdName: crd.metadata.name }, index: 2 }
    ];
    router.push({ name: 'crddetail', params: { crdName: crd.metadata.name } });
}

onMounted(() => {
    fetchCRDs();
});
</script>

<template>
    <div class="crd-list-view">
        <div class="p-3">
            <div class="flex justify-content-between align-items-center mb-3">
                <h2 class="m-0">Custom Resource Definitions</h2>
                <div class="flex align-items-center">
                    <InputText v-model="filterText" placeholder="Filter CRDs" class="mr-2" />
                    <Button icon="pi pi-refresh" @click="fetchCRDs" :loading="loading" v-tooltip.left="'Refresh'" />
                </div>
            </div>

            <DataTable :value="filteredCRDs" :loading="loading" responsiveLayout="scroll" paginator :rows="15"
                       :rowsPerPageOptions="[10, 15, 25, 50, 100]" stateStorage="session" stateKey="dt-crdlist-state">
                <template #empty>No Custom Resource Definitions found.</template>
                <template #loading>Loading CRDs...</template>

                <Column field="metadata.name" header="Name" sortable>
                    <template #body="slotProps">
                        <a href="#" @click.prevent="viewCRDDetails(slotProps.data)">{{ slotProps.data.metadata.name }}</a>
                    </template>
                </Column>
                <Column field="spec.names.kind" header="Kind" sortable />
                <Column field="spec.group" header="Group" sortable />
                <Column field="spec.scope" header="Scope" sortable />
                <Column field="spec.versions[0].name" header="Default Version" sortable>
                     <template #body="slotProps">
                        {{ slotProps.data.spec.versions.find((v: KubeCustomResourceDefinitionVersion) => v.storage)?.name || slotProps.data.spec.versions[0]?.name }}
                    </template>
                </Column>
                 <Column header="Actions">
                    <template #body="slotProps">
                        <Button label="View Resources" @click="viewCRs(slotProps.data)" size="small" class="p-button-sm" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<style scoped>
.crd-list-view {
    padding: 1rem;
}
.p-datatable-emptymessage td {
    text-align: center !important;
    padding: 1rem;
}
</style>
