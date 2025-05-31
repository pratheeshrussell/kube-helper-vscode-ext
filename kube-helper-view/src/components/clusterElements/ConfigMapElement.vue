<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute, useRouter } from 'vue-router';
import { kubeCmds } from '@src/constants/commands';
import { HelperUtils } from '@src/utils/helpers';

// PrimeVue components
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';

// Common components
import DescribeViewer from '../common/DescribeViewer.vue'; // Reusing for YAML
import EventList from '../common/EventList.vue';
import EditResource from '../common/EditResource.vue';
import DeleteResource from '../common/DeleteResource.vue';

const route = useRoute();
const router = useRouter();

const configMapName = ref<string | null>(null);
const currentNamespace = ref<string | null>(null); // Renamed for clarity
const activeTab = ref('yaml'); // Default to YAML tab

const isConfigMapNameValid = computed(() => !!(configMapName.value && currentNamespace.value));

const yamlCommand = ref<string>('');
const eventCommand = ref<string>('');
const editCommand = ref<string>('');
const deleteCommand = ref<string>('');

const setupCommands = (cmName: string, ns: string) => {
    // Command for getting YAML: kubectl get configmap <configmap-name> -n <namespace> -o yaml
    // Assuming kubeCmds.getNamespacedResourceByNameOutput is something like: "kubectl get {{resType}} {{resName}} {{namespace}} {{context}} -o yaml"
    // Or if it doesn't include namespace and context, HelperUtils.prepareCommand should add it.
    // For clarity, let's use a more direct approach if prepareCommand doesn't perfectly fit -o yaml.
    // However, the existing `DescribeViewer` expects a command that `HelperUtils.prepareCommand` can process.
    // Let's assume `getNamespacedResourceByNameOutput` is "kubectl get {{resType}} {{resName}} {{namespace}} -o yaml"
    // and `prepareCommand` will add context if needed.

    let baseYamlCmd = kubeCmds.getNamespacedResourceByNameOutput || `kubectl get {{resType}} {{resName}} -n {{namespace}} -o yaml`;

    yamlCommand.value = HelperUtils.prepareCommand(
        baseYamlCmd
            .replace("{{resType}}", 'configmap')
            .replace("{{resName}}", cmName)
            .replace("{{namespace}}", ns)
    );
    eventCommand.value = HelperUtils.prepareCommand(
        kubeCmds.getEventsPerResource
            .replace('{{resName}}', cmName)
            .replace('{{resType}}', 'ConfigMap')
            .replace('{{namespace}}', ns)
    );
    editCommand.value = HelperUtils.prepareCommand(
        kubeCmds.editNamespacedResource
            .replace("{{resType}}", 'configmap')
            .replace("{{resName}}", cmName)
            .replace("{{namespace}}", ns)
    );
    deleteCommand.value = HelperUtils.prepareCommand(
        kubeCmds.deleteNamespacedResource
            .replace("{{resType}}", 'configmap')
            .replace("{{resName}}", cmName)
            .replace("{{namespace}}", ns)
    );
};

const updateBreadcrumbs = (cmName: string, ns: string) => {
    const listBreadcrumbBase = { label: 'ConfigMaps', index: 0 };
    let routeNameForList = 'configmaplist'; // Cluster-wide
    let paramsForList: { namespace?: string } = {};

    if (ns) {
        routeNameForList = 'configmaplistns';
        paramsForList.namespace = ns;
    }

    const breadcrumbs = [];
    if (ns) {
        breadcrumbs.push({ label: ns, navigateTo: 'namespaceoverview', params: { namespace: ns }, index: 0 });
        breadcrumbs.push({ ...listBreadcrumbBase, navigateTo: routeNameForList, params: paramsForList, index: 1 });
    } else {
        breadcrumbs.push({ ...listBreadcrumbBase, navigateTo: routeNameForList, index: 0 });
    }

    breadcrumbs.push({
        label: cmName,
        navigateTo: 'configmapoverview',
        params: { cmname: cmName, namespace: ns },
        index: breadcrumbs.length
    });

    globalStore.breadcrumbItems = breadcrumbs;
};


