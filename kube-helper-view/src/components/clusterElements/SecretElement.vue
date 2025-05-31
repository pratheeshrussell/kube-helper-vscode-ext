<template>
    <div class="secret-element-view" v-if="!isSecretNameValid">
        <div>Unable to load Secret details. Name or namespace missing.</div>
    </div>
    <div class="secret-element-view" v-if="isSecretNameValid">
        <div class="d-flex flex-row-reverse p-2 options-bar">
            <EditResource :editCommand="editCommand" buttonText="Edit Secret" />
            <DeleteResource :deleteCommand="deleteCommand" @deleted="handleSecretDelete" />
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

const route = useRoute();
const router = useRouter();

const secretName = ref<string | null>(null);
const currentNamespace = ref<string | null>(null);
const activeTab = ref('yaml');

const isSecretNameValid = computed(() => !!(secretName.value && currentNamespace.value));

const yamlCommand = ref<string>('');
const eventCommand = ref<string>('');
const editCommand = ref<string>('');
const deleteCommand = ref<string>('');

const setupCommands = (sName: string, ns: string) => {
    const yamlBaseCmd = kubeCmds.getNamespacedResourceByNameOutput || `kubectl get {{resType}} {{resName}} -n {{namespace}} -o yaml`;
    yamlCommand.value = HelperUtils.prepareCommand(
        yamlBaseCmd
            .replace("{{resType}}", 'secret')
            .replace("{{resName}}", sName)
            .replace("{{namespace}}", ns)
    );
    eventCommand.value = HelperUtils.prepareCommand(
        kubeCmds.getEventsPerResource
            .replace('{{resName}}', sName)
            .replace('{{resType}}', 'Secret')
            .replace('{{namespace}}', ns)
    );
    editCommand.value = HelperUtils.prepareCommand(
        kubeCmds.editNamespacedResource
            .replace("{{resType}}", 'secret')
            .replace("{{resName}}", sName)
            .replace("{{namespace}}", ns)
    );
    deleteCommand.value = HelperUtils.prepareCommand(
        kubeCmds.deleteNamespacedResource
            .replace("{{resType}}", 'secret')
            .replace("{{resName}}", sName)
            .replace("{{namespace}}", ns)
    );
};

const updateBreadcrumbs = (sName: string, ns: string) => {
    const listBreadcrumbBase = { label: 'Secrets', index: 0 };
    let routeNameForList = 'secretlist';
    let paramsForList: { namespace?: string } = {};

    if (ns) {
        routeNameForList = 'secretlistns';
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
        label: sName,
        navigateTo: 'secretoverview',
        params: { secretname: sName, namespace: ns },
        index: breadcrumbs.length
    });

    globalStore.breadcrumbItems = breadcrumbs;
};

onMounted(() => {
    const nameFromRoute = route.params.secretname as string;
    const namespaceFromRoute = route.params.namespace as string || globalStore.namespace;

    if (nameFromRoute && namespaceFromRoute) {
        secretName.value = nameFromRoute;
        currentNamespace.value = namespaceFromRoute;
        if (globalStore.namespace !== namespaceFromRoute) {
            globalStore.namespace = namespaceFromRoute;
        }
        setupCommands(nameFromRoute, namespaceFromRoute);
        updateBreadcrumbs(nameFromRoute, namespaceFromRoute);
    } else {
        console.error("Secret name or namespace is missing.");
    }

    const tabQuery = route.query.tab as string;
    if (tabQuery && (tabQuery === 'yaml' || tabQuery === 'events')) {
        activeTab.value = tabQuery;
    }
});

watch(() => route.fullPath, () => {
    const nameFromRoute = route.params.secretname as string;
    const namespaceFromRoute = route.params.namespace as string || globalStore.namespace;

    if (nameFromRoute && namespaceFromRoute) {
        if (nameFromRoute !== secretName.value || namespaceFromRoute !== currentNamespace.value) {
            secretName.value = nameFromRoute;
            currentNamespace.value = namespaceFromRoute;
            if (globalStore.namespace !== namespaceFromRoute) {
                 globalStore.namespace = namespaceFromRoute;
            }
            setupCommands(nameFromRoute, namespaceFromRoute);
            updateBreadcrumbs(nameFromRoute, namespaceFromRoute);
        }
    }
    const tabQuery = route.query.tab as string;
    if (tabQuery && (tabQuery === 'yaml' || tabQuery === 'events') && activeTab.value !== tabQuery) {
        activeTab.value = tabQuery;
    }
}, { immediate: false });

const handleSecretDelete = () => {
    const ns = currentNamespace.value;
    if (ns) {
        router.push({ name: 'secretlistns', params: { namespace: ns } });
    } else {
        router.push({ name: 'secretlist' });
    }
};
</script>

<style scoped>
.options-bar {
   background-color: var(--p-surface-card);
   padding: 0.5rem;
   border-bottom: 1px solid var(--p-divider-color);
}
</style>