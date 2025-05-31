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
import { ref, computed, watch } from 'vue'; // Removed onMounted
import { globalStore } from '../../store/store';
import { useRoute, useRouter } from 'vue-router';
import { kubeCmds } from '@src/constants/commands';
import { HelperUtils } from '@src/utils/helpers';

import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';

import DescribeViewer from '../common/DescribeViewer.vue';
import EventList from '../common/EventList.vue';
import EditResource from '../common/EditResource.vue';
import DeleteResource from '../common/DeleteResource.vue';

const DEBUG_MODE = import.meta.env.DEV;

const route = useRoute();
const router = useRouter();

const crdFullNameRef = ref<string | null>(null);
const crNameRef = ref<string | null>(null);
const namespaceRef = ref<string | null>(null);
const crdKindRef = ref<string | null>(null);
const crdGroupRef = ref<string | null>(null);
const crdVersionRef = ref<string | null>(null);
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
    const ns = namespaceRef.value;
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

    yamlCommand.value = HelperUtils.prepareCommand(`${baseGetCmd} -o yaml`);

    const apiVersionForEvent = `${group}/${version}`;
    let eventSelector = `involvedObject.kind=${kind},involvedObject.name=${crName},involvedObject.apiVersion=${apiVersionForEvent}`;
    let eventCmdString = `kubectl get events --field-selector ${eventSelector}`;
    if (scope === 'Namespaced' && ns) {
        eventCmdString += ` -n ${ns}`;
    }
    eventCommand.value = HelperUtils.prepareCommand(eventCmdString);

    editCommand.value = HelperUtils.prepareCommand(baseEditCmd);
    deleteCommand.value = HelperUtils.prepareCommand(baseDeleteCmd);
};

const updateBreadcrumbs = () => {
    if (!isCrValid.value) return;

    const crdListCrumb = { label: 'Custom Resource Definitions', navigateTo: 'crdlist', params: null, index: 0 };
    const crListParamsForBreadcrumb = { crdFullName: crdFullNameRef.value! };
    const crListCrumb = {
        label: `${crdKindRef.value!} (for ${crdFullNameRef.value!})`,
        navigateTo: 'crlist',
        params: crListParamsForBreadcrumb,
        index: 1
    };

    const currentRouteName = route.name || (namespaceRef.value ? 'crdetailns' : 'crdetail');
    const navigateToName = typeof currentRouteName === 'string' ? currentRouteName : 'clusteroverview';

    const crDetailCrumb = {
        label: crNameRef.value!,
        navigateTo: navigateToName,
        params: { ...route.params } as { [key: string]: string },
        index: 2
    };

    let breadcrumbs = [crdListCrumb, crListCrumb, crDetailCrumb];
    globalStore.breadcrumbItems = breadcrumbs as any;
};

const processRouteData = () => {
    crdFullNameRef.value = route.params.crdFullName as string;
    crNameRef.value = route.params.crName as string;
    namespaceRef.value = route.params.namespace ? route.params.namespace as string : null;

    crdKindRef.value = route.query.kind as string;
    crdGroupRef.value = route.query.group as string;
    crdVersionRef.value = route.query.version as string;
    crdScopeRef.value = route.query.scope as ('Namespaced' | 'Cluster');

    if (crdScopeRef.value === 'Namespaced' && namespaceRef.value) {
        if (globalStore.namespace !== namespaceRef.value) {
            globalStore.namespace = namespaceRef.value;
        }
    }

    if (isCrValid.value) {
        setupCommands();
        updateBreadcrumbs();
    } else {
        console.error("Custom Resource details are invalid/incomplete after processing route data.");
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
