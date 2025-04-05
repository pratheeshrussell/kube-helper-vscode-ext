<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Namespaces from './elementList/Namespaces.vue';
import ClusterNodes from './elementList/ClusterNodes.vue';
import { globalStore } from '../../store/store';
import PodList from './elementList/PodList.vue';
import EventList from './elementList/EventList.vue';
import StorageClassList from './elementList/StorageClassList.vue';
import ClusterRoleList from './elementList/ClusterRoleList.vue';
import ClusterRoleBindingList from './elementList/ClusterRoleBindingList.vue';
import IngressClassList from './elementList/IngressClassList.vue';

const value = ref('0');
const isContext = ref(false);

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
                <Tab value="0">Namespaces</Tab>
                <Tab value="1">Nodes</Tab>
                <Tab value="2">Pods</Tab>
                <Tab value="3">Cluster Roles</Tab>
                <Tab value="4">Cluster Role Bindings</Tab>
                <Tab value="5">Events</Tab>
                <Tab value="6">Storage Classes</Tab>
                <Tab value="7">Ingress Classes</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                   <Namespaces />
                </TabPanel>
                <TabPanel value="1">
                    <ClusterNodes />
                </TabPanel>
                <TabPanel value="2">
                    <PodList />
                </TabPanel>
                <TabPanel value="3">
                    <ClusterRoleList />
                </TabPanel>
                <TabPanel value="4">
                    <ClusterRoleBindingList />
                </TabPanel>
                <TabPanel value="5">
                    <EventList />
                </TabPanel>
                <TabPanel value="6">
                    <StorageClassList />
                </TabPanel>
                <TabPanel value="7">
                    <IngressClassList />
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>


</style>