onMounted(() => {
    const nameFromRoute = route.params.cmname as string;
    // Namespace can come from route, or if deep-linked, it might be in globalStore from a previous state (less ideal but fallback)
    const namespaceFromRoute = route.params.namespace as string || globalStore.namespace;

    if (nameFromRoute && namespaceFromRoute) {
        configMapName.value = nameFromRoute;
        currentNamespace.value = namespaceFromRoute;
        
        // Crucially update globalStore.namespace if it's different or coming from route
        if (globalStore.namespace !== namespaceFromRoute) {
            globalStore.namespace = namespaceFromRoute;
        }

        setupCommands(nameFromRoute, namespaceFromRoute);
        updateBreadcrumbs(nameFromRoute, namespaceFromRoute);

    } else {
        console.error("ConfigMap name or namespace is missing from route params.");
    }

    const tabQuery = route.query.tab as string;
    if (tabQuery && (tabQuery === 'yaml' || tabQuery === 'events')) {
        activeTab.value = tabQuery;
    }
});

watch(() => route.fullPath, () => {
    // This watcher handles cases where the user navigates between different ConfigMapElement views
    // or if query params change (e.g. for tabs, though already handled in onMounted)
    const nameFromRoute = route.params.cmname as string;
    const namespaceFromRoute = route.params.namespace as string || globalStore.namespace;

    if (nameFromRoute && namespaceFromRoute) {
        if (nameFromRoute !== configMapName.value || namespaceFromRoute !== currentNamespace.value) {
            configMapName.value = nameFromRoute;
            currentNamespace.value = namespaceFromRoute;
            if (globalStore.namespace !== namespaceFromRoute) {
                 globalStore.namespace = namespaceFromRoute;
            }
            setupCommands(nameFromRoute, namespaceFromRoute);
            updateBreadcrumbs(nameFromRoute, namespaceFromRoute);
        }
    }
    // Update active tab from query, if present
     const tabQuery = route.query.tab as string;
    if (tabQuery && (tabQuery === 'yaml' || tabQuery === 'events') && activeTab.value !== tabQuery) {
        activeTab.value = tabQuery;
    }

}, { immediate: false }); // 'immediate: false' to avoid running on initial mount as onMounted handles it.


const handleConfigMapDelete = () => {
    const ns = currentNamespace.value;
    if (ns) {
        // Navigate to the list view for that namespace
        router.push({ name: 'configmaplistns', params: { namespace: ns } });
    } else {
        // Fallback to cluster-wide list
        router.push({ name: 'configmaplist' });
    }
};

</script>

<template>
    <div class="configmap-element-view" v-if="!isConfigMapNameValid">
        <div>Unable to load ConfigMap details. Name or namespace missing.</div>
    </div>
    <div class="configmap-element-view" v-if="isConfigMapNameValid">
        <div class="d-flex flex-row-reverse p-2 options-bar">
            <EditResource :editCommand="editCommand" buttonText="Edit ConfigMap" />
            <DeleteResource :deleteCommand="deleteCommand" @deleted="handleConfigMapDelete" />
        </div>
        <Tabs v-model:value="activeTab" scrollable>
            <TabList>
                <Tab value="yaml">YAML</Tab>
                <Tab value="events">Events</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="yaml">
                    <!-- Using DescribeViewer as a generic YAML viewer for now -->
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

<style scoped>
.options-bar {
   background-color: var(--p-surface-card); /* Adjusted for consistency with other element views */
   padding: 0.5rem;
   border-bottom: 1px solid var(--p-divider-color); /* Adjusted for consistency */
}
.configmap-element-view {
    /* If any specific styling is needed for the overall view */
}
</style>