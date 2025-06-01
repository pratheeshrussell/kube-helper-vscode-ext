<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MessageTypes } from '@common/messageTypes';
import { kubeCmds } from '../../../constants/commands';
import type { KubeCustomResource, KubeCRList } from '@apptypes/cr.type';
import type { KubeCustomResourceDefinition } from '@apptypes/crd.type';
import { globalStore } from '../../../store/store';
import type { Item as KubeNamespace } from '@apptypes/namespace.type';

const crs = ref<KubeCustomResource[]>([]);
const crd = ref<KubeCustomResourceDefinition | null>(null);
const loading = ref(false);
const filterText = ref('');
const route = useRoute();
const router = useRouter();
const selectedNamespace = ref<string | null>(globalStore.namespace || 'all');
const namespaces = ref<KubeNamespace[]>([]); // To store list of namespaces for dropdown

const crdName = computed(() => route.params.crdName as string);

const fetchCRDDetails = () => {
    // Fetch the CRD details to know its scope and kind
    tsvscode.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'getSingleCRD',
        command: kubeCmds.getCRDByName.replace('{{crdName}}', crdName.value),
    });
};

const fetchNamespaces = () => {
    tsvscode.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'getNamespacesForCRList',
        command: kubeCmds.getNamespaces // No -o json needed if getNamespaces already includes it
    });
};

const fetchCRs = () => {
    if (!crd.value) return;
    loading.value = true;
    let command = `kubectl get ${crd.value.spec.names.plural}`;
    if (crd.value.spec.scope === 'Namespaced') {
        if (selectedNamespace.value && selectedNamespace.value !== 'all') {
            command += ` -n ${selectedNamespace.value}`;
        } else {
            command += ` -A`; // Get from all namespaces
        }
    }
    command += ' -o json';

    tsvscode.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'getCRs',
        command: command,
        data: { crdName: crdName.value } // Pass crdName to identify response
    });
};

window.addEventListener('message', (event) => {
    const { subType, data } = event.data; // Removed commandData from destructuring as event.data.commandData is used directly
    const response = data; // data is the new response object

    if (subType === 'getSingleCRD') {
        if (response && response.success) {
            if (response.stderr) {
                console.warn(`Stderr content for getSingleCRD: ${response.stderr}`);
            }
            try {
                const parsedData = JSON.parse(response.stdout) as KubeCustomResourceDefinition;
                crd.value = parsedData;
                if (crd.value?.spec?.scope === 'Namespaced') {
                    fetchNamespaces(); // Fetch namespaces if CRD is namespaced
                }
                fetchCRs(); // Now fetch CRs
                updateBreadcrumb();
            } catch (e) {
                console.error('Error parsing single CRD:', e, response.stdout);
                tsvscode.postMessage({ type: MessageTypes.SHOW_ERROR, payload: `Error parsing CRD details: ${e}` });
            }
        } else {
            const errorMessage = response?.error || `Unknown error for getSingleCRD.`;
            const errorDetails = response?.stderr || '';
            console.error(`Error for getSingleCRD:`, errorMessage, errorDetails);
            tsvscode.postMessage({ type: MessageTypes.SHOW_ERROR, payload: `Error fetching CRD info: ${errorMessage} ${errorDetails}`.trim() });
        }
    } else if (subType === 'getNamespacesForCRList') {
        if (response && response.success) {
            if (response.stderr) {
                console.warn(`Stderr content for getNamespacesForCRList: ${response.stderr}`);
            }
            try {
                const parsedData = JSON.parse(response.stdout);
                namespaces.value = (parsedData.items as KubeNamespace[]).sort((a,b) => a.metadata.name.localeCompare(b.metadata.name));
            } catch (e) {
                console.error('Error parsing namespaces:', e, response.stdout);
                tsvscode.postMessage({ type: MessageTypes.SHOW_ERROR, payload: `Error parsing namespaces: ${e}` });
                namespaces.value = [];
            }
        } else {
            const errorMessage = response?.error || `Unknown error for getNamespacesForCRList.`;
            const errorDetails = response?.stderr || '';
            console.error(`Error for getNamespacesForCRList:`, errorMessage, errorDetails);
            tsvscode.postMessage({ type: MessageTypes.SHOW_ERROR, payload: `Error fetching namespaces: ${errorMessage} ${errorDetails}`.trim() });
            namespaces.value = [];
        }
    } else if (subType === 'getCRs' && event.data.commandData?.crdName === crdName.value) { // commandData from original postMessage
        loading.value = false;
        if (response && response.success) {
            if (response.stderr) {
                console.warn(`Stderr content for getCRs (${crdName.value}): ${response.stderr}`);
            }
            try {
                const parsedData = JSON.parse(response.stdout) as KubeCRList;
                crs.value = (parsedData.items as KubeCustomResource[]).sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
            } catch (e) {
                console.error('Error parsing CR list:', e, response.stdout);
                tsvscode.postMessage({ type: MessageTypes.SHOW_ERROR, payload: `Error parsing resource list: ${e}` });
                crs.value = [];
            }
        } else {
            const errorMessage = response?.error || `Unknown error for getCRs (${crdName.value}).`;
            const errorDetails = response?.stderr || '';
            console.error(`Error fetching CRs for ${crdName.value}:`, errorMessage, errorDetails);
            tsvscode.postMessage({ type: MessageTypes.SHOW_ERROR, payload: `Error fetching resources for ${crdName.value}: ${errorMessage} ${errorDetails}`.trim() });
            crs.value = [];
        }
    }
    // Note: The generic error handler for subType === 'error' is removed as errors are now part of the response object.
});

