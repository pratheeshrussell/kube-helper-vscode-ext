<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Namespaces from './elementList/Namespaces.vue';
import ClusterNodes from './elementList/ClusterNodes.vue';
import { globalStore } from '../../store/store';
import PodList from './elementList/PodList.vue';
import ConfigMapList from './elementList/ConfigMapList.vue';
import SecretList from './elementList/SecretList.vue';
import CustomResourceDefinitionList from './elementList/CustomResourceDefinitionList.vue'; // Added
import PVList from './elementList/PVList.vue';
import EventList from '../common/EventList.vue';
import StorageClassList from './elementList/StorageClassList.vue';
import ClusterRoleList from './elementList/ClusterRoleList.vue';
import ClusterRoleBindingList from './elementList/ClusterRoleBindingList.vue';
import IngressClassList from './elementList/IngressClassList.vue';
import { kubeCmds } from '@src/constants/commands';

const value = ref('ns');
const isContext = ref(false);

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
                <Tab value="cm">ConfigMaps</Tab>
                <Tab value="secrets">Secrets</Tab>
                <Tab value="crds">CRDs</Tab> <!-- Added -->
                <Tab value="pv">Persistent Vol</Tab>
                <Tab value="event">Events</Tab>
                <Tab value="cr">Cluster Roles</Tab>
                <Tab value="crb">Cluster Role Bindings</Tab>
                <Tab value="sc">Storage Classes</Tab>
                <Tab value="ic">Ingress Classes</Tab>
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
                <TabPanel value="crds"> <!-- Added -->
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
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>


</style>