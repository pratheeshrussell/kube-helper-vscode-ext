<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router'; // Removed useRouter
import { MessageTypes } from '@common/messageTypes';
import { kubeCmds } from '../../constants/commands';
import type { KubeCustomResourceDefinition } from '@apptypes/crd.type';
import { globalStore } from '../../store/store';
import DescribeViewer from '../common/DescribeViewer.vue';
import EditResource from '../common/EditResource.vue'; // Assuming EditResource can handle generic resources

const crd = ref<KubeCustomResourceDefinition | null>(null);
// const crdDescription = ref(''); // Removed
const loading = ref(false);
// const loadingDescription = ref(false); // Removed
// const showEditModal = ref(false); // Removed
const route = useRoute();
// const router = useRouter(); // Removed

const crdName = computed(() => route.params.crdName as string);

const fetchCRDDetails = () => {
    loading.value = true;
    tsvscode.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'getSingleCRDElement', // Unique subType for this component
        command: kubeCmds.getCRDByName.replace('{{crdName}}', crdName.value),
        data: { resourceName: crdName.value }
    });
};

// const fetchCRDDescription = () => { // Removed
//     loadingDescription.value = true;
//     tsvscode.postMessage({
//         type: MessageTypes.RUN_CMD_RESULT,
//         subType: 'describeCRDElement', // Unique subType
//         command: kubeCmds.describeCRDByName.replace('{{crdName}}', crdName.value),
//         data: { resourceName: crdName.value }
//     });
// };

window.addEventListener('message', (event) => {
    // Assuming commandData was used in postMessage to pass resourceName
    const { subType, data, commandData } = event.data;
    const response = data; // data is the new response object { success, stdout, stderr, error? }

    // Ensure message is for this specific CRD, using commandData if that's how resourceName was passed
    if (commandData?.resourceName !== crdName.value) return;

    if (subType === 'getSingleCRDElement') {
        loading.value = false;
        if (response && response.success) {
            if (response.stderr) {
                console.warn(`Stderr content for getSingleCRDElement: ${response.stderr}`);
            }
            try {
                const parsedData = JSON.parse(response.stdout) as KubeCustomResourceDefinition;
                crd.value = parsedData;
                updateBreadcrumb();
            } catch (e) {
                console.error('Error parsing CRD details:', e, response.stdout);
                tsvscode.postMessage({ type: MessageTypes.SHOW_ERROR, payload: `Error parsing CRD details: ${e}` });
                crd.value = null;
            }
        } else {
            const errorMessage = response?.error || `Unknown error for getSingleCRDElement.`;
            const errorDetails = response?.stderr || '';
            console.error(`Error for getSingleCRDElement:`, errorMessage, errorDetails);
            tsvscode.postMessage({ type: MessageTypes.SHOW_ERROR, payload: `Error fetching CRD details: ${errorMessage} ${errorDetails}`.trim() });
            crd.value = null;
        }
    }
    // Removed describeCRDElement handler, logic now in DescribeViewer.vue
    // else if (subType === 'describeCRDElement') {
    //     loadingDescription.value = false;
    //     if (response && response.success) {
    //         if (response.stderr) {
    //             console.warn(`Stderr content for describeCRDElement: ${response.stderr}`);
    //         }
    //         crdDescription.value = response.stdout;
    //     } else {
    //         const errorMessage = response?.error || `Unknown error for describeCRDElement.`;
    //         const errorDetails = response?.stderr || (response.success === false ? response.stdout : '');
    //         console.error(`Error for describeCRDElement:`, errorMessage, errorDetails);
    //         tsvscode.postMessage({ type: MessageTypes.SHOW_ERROR, payload: `Error fetching CRD description: ${errorMessage} ${errorDetails}`.trim() });
    //         crdDescription.value = errorDetails || errorMessage;
    //     }
    // }
});

const storedVersions = computed(() => {
    return crd.value?.status?.storedVersions?.join(', ') || 'N/A';
});

const acceptedNames = computed(() => {
    if (!crd.value?.status?.acceptedNames) return [];
    return Object.entries(crd.value.status.acceptedNames).map(([key, value]) => ({
        key: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize key
        value: Array.isArray(value) ? value.join(', ') : value
    }));
});

const conditions = computed(() => {
    return crd.value?.status?.conditions || [];
});

const versions = computed(() => {
    return crd.value?.spec?.versions || [];
});


// const openEditModal = () => { // Removed
//     showEditModal.value = true;
// };

const handleEditSuccess = () => {
    fetchCRDDetails(); // Re-fetch details after edit
    // fetchCRDDescription(); // Removed
};