const filteredCRs = computed(() => {
    if (!filterText.value) {
        return crs.value;
    }
    return crs.value.filter(cr =>
        cr.metadata.name.toLowerCase().includes(filterText.value.toLowerCase())
    );
});

const viewCRDetails = (cr: KubeCustomResource) => {
    if (!crd.value) return;
    // const crKind = crd.value.spec.names.kind; // Removed unused variable
    // New logic: find the index of 'crlist' and build new array from there
    const crListEntryIndex = globalStore.breadcrumbItems.findIndex(item => item.navigateTo === 'crlist' && item.params?.crdName === crdName.value);
    let newBreadcrumbs = [];
    if (crListEntryIndex !== -1) {
        newBreadcrumbs = globalStore.breadcrumbItems.slice(0, crListEntryIndex + 1);
    } else { // Fallback if 'crlist' isn't found (e.g. direct navigation)
         const crdsEntryIndex = globalStore.breadcrumbItems.findIndex(item => item.label === 'CRDs' && item.navigateTo === 'crdlist');
         if (crdsEntryIndex !== -1) {
            newBreadcrumbs = globalStore.breadcrumbItems.slice(0, crdsEntryIndex + 1);
         } else {
            newBreadcrumbs.push({ label: 'Cluster Overview', navigateTo: 'clusteroverview', params: null, index: 0 });
            newBreadcrumbs.push({ label: 'CRDs', navigateTo: 'crdlist', params: null, index: 1 });
         }
         // Add the current CRD kind if CRList entry wasn't found
         if (crd.value) {
            newBreadcrumbs.push({ label: crd.value.spec.names.kind, navigateTo: 'crlist', params: { crdName: crdName.value }, index: newBreadcrumbs.length });
         }
    }
    newBreadcrumbs.push({
        label: cr.metadata.name,
        navigateTo: 'crdetail',
        params: {
            crdName: crdName.value,
            crName: cr.metadata.name,
            ...(cr.metadata.namespace && { crNamespace: cr.metadata.namespace })
        },
        index: newBreadcrumbs.length
    });
    globalStore.breadcrumbItems = newBreadcrumbs;
    router.push({
        name: 'crdetail',
        params: { // For router, undefined is fine for optional params
            crdName: crdName.value,
            crName: cr.metadata.name,
            crNamespace: cr.metadata.namespace // Let vue-router handle undefined if cr.metadata.namespace is undefined
        }
    });
};

