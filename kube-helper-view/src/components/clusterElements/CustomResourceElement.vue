<template>
    <div class="cr-element-view" v-if="!isCrValid">
        <div>Unable to load Custom Resource details. Required information is missing.</div>
        <div v-if="DEBUG_MODE">
            <p>crdFullName: {{ crdFullNameRef }}</p>
            <p>crName: {{ crNameRef }}</p>
            <p>namespace: {{ namespaceRef }}</p>
            <p>crdKind: {{ crdKindRef }}</p>
        </div>
    </div>
    <div class="cr-element-view" v-if="isCrValid">
        <div class="d-flex flex-row-reverse p-2 options-bar">
            <EditResource :editCommand="editCommand" :buttonText="`Edit ${crdKindRef}`" />
            <DeleteResource :deleteCommand="deleteCommand" @deleted="handleCrDelete" :buttonText="`Delete ${crdKindRef}`" />
        </div>
        <Tabs v-model:value="activeTab" scrollable>
            <TabList>
                <Tab value="yaml">YAML</Tab>
                <Tab value="events">Events</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="yaml">
                    <DescribeViewer :describeCommand="yamlCommand" v-if="yamlCommand" />
                    <div v-else>Loading YAML...</div>
                </TabPanel>
                <TabPanel value="events">
                    <EventList :event-command="eventCommand" v-if="eventCommand" />
                    <div v-else>Loading events...</div>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute, useRouter } from 'vue-router';
import { kubeCmds } from '@src/constants/commands';
import { HelperUtils } from '@src/utils/helpers';

import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';

import DescribeViewer from '../common/DescribeViewer.vue'; // For YAML view
import EventList from '../common/EventList.vue';
import EditResource from '../common/EditResource.vue';
import DeleteResource from '../common/DeleteResource.vue';

const DEBUG_MODE = import.meta.env.DEV; // Or some other way to toggle debug info

const route = useRoute();
const router = useRouter();

const crdFullNameRef = ref<string | null>(null); // e.g., certificates.cert-manager.io
const crNameRef = ref<string | null>(null);      // Name of the CR instance
const namespaceRef = ref<string | null>(null);  // Namespace of the CR (if namespaced)
const crdKindRef = ref<string | null>(null);    // e.g., Certificate
const crdGroupRef = ref<string | null>(null);   // e.g., cert-manager.io
const crdVersionRef = ref<string | null>(null); // e.g., v1
const crdScopeRef = ref<'Namespaced' | 'Cluster' | null>(null);

const activeTab = ref('yaml');

const isCrValid = computed(() =>
    !!(crdFullNameRef.value && crNameRef.value && crdKindRef.value && crdGroupRef.value && crdVersionRef.value && crdScopeRef.value && (crdScopeRef.value === 'Cluster' || namespaceRef.value))
);

const yamlCommand = ref<string>('');
const eventCommand = ref<string>('');
const editCommand = ref<string>('');
const deleteCommand = ref<string>('');

const setupCommands = () => {
    if (!isCrValid.value) return;

    const crdFullName = crdFullNameRef.value!;
    const crName = crNameRef.value!;
    const ns = namespaceRef.value; // Will be null for Cluster scope
    const kind = crdKindRef.value!;
    const group = crdGroupRef.value!;
    const version = crdVersionRef.value!;
    const scope = crdScopeRef.value!;

    let baseGetCmd = `kubectl get ${crdFullName} ${crName}`;
    let baseEditCmd = `kubectl edit ${crdFullName} ${crName}`;
    let baseDeleteCmd = `kubectl delete ${crdFullName} ${crName}`;

    if (scope === 'Namespaced' && ns) {
        baseGetCmd += ` -n ${ns}`;
        baseEditCmd += ` -n ${ns}`;
        baseDeleteCmd += ` -n ${ns}`;
    }

    yamlCommand.value = HelperUtils.prepareCommand(`${baseGetCmd} -o yaml`, scope === 'Namespaced' && !!ns);

    // Event command: kubectl get events --field-selector involvedObject.kind=MyKind,involvedObject.name=my-cr,involvedObject.namespace=my-ns,involvedObject.apiVersion=mygroup.io/v1alpha1
    // involvedObject.apiVersion might not be needed if kind+name+ns is unique enough.
    // For simplicity, let's try with kind, name, and apiVersion (group/version). Namespace is implicitly handled by prepareCommand if ns is set.
    const apiVersionForEvent = `${group}/${version}`;
    let eventSelector = `involvedObject.kind=${kind},involvedObject.name=${crName},involvedObject.apiVersion=${apiVersionForEvent}`;
    if (scope === 'Namespaced' && ns) {
         // prepareCommand will add -n <ns> to the base event command
    }

    eventCommand.value = HelperUtils.prepareCommand(
        // kubeCmds.getEventsPerResource uses {{resType}} for kind and {{resName}} for name.
        // It also has {{namespace}} placeholder.
        // We need to be careful here. Let's use a more direct command construction for events for CRs.
        `kubectl get events --field-selector ${eventSelector}` + ( (scope === 'Namespaced' && ns) ? ` -n ${ns}` : ``),
        scope === 'Namespaced' && !!ns // only inject default namespace if we are in a namespaced context
    );

    editCommand.value = HelperUtils.prepareCommand(baseEditCmd, scope === 'Namespaced' && !!ns);
    deleteCommand.value = HelperUtils.prepareCommand(baseDeleteCmd, scope === 'Namespaced' && !!ns);
};

