<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { MessageTypes } from '@common/messageTypes';
import { kubeCmds } from '../../constants/commands';
import type { KubeCustomResource } from '@apptypes/cr.type';
// KubeCustomResourceDefinitionVersion removed as it might be causing TS6196 if only used in .find() type hint
import type { KubeCustomResourceDefinition } from '@apptypes/crd.type';
import { globalStore } from '../../store/store';
import DescribeViewer from '../common/DescribeViewer.vue';
import EditResource from '../common/EditResource.vue';
import VueJsonPretty from 'vue-json-pretty'; // For displaying spec/status
import 'vue-json-pretty/lib/styles.css';

const cr = ref<KubeCustomResource | null>(null);
const crd = ref<KubeCustomResourceDefinition | null>(null); // This is to store the definition of the CRD itself
const crdKind = ref<string>(''); // To store the Kind from CRD
// const crDescription = ref(''); // Removed
const loading = ref(false);
// const loadingDescription = ref(false); // Removed
// const showEditModal = ref(false); // Removed
const route = useRoute();

const crdName = computed(() => route.params.crdName as string); // Plural name of CRD
const crName = computed(() => route.params.crName as string);
const crNamespace = computed(() => route.params.crNamespace as string | undefined);

const fetchCRDDetailsForKind = () => {
    // Fetch CRD to get the Kind for display and for describe command
    tsvscode.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'getSingleCRDForCRElement',
        command: kubeCmds.getCRDByName.replace('{{crdName}}', crdName.value),
        data: { resourceName: crdName.value } // Pass crdName to identify response
    });
};

const fetchCRDetails = () => {
    if (!crd.value) { // Check if crd.value (CRD definition) is available
        console.warn("CRD definition not yet fetched, deferring CR details fetch.");
        // Optionally, you could re-trigger fetchCRDDetailsForKind here or show an error
        return;
    }
    loading.value = true;
    // Use plural name from the fetched CRD definition
    let command = `kubectl get ${crd.value.spec.names.plural} ${crName.value}`;
    if (crNamespace.value) {
        command += ` -n ${crNamespace.value}`;
    }
    command += ' -o json';

    tsvscode.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'getSingleCRElement',
        command: command,
        data: { resourceName: crName.value, namespace: crNamespace.value }
    });
};

// fetchCRDescription removed
// const fetchCRDescription = () => {
//     if (!crd.value && !crdKind.value) { // Check if kind or full CRD object is available
//         console.warn("CRD Kind/Definition not yet fetched, deferring CR description fetch.");
//         return;
//     }
//     loadingDescription.value = true; // TS2304 loadingDescription not found
//     // Use the actual kind from CRD for describe command
//     let kindToDescribe = crdKind.value || crd.value!.spec.names.kind;
//     let command = `kubectl describe ${kindToDescribe} ${crName.value}`;
//     if (crNamespace.value) {
//         command += ` -n ${crNamespace.value}`;
//     }
//     tsvscode.postMessage({
//         type: MessageTypes.RUN_CMD_RESULT,
//         subType: 'describeCRElement',
//         command: command,
//         data: { resourceName: crName.value, namespace: crNamespace.value }
//     });
// };

const describeCrCommand = computed(() => {
    if (crdKind.value && crName.value) {
        let cmd = `kubectl describe ${crdKind.value} ${crName.value}`;
        if (crNamespace.value) {
            cmd += ` -n ${crNamespace.value}`;
        }
        return cmd;
    }
    return ''; // Return empty or a placeholder if not ready
});

