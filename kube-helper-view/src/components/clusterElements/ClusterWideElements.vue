<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Namespaces from './elementList/Namespaces.vue';
import ClusterNodes from './elementList/ClusterNodes.vue';
import { globalStore } from '../../store/store';
import PodList from './elementList/PodList.vue';
import PVList from './elementList/PVList.vue';
import EventList from '../common/EventList.vue';
import StorageClassList from './elementList/StorageClassList.vue';
import ClusterRoleList from './elementList/ClusterRoleList.vue';
import ClusterRoleBindingList from './elementList/ClusterRoleBindingList.vue';
import IngressClassList from './elementList/IngressClassList.vue';
import { kubeCmds } from '@src/constants/commands';

const value = ref('ns');
const isContext = ref(false);

const router = useRouter();

const navigateTo = (routeName: string) => {
    router.push({ name: routeName });
};

const getEventsCmd = kubeCmds.getNamespacedResourceByType.replace("{{resType}}", 'events');


onMounted(() => {
    const body=document.getElementsByTagName('body')[0];
    if(body){
        const curcontext = body.getAttribute('data-context-name');
        if(curcontext){
            globalStore.context = curcontext;
            globalStore.namespace = null;
            isContext.value = true;
        } 
    }
})

</script>

<template>
    <div class="cluster-over-view" v-if="!isContext">
        <div>Unable to load cluster details</div>
    </div>
    <div class="cluster-over-view" v-if="isContext">
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="ns">Namespaces</Tab>
                <Tab value="nodes">Nodes</Tab>
                <Tab value="pods">Pods</Tab>
                <Tab value="pv">Persistent Vol</Tab>
                <Tab value="event">Events</Tab>
                <Tab value="cr">Cluster Roles</Tab>
                <Tab value="crb">Cluster Role Bindings</Tab>
                <Tab value="sc">Storage Classes</Tab>
                <Tab value="ic">Ingress Classes</Tab>
                <Tab value="crd">Custom Resource Definitions</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="ns">
                   <Namespaces />
                </TabPanel>
                <TabPanel value="nodes">
                    <ClusterNodes />
                </TabPanel>
                <TabPanel value="pods">
                    <PodList />
                </TabPanel>
                <TabPanel value="pv">
                    <PVList />
                </TabPanel>
                <TabPanel value="cr">
                    <ClusterRoleList />
                </TabPanel>
                <TabPanel value="crb">
                    <ClusterRoleBindingList />
                </TabPanel>
                <TabPanel value="event">
                    <EventList :event-command="getEventsCmd" />
                </TabPanel>
                <TabPanel value="sc">
                    <StorageClassList />
                </TabPanel>
                <TabPanel value="ic">
                    <IngressClassList />
                </TabPanel>
                <TabPanel value="crd">
                    <div class="p-3 text-center">
                        <p>View and manage Custom Resource Definitions.</p>
                        <Button label="Go to CRDs" @click="navigateTo('crdlist')" />
                    </div>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.cluster-over-view {
    height: 100%;
    display: flex;
    flex-direction: column;
}

/* Ensure Tabs component itself takes full height if its parent (.cluster-over-view) is flex column */
:deep(.p-tabs) {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}

:deep(.p-tabs-nav-content) {
    flex-shrink: 0; /* Prevent nav from shrinking */
}
:deep(.p-tabs-panels) {
    flex-grow: 1; /* Allow panels to take remaining height */
    overflow-y: auto; /* Add scroll to panels if content overflows */
    padding: 0 !important; /* Override default panel padding if components handle their own */
    height: 100%; /* Fallback or if parent is not flex */
}

/* Ensure individual TabPanel and its direct child div take full height */
:deep(.p-tabpanel) {
    height: 100%;
}

:deep(.p-tabpanel > div:not(.text-center)) { /* Apply to component containers, not simple text divs */
    height: 100%;
}
</style>