const updateBreadcrumbs = () => {
    if (!isCrValid.value) return;

    const crdListCrumb = { label: 'Custom Resource Definitions', navigateTo: 'crdlist', index: 0 };
    const crListCrumb = {
        label: `${crdKindRef.value!} (for ${crdFullNameRef.value!})`,
        navigateTo: 'crlist',
        params: { crdFullName: crdFullNameRef.value! },
        query: {
            group: crdGroupRef.value!,
            version: crdVersionRef.value!,
            kind: crdKindRef.value!,
            scope: crdScopeRef.value!
        }
    };
    const crDetailCrumb = {
        label: crNameRef.value!,
        navigateTo: route.name, // current route
        params: { ...route.params },
        query: { ...route.query }
    };

    let breadcrumbs = [crdListCrumb];
    // If viewing namespaced CRs under a specific namespace context (from globalStore.namespace)
    // This logic assumes that if globalStore.namespace is set, the CR List was also viewed in that context
    if (crdScopeRef.value === 'Namespaced' && namespaceRef.value && globalStore.namespace === namespaceRef.value) {
        // This case is complex: CRD list is cluster wide. CR list is for a specific CRD.
        // If the CR itself is namespaced, and we are in a namespace context.
        // Path could be: Home -> Namespace -> CRDs (this link doesn't exist yet) -> CR List -> CR
        // OR Home -> CRDs -> CR List (filtered to namespace) -> CR
        // For now, keep it simple: Home -> CRDs -> CR List for X -> CR Y
        // If namespaceRef.value is set, it means the CR is namespaced.
        // The crListCrumb already has the full CRD name.
    }

    breadcrumbs.push({ ...crListCrumb, index: breadcrumbs.length });
    breadcrumbs.push({ ...crDetailCrumb, index: breadcrumbs.length });

    globalStore.breadcrumbItems = breadcrumbs;
};

const processRouteData = () => {
    crdFullNameRef.value = route.params.crdFullName as string;
    crNameRef.value = route.params.crName as string;
    // Namespace comes from route for namespaced CRs, or is null for cluster CRs
    namespaceRef.value = route.params.namespace ? route.params.namespace as string : null;

    crdKindRef.value = route.query.kind as string;
    crdGroupRef.value = route.query.group as string;
    crdVersionRef.value = route.query.version as string;
    crdScopeRef.value = route.query.scope as ('Namespaced' | 'Cluster');

    if (crdScopeRef.value === 'Namespaced' && namespaceRef.value) {
        if (globalStore.namespace !== namespaceRef.value) {
            // This can happen if user navigates directly via URL or from a cluster-wide CR list to a namespaced CR.
            // We should set the global namespace to the CR's namespace for consistency in this view.
            globalStore.namespace = namespaceRef.value;
        }
    } else if (crdScopeRef.value === 'Cluster') {
        // If it's a cluster-scoped CR, ensure global namespace is cleared for this view
        // globalStore.namespace = null; // This might be too aggressive if user wants to return to a namespace.
                                     // For now, let individual list views manage globalStore.namespace upon entry.
    }


    if (isCrValid.value) {
        setupCommands();
        updateBreadcrumbs();
    } else {
        console.error("Custom Resource details are invalid/incomplete.", {
            crdFullName: crdFullNameRef.value,
            crName: crNameRef.value,
            namespace: namespaceRef.value,
            kind: crdKindRef.value,
            scope: crdScopeRef.value,
        });
    }

    const tabQuery = route.query.tab as string;
    if (tabQuery && (tabQuery === 'yaml' || tabQuery === 'events')) {
        activeTab.value = tabQuery;
    }
};

watch(() => route.fullPath, () => {
    processRouteData();
}, { immediate: true });


const handleCrDelete = () => {
    // Navigate back to the list of CRs for this CRD
    router.push({
        name: 'crlist',
        params: { crdFullName: crdFullNameRef.value! },
        query: {
            group: crdGroupRef.value!,
            version: crdVersionRef.value!,
            kind: crdKindRef.value!,
            scope: crdScopeRef.value!
        }
    });
};
</script>

<style scoped>
.options-bar {
   background-color: var(--p-surface-card);
   padding: 0.5rem;
   border-bottom: 1px solid var(--p-divider-color);
}
</style>