const getNestedValue = (obj: any, path: string) => {
    if (!path) return '';
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const additionalColumns = computed(() => {
    if (!crd.value) return [];
    // Find the stored version or fallback to the first version for printer columns
    const version = crd.value.spec.versions.find(v => v.storage) || crd.value.spec.versions[0];
    return version?.additionalPrinterColumns || [];
});

const updateBreadcrumb = () => {
    if (crd.value) {
         // Check if 'CRDs' is already in breadcrumb
        const crdsEntryIndex = globalStore.breadcrumbItems.findIndex(item => item.label === 'CRDs' && item.navigateTo === 'crdlist');

        let baseBreadcrumb = [];
        if (crdsEntryIndex === -1) {
            baseBreadcrumb = [
                { label: 'Cluster Overview', navigateTo: 'clusteroverview', params: null, index: 0 },
                { label: 'CRDs', navigateTo: 'crdlist', params: null, index: 1 }
            ];
        } else {
            baseBreadcrumb = globalStore.breadcrumbItems.slice(0, crdsEntryIndex + 1);
        }
        globalStore.breadcrumbItems = [
            ...baseBreadcrumb,
            { label: crd.value.spec.names.kind, navigateTo: 'crlist', params: { crdName: crdName.value }, index: baseBreadcrumb.length }
        ];
    }
};


onMounted(() => {
    fetchCRDDetails(); // Fetch CRD details first to know scope etc.
    // fetchCRs will be called after CRD details are fetched
});

// Watch for changes in selectedNamespace and re-fetch CRs
watch(selectedNamespace, () => {
    if (crd.value?.spec.scope === 'Namespaced') {
        fetchCRs();
    }
});

// Watch for route changes if user navigates between different CRD lists
watch(() => route.params.crdName, (newCrdName, oldCrdName) => {
    if (newCrdName && newCrdName !== oldCrdName) {
        crs.value = []; // Clear old data
        crd.value = null; // Reset CRD details
        fetchCRDDetails();
    }
});

</script>

<template>
    <div class="cr-list-view p-3">
        <div v-if="crd">
            <div class="flex justify-content-between align-items-center mb-3">
                <h2 class="m-0">{{ crd.spec.names.kind }} Resources</h2>
                <div class="flex align-items-center">
                    <Dropdown v-if="crd.spec.scope === 'Namespaced'"
                              v-model="selectedNamespace"
                              :options="[{ metadata: { name: 'all' } }, ...namespaces]"
                              optionLabel="metadata.name"
                              optionValue="metadata.name"
                              placeholder="Select Namespace"
                              class="mr-2"
                              style="min-width: 150px;" />
                    <InputText v-model="filterText" placeholder="Filter by name" class="mr-2" />
                    <Button icon="pi pi-refresh" @click="fetchCRs" :loading="loading" v-tooltip.left="'Refresh'" />
                </div>
            </div>

            <DataTable :value="filteredCRs" :loading="loading" responsiveLayout="scroll" paginator :rows="15"
                       :rowsPerPageOptions="[10, 15, 25, 50, 100]" stateStorage="session" :stateKey="`dt-crlist-${crdName}-state`">
                <template #empty>No resources found for {{ crd.spec.names.kind }}.</template>
                <template #loading>Loading resources...</template>

                <Column field="metadata.name" header="Name" sortable>
                    <template #body="slotProps">
                        <a href="#" @click.prevent="viewCRDetails(slotProps.data)">{{ slotProps.data.metadata.name }}</a>
                    </template>
                </Column>
                <Column v-if="crd.spec.scope === 'Namespaced'" field="metadata.namespace" header="Namespace" sortable />

                <!-- Additional Printer Columns -->
                <Column v-for="col in additionalColumns" :key="col.name" :header="col.name"
                        :field="col.jsonPath" :sortable="true">
                    <template #body="slotProps">
                        {{ getNestedValue(slotProps.data, col.jsonPath.substring(1)) }}
                    </template>
                </Column>

                <Column field="metadata.creationTimestamp" header="Age" sortable>
                    <template #body="slotProps">
                        {{ new Date(slotProps.data.metadata.creationTimestamp).toLocaleString() }}
                        <!-- Or use a timeago library -->
                    </template>
                </Column>
            </DataTable>
        </div>
        <div v-else-if="loading">
            <p>Loading CRD details...</p>
        </div>
        <div v-else>
            <p>Could not load details for CRD: {{ crdName }}.</p>
        </div>
    </div>
</template>

<style scoped>
.cr-list-view {
    padding: 1rem;
}
.p-datatable-emptymessage td {
    text-align: center !important;
    padding: 1rem;
}
</style>