window.addEventListener('message', (event) => {
    const { subType, data, commandData } = event.data; // data is the new response object
    const response = data;

    if (subType === 'getSingleCRDForCRElement' && commandData?.resourceName === crdName.value) {
        if (response && response.success) {
            if (response.stderr) {
                console.warn(`Stderr content for getSingleCRDForCRElement: ${response.stderr}`);
            }
            try {
                const crdDef = JSON.parse(response.stdout) as KubeCustomResourceDefinition;
                crd.value = crdDef; // Store the fetched CRD definition
                crdKind.value = crdDef.spec.names.kind;
                fetchCRDetails();
                // fetchCRDescription(); // Removed
                updateBreadcrumb();
            } catch (e) {
                console.error('Error parsing CRD for Kind:', e, response.stdout);
                tsvscode.postMessage({ type: MessageTypes.SHOW_ERROR, payload: `Error parsing CRD for Kind: ${e}` });
                crd.value = null;
                crdKind.value = '';
            }
        } else {
            const errorMessage = response?.error || `Unknown error for getSingleCRDForCRElement.`;
            const errorDetails = response?.stderr || '';
            console.error(`Error for getSingleCRDForCRElement:`, errorMessage, errorDetails);
            tsvscode.postMessage({ type: MessageTypes.SHOW_ERROR, payload: `Error fetching CRD for kind: ${errorMessage} ${errorDetails}`.trim() });
            crd.value = null;
            crdKind.value = '';
        }
        return; // Processed this message
    }

    // Ensure message is for this specific CR for other subtypes
    // Using commandData for resourceName and namespace checks
    if (commandData?.resourceName !== crName.value) return;
    if (commandData?.namespace !== crNamespace.value && (commandData?.namespace !== undefined || crNamespace.value !== undefined)) return;


    if (subType === 'getSingleCRElement') {
        loading.value = false;
        if (response && response.success) {
            if (response.stderr) {
                console.warn(`Stderr content for getSingleCRElement: ${response.stderr}`);
            }
            try {
                const parsedData = JSON.parse(response.stdout) as KubeCustomResource;
                cr.value = parsedData;
                if (cr.value && !cr.value.apiVersion && crd.value) {
                     cr.value.apiVersion = `${crd.value.spec.group}/${crd.value.spec.versions.find(v => v.storage)?.name || crd.value.spec.versions[0].name}`;
                }
                if (cr.value && !cr.value.kind && crdKind.value) {
                    cr.value.kind = crdKind.value;
                }
                updateBreadcrumb();
            } catch (e) {
                console.error('Error parsing CR details:', e, response.stdout);
                tsvscode.postMessage({ type: MessageTypes.SHOW_ERROR, payload: `Error parsing CR details: ${e}` });
                cr.value = null;
            }
        } else {
            const errorMessage = response?.error || `Unknown error for getSingleCRElement.`;
            const errorDetails = response?.stderr || '';
            console.error(`Error for getSingleCRElement:`, errorMessage, errorDetails);
            tsvscode.postMessage({ type: MessageTypes.SHOW_ERROR, payload: `Error fetching CR details: ${errorMessage} ${errorDetails}`.trim() });
            cr.value = null;
        }
    }
    // Removed describeCRElement handler
    // else if (subType === 'describeCRElement') {
    //     loadingDescription.value = false;
    //     if (response && response.success) {
    //         if (response.stderr) {
    //             console.warn(`Stderr content for describeCRElement: ${response.stderr}`);
    //         }
    //         crDescription.value = response.stdout;
    //     } else {
    //         const errorMessage = response?.error || `Unknown error for describeCRElement.`;
    //         const errorDetails = response?.stderr || (response.success === false ? response.stdout : '');
    //         console.error(`Error for describeCRElement:`, errorMessage, errorDetails);
    //         tsvscode.postMessage({ type: MessageTypes.SHOW_ERROR, payload: `Error fetching CR description: ${errorMessage} ${errorDetails}`.trim() });
    //         crDescription.value = errorDetails || errorMessage;
    //     }
    // }
});

// const openEditModal = () => { // Removed
//     showEditModal.value = true;
// };

const handleEditSuccess = () => {
    fetchCRDetails();
    // fetchCRDescription(); // Removed
};

const updateBreadcrumb = () => {
    if (cr.value && crdKind.value) {
        const crListEntryIndex = globalStore.breadcrumbItems.findIndex(item => item.navigateTo === 'crlist' && item.params?.crdName === crdName.value);
        let baseBreadcrumb = [];

        if (crListEntryIndex === -1) { // Fallback if direct navigation
            const crdsEntryIndex = globalStore.breadcrumbItems.findIndex(item => item.label === 'CRDs' && item.navigateTo === 'crdlist');
            let crdsBase = [];
            if (crdsEntryIndex === -1) {
                 crdsBase = [
                    { label: 'Cluster Overview', navigateTo: 'clusteroverview', params: null, index: 0 },
                    { label: 'CRDs', navigateTo: 'crdlist', params: null, index: 1 }
                ];
            } else {
                crdsBase = globalStore.breadcrumbItems.slice(0, crdsEntryIndex + 1);
            }
            baseBreadcrumb = [
                ...crdsBase,
                { label: crdKind.value || crdName.value, navigateTo: 'crlist', params: { crdName: crdName.value }, index: crdsBase.length }
            ];
        } else {
            baseBreadcrumb = globalStore.breadcrumbItems.slice(0, crListEntryIndex + 1);
        }
        globalStore.breadcrumbItems = [
            ...baseBreadcrumb,
            {
                label: cr.value.metadata.name,
                navigateTo: 'crdetail',
                params: {
                    crdName: crdName.value,
                    crName: cr.value.metadata.name,
                    ...(cr.value.metadata.namespace && { crNamespace: cr.value.metadata.namespace })
                },
                index: baseBreadcrumb.length
            }
        ];
    }
};

