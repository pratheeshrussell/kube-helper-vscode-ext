<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Namespaces from './elementList/Namespaces.vue';
import ClusterNodes from './elementList/ClusterNodes.vue';
import { globalStore } from '../../store/store';
import PodList from './elementList/PodList.vue';
import ConfigMapList from './elementList/ConfigMapList.vue'; // Re-adding
import SecretList from './elementList/SecretList.vue'; // Re-adding
import CustomResourceDefinitionList from './elementList/CustomResourceDefinitionList.vue'; // Re-adding
import PVList from './elementList/PVList.vue';
import EventList from '../common/EventList.vue';
import StorageClassList from './elementList/StorageClassList.vue';
import ClusterRoleList from './elementList/ClusterRoleList.vue';
import ClusterRoleBindingList from './elementList/ClusterRoleBindingList.vue';
import IngressClassList from './elementList/IngressClassList.vue';
import { kubeCmds } from '@src/constants/commands';
import { useRouter } from 'vue-router'; // Added for navigation

const value = ref('ns'); // Default tab
const isContext = ref(false);
const router = useRouter();

const getEventsCmd = kubeCmds.getNamespacedResourceByType.replace("{{resType}}", 'events');

const onTabChange = (newValue: string | number | undefined | symbol | null) => {
  if (newValue === 'treeview') {
    router.push({ name: 'treeview' });
  }
  // If other tabs need to change routes, add them here.
  // For example, to make ConfigMaps tab also route-driven:
  // else if (newValue === 'cm') {
  //   router.push({ name: 'configmaplist' });
  // }
  // This component's <RouterView> would then be primary for content.
};

onMounted(() => {
    const body=document.getElementsByTagName('body')[0];
    if(body){
        const curcontext = body.getAttribute('data-context-name');
        if(curcontext){
            globalStore.context = curcontext;
            globalStore.namespace = null;
            isContext.value = true;

            // Set active tab based on current route when component mounts
            const currentRouteName = router.currentRoute.value.name;
            const tabValueFromRoute: { [key: string]: string } = {
                'namespaceoverview': 'ns', // Assuming 'ns' is the value for Namespaces tab
                'clusteroverview': 'ns', // Default to 'ns' for cluster overview
                'podlist': 'pods', // Assuming a route named 'podlist' corresponds to 'pods' tab
                'configmaplist': 'cm',
                'secretlist': 'secrets',
                'crdlist': 'crds',
                'treeview': 'treeview',
                // Add other mappings from route names to tab values if those tabs also navigate
            };
            if (currentRouteName && tabValueFromRoute[currentRouteName as string]) {
                value.value = tabValueFromRoute[currentRouteName as string];
            } else if (currentRouteName === 'clusteroverview' && !value.value) {
                // If it's cluster overview and no specific tab is set (e.g. direct load)
                value.value = 'ns'; // Default to namespaces
            }
            // If 'value.value' was already set by v-model from a previous state (e.g. browser back),
            // and it doesn't match the current route, onTabChange might be needed or
            // the user might see one tab selected but content of another if not careful.
            // The current onTabChange only handles 'treeview'.
        } 
    }
})

</script>

<template>
    <div class="cluster-over-view" v-if="!isContext">
        <div>Unable to load cluster details</div>
    </div>
    <div class="cluster-over-view" v-if="isContext">
        <Tabs v-model:value="value" @update:modelValue="onTabChange" scrollable>
            <TabList>
                <Tab value="ns">Namespaces</Tab>
                <Tab value="nodes">Nodes</Tab>
                <Tab value="pods">Pods</Tab>
                <Tab value="cm">ConfigMaps</Tab>
                <Tab value="secrets">Secrets</Tab>
                <Tab value="crds">CRDs</Tab>
                <Tab value="pv">Persistent Vol</Tab>
                <Tab value="event">Events</Tab>
                <Tab value="cr">Cluster Roles</Tab>
                <Tab value="crb">Cluster Role Bindings</Tab>
                <Tab value="sc">Storage Classes</Tab>
                <Tab value="ic">Ingress Classes</Tab>
                <Tab value="treeview">Resource Tree</Tab> <!-- Added -->
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
                <TabPanel value="cm">
                    <ConfigMapList />
                </TabPanel>
                <TabPanel value="secrets">
                    <SecretList />
                </TabPanel>
                <TabPanel value="crds">
                    <CustomResourceDefinitionList />
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
                <TabPanel value="treeview">
                    <!-- This panel is effectively a placeholder if 'treeview' route shows ResourceTreeView via RouterView in ClusterView -->
                    <p v-if="value === 'treeview' && router.currentRoute.value.name !== 'treeview'">Navigating to Resource Tree...</p>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>


</style>