const updateBreadcrumb = () => {
    if (crd.value) {
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
            { label: crd.value.metadata.name, navigateTo: 'crddetail', params: { crdName: crd.value.metadata.name }, index: baseBreadcrumb.length }
        ];
    }
};


onMounted(() => {
    fetchCRDDetails();
    // fetchCRDDescription(); // Removed
});

watch(() => route.params.crdName, (newVal, oldVal) => {
    if (newVal && newVal !== oldVal) {
        crd.value = null;
        // crdDescription.value = ''; // Removed
        fetchCRDDetails();
        // fetchCRDDescription(); // Removed
    }
});

</script>

<template>
    <div class="crd-element-view p-3">
        <div v-if="loading && !crd" class="text-center">
            <ProgressSpinner />
            <p>Loading CRD details for {{ crdName }}...</p>
        </div>
        <div v-else-if="crd">
            <div class="flex justify-content-between align-items-center mb-3">
                <h2 class="m-0">CRD: {{ crd.metadata.name }}</h2>
                <div>
                    <EditResource :editCommand="`kubectl edit crd ${crdName}`" @command-run="handleEditSuccess" buttonText="Edit CRD" class="mr-2"/>
                    <Button icon="pi pi-refresh" @click="fetchCRDDetails" :loading="loading" v-tooltip.left="'Refresh'" />
                </div>
            </div>

            <TabView>
                <TabPanel header="Details" value="details">
                    <Panel header="General" class="mb-3">
                        <div class="grid">
                            <div class="col-12 md:col-6"><strong>Kind:</strong> {{ crd.spec.names.kind }}</div>
                            <div class="col-12 md:col-6"><strong>Group:</strong> {{ crd.spec.group }}</div>
                            <div class="col-12 md:col-6"><strong>Scope:</strong> {{ crd.spec.scope }}</div>
                            <div class="col-12 md:col-6"><strong>Stored Versions:</strong> {{ storedVersions }}</div>
                            <div class="col-12 md:col-6"><strong>UID:</strong> {{ crd.metadata.uid }}</div>
                            <div class="col-12 md:col-6"><strong>Created:</strong> {{ new Date(crd.metadata.creationTimestamp || '').toLocaleString() }}</div>
                        </div>
                    </Panel>

                    <Panel header="Accepted Names" class="mb-3" :toggleable="true">
                        <DataTable :value="acceptedNames" size="small">
                            <Column field="key" header="Name Type" />
                            <Column field="value" header="Value" />
                        </DataTable>
                    </Panel>

                    <Panel header="Versions" class="mb-3" :toggleable="true">
                        <DataTable :value="versions" size="small">
                            <Column field="name" header="Version" />
                            <Column field="served" header="Served">
                                <template #body="slotProps">{{ slotProps.data.served ? 'Yes' : 'No' }}</template>
                            </Column>
                            <Column field="storage" header="Storage">
                                <template #body="slotProps">{{ slotProps.data.storage ? 'Yes' : 'No' }}</template>
                            </Column>
                            <Column field="deprecated" header="Deprecated">
                                 <template #body="slotProps">{{ slotProps.data.deprecated ? 'Yes' : 'No' }}</template>
                            </Column>
                            <Column field="deprecationWarning" header="Deprecation Warning" />
                        </DataTable>
                    </Panel>

                    <Panel header="Conditions" :toggleable="true">
                         <DataTable :value="conditions" size="small">
                            <Column field="type" header="Type" />
                            <Column field="status" header="Status" />
                            <Column field="reason" header="Reason" />
                            <Column field="message" header="Message" />
                            <Column field="lastTransitionTime" header="Last Transition">
                                <template #body="slotProps">{{ new Date(slotProps.data.lastTransitionTime || '').toLocaleString() }}</template>
                            </Column>
                        </DataTable>
                    </Panel>
                </TabPanel>
                <TabPanel header="Describe" value="describe">
                    <DescribeViewer :describeCommand="kubeCmds.describeCRDByName.replace('{{crdName}}', crdName)" />
                </TabPanel>
                 <TabPanel header="YAML" value="yaml">
                    <pre v-if="crd" class="yaml-view">{{ JSON.stringify(crd, null, 2) }}</pre>
                </TabPanel>
            </TabView>
        </div>
        <div v-else-if="!loading">
            <Message severity="error">Could not load details for CRD: {{ crdName }}.</Message>
        </div>
        <!-- Dialog and internal EditResource removed -->
    </div>
</template>

<style scoped>
.crd-element-view {
    padding: 1rem;
}
.yaml-view {
    background-color: var(--surface-b);
    color: var(--text-color);
    padding: 1rem;
    border-radius: 4px;
    max-height: 600px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
}
</style>