onMounted(() => {
    fetchCRDDetailsForKind(); // Start by fetching CRD to get Kind
    // fetchCRDetails will be called after CRD details are back
    // fetchCRDescription(); // Removed
});

watch(() => [route.params.crdName, route.params.crName, route.params.crNamespace], (newVal, oldVal) => {
    if (newVal.join(',') !== oldVal.join(',')) {
        cr.value = null;
        crdKind.value = '';
        // crDescription.value = ''; // Removed
        fetchCRDDetailsForKind();
    }
});

const crApiVersion = computed(() => cr.value?.apiVersion || (crd.value ? `${crd.value.spec.group}/${crd.value.spec.versions.find(v=>v.storage)?.name || crd.value.spec.versions[0].name}` : ''));
const crActualKind = computed(() => cr.value?.kind || crdKind.value);

</script>

<template>
    <div class="cr-element-view p-3">
        <div v-if="loading && !cr" class="text-center">
            <ProgressSpinner />
            <p>Loading resource {{ crName }} ({{ crdKind || crdName }})...</p>
        </div>
        <div v-else-if="cr">
            <div class="flex justify-content-between align-items-center mb-3">
                <h2 class="m-0">{{ crActualKind }}: {{ cr.metadata.name }}</h2>
                <div>
                    <EditResource v-if="crApiVersion && crActualKind" :editCommand="`kubectl edit ${crActualKind} ${crName}${crNamespace ? ' -n ' + crNamespace : ''}`" @command-run="handleEditSuccess" :buttonText="`Edit ${crActualKind}`" class="mr-2"/>
                    <Button icon="pi pi-refresh" @click="fetchCRDetails" :loading="loading" v-tooltip.left="'Refresh'" />
                </div>
            </div>

            <TabView>
                <TabPanel header="Details" value="details">
                    <Panel header="Metadata" class="mb-3">
                        <div class="grid">
                            <div class="col-12 md:col-6"><strong>Name:</strong> {{ cr.metadata.name }}</div>
                            <div v-if="cr.metadata.namespace" class="col-12 md:col-6"><strong>Namespace:</strong> {{ cr.metadata.namespace }}</div>
                            <div class="col-12 md:col-6"><strong>UID:</strong> {{ cr.metadata.uid }}</div>
                            <div class="col-12 md:col-6"><strong>Created:</strong> {{ new Date(cr.metadata.creationTimestamp || '').toLocaleString() }}</div>
                            <div class="col-12 md:col-6"><strong>Resource Version:</strong> {{ cr.metadata.resourceVersion }}</div>
                            <div v-if="cr.metadata.generation" class="col-12 md:col-6"><strong>Generation:</strong> {{ cr.metadata.generation }}</div>
                        </div>
                         <template v-if="cr.metadata.labels && Object.keys(cr.metadata.labels).length > 0">
                            <h5 class="mt-3">Labels</h5>
                            <DataTable :value="Object.entries(cr.metadata.labels).map(([key, value]) => ({ key, value }))" size="small">
                                <Column field="key" header="Key" />
                                <Column field="value" header="Value" />
                            </DataTable>
                        </template>
                        <template v-if="cr.metadata.annotations && Object.keys(cr.metadata.annotations).length > 0">
                            <h5 class="mt-3">Annotations</h5>
                            <DataTable :value="Object.entries(cr.metadata.annotations).map(([key, value]) => ({ key, value }))" size="small">
                                <Column field="key" header="Key" />
                                <Column field="value" header="Value" />
                            </DataTable>
                        </template>
                    </Panel>

                    <Panel v-if="cr.spec" header="Spec" class="mb-3" :toggleable="true">
                        <vue-json-pretty :data="cr.spec" :deep="3" showLength />
                    </Panel>

                    <Panel v-if="cr.status" header="Status" class="mb-3" :toggleable="true">
                        <vue-json-pretty :data="cr.status" :deep="3" showLength />
                    </Panel>
                </TabPanel>
                <TabPanel header="Describe" value="describe">
                    <DescribeViewer v-if="describeCrCommand" :describeCommand="describeCrCommand" />
                    <p v-else>Determining describe command...</p>
                </TabPanel>
                 <TabPanel header="YAML" value="yaml">
                    <pre v-if="cr" class="yaml-view">{{ JSON.stringify(cr, null, 2) }}</pre>
                </TabPanel>
            </TabView>
        </div>
        <div v-else-if="!loading && !crdKind">
             <Message severity="warn">Fetching CRD information to correctly display {{ crName }}...</Message>
        </div>
        <div v-else-if="!loading">
            <Message severity="error">Could not load details for {{ crdName }} {{ crName }}.</Message>
        </div>
        <!-- Dialog and internal EditResource removed -->
    </div>
</template>

<style scoped>
.cr-element-view {
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
:deep(.p-panel .p-panel-content) {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}
</style>
