<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Namespaces from './elementList/Namespaces.vue';
import ClusterNodes from './elementList/ClusterNodes.vue';
import { globalStore } from '../../store/store';
import PodList from './elementList/PodList.vue';

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
        <Tabs v-model:value="value">
            <TabList>
                <Tab value="0">Namespaces</Tab>
                <Tab value="1">Nodes</Tab>
                <Tab value="2">Persistant Volumes & Storage Classes</Tab>
                <Tab value="3">Pods</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                   <Namespaces />
                </TabPanel>
                <TabPanel value="1">
                    <ClusterNodes />
                </TabPanel>
                <TabPanel value="2">
                    <div>NOT DONE</div>
                </TabPanel>
                <TabPanel value="3">
                    <PodList />
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>


</style>