<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MessageTypes } from '@common/messageTypes';
import { kubeCmds } from '../../constants/commands';
import type { KubeCustomResourceDefinition } from '@apptypes/crd.type';
import { globalStore } from '../../store/store';
import DescribeViewer from '../common/DescribeViewer.vue';
import EditResource from '../common/EditResource.vue'; // Assuming EditResource can handle generic resources

const crd = ref<KubeCustomResourceDefinition | null>(null);
const crdDescription = ref('');
const loading = ref(false);
const loadingDescription = ref(false);
const showEditModal = ref(false);
const route = useRoute();
const router = useRouter();

const crdName = computed(() => route.params.crdName as string);

const fetchCRDDetails = () => {
    loading.value = true;
    tsvscode.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'getSingleCRDElement', // Unique subType for this component
        command: `${kubeCmds.getResource('crd', crdName.value)} -o json`,
        data: { resourceName: crdName.value }
    });
};

const fetchCRDDescription = () => {
    loadingDescription.value = true;
    tsvscode.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'describeCRDElement', // Unique subType
        command: `kubectl describe crd ${crdName.value}`,
        data: { resourceName: crdName.value }
    });
};

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
    } else if (subType === 'describeCRDElement') {
        loadingDescription.value = false;
        if (response && response.success) {
            if (response.stderr) {
                console.warn(`Stderr content for describeCRDElement: ${response.stderr}`);
                 // Potentially show stderr as a warning or append to description if it's relevant for 'describe'
            }
            crdDescription.value = response.stdout; // describe output is plain text
        } else {
            const errorMessage = response?.error || `Unknown error for describeCRDElement.`;
            const errorDetails = response?.stderr || (response.success === false ? response.stdout : ''); // Sometimes describe errors are in stdout
            console.error(`Error for describeCRDElement:`, errorMessage, errorDetails);
            tsvscode.postMessage({ type: MessageTypes.SHOW_ERROR, payload: `Error fetching CRD description: ${errorMessage} ${errorDetails}`.trim() });
            crdDescription.value = errorDetails || errorMessage; // Show error in description area
        }
    }
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


const openEditModal = () => {
    showEditModal.value = true;
};

const handleEditSuccess = () => {
    fetchCRDDetails(); // Re-fetch details after edit
    fetchCRDDescription();
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

        globalStore.setBreadcrumb([
            ...baseBreadcrumb,
            { label: crd.value.metadata.name, navigateTo: 'crddetail', params: { crdName: crd.value.metadata.name }, index: baseBreadcrumb.length }
        ]);
    }
};


onMounted(() => {
    fetchCRDDetails();
    fetchCRDDescription();
});

watch(() => route.params.crdName, (newVal, oldVal) => {
    if (newVal && newVal !== oldVal) {
        crd.value = null;
        crdDescription.value = '';
        fetchCRDDetails();
        fetchCRDDescription();
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
                    <Button icon="pi pi-pencil" label="Edit" @click="openEditModal" class="p-button-info mr-2" />
                    <Button icon="pi pi-refresh" @click="() => { fetchCRDDetails(); fetchCRDDescription(); }" :loading="loading || loadingDescription" v-tooltip.left="'Refresh'" />
                </div>
            </div>

            <TabView>
                <TabPanel header="Details">
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
                <TabPanel header="Describe">
                    <DescribeViewer :description="crdDescription" :loading="loadingDescription" />
                </TabPanel>
                 <TabPanel header="YAML">
                    <EditResource
                        :visible="showEditModal"
                        resourceType="CustomResourceDefinition"
                        :resourceName="crdName"
                        :namespace="crd.spec.scope === 'Namespaced' ? crd.metadata.namespace : undefined"
                        kind="CustomResourceDefinition"
                        :resourceApiVersion="crd.apiVersion"
                        @close="showEditModal = false"
                        @success="handleEditSuccess"
                    />
                     <!-- Display read-only YAML if not editing -->
                    <pre v-if="crd && !showEditModal" class="yaml-view">{{ JSON.stringify(crd, null, 2) }}</pre>
                </TabPanel>
            </TabView>
        </div>
        <div v-else-if="!loading">
            <Message severity="error">Could not load details for CRD: {{ crdName }}.</Message>
        </div>

        <!-- Edit Modal will be part of the EditResource component itself if it's modal -->
        <!-- Or use a Dialog component here if EditResource is not modal -->
         <Dialog v-model:visible="showEditModal" modal header="Edit CRD" :style="{ width: '75vw' }">
            <EditResource
                :isModal="false"
                resourceType="CustomResourceDefinition"
                :resourceName="crdName"
                :namespace="crd?.spec?.scope === 'Namespaced' ? crd?.metadata.namespace : undefined"
                kind="CustomResourceDefinition"
                :resourceApiVersion="crd?.apiVersion || 'apiextensions.k8s.io/v1'"
                @close="showEditModal = false"
                @success="handleEditSuccess"
            />
        </Dialog>
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
