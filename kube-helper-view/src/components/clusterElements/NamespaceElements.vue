<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PodList from './elementList/PodList.vue';
import { globalStore } from '../../store/store';
import { useRoute } from 'vue-router'

const route = useRoute();


const value = ref('0');
const isNamespace = ref(false);

onMounted(() => {
    const name = route.params.namespace;
    if(name !== null && typeof name === 'string'){
        isNamespace.value = true;
        globalStore.namespace = name;
        // namespace should always be the first element
        globalStore.breadcrumbItems = [
            {label: name, navigateTo: 'namespaceoverview', 
            params:{namespace: name}, index: 0}
        ];
    }
})

</script>

<template>
    <div class="ns-over-view" v-if="!isNamespace">
        <div>Unable to load namespace details</div>
    </div>
    <div class="ns-over-view" v-if="isNamespace">
        <Tabs v-model:value="value">
            <TabList>
                <Tab value="0">Pods</Tab>
                <Tab value="1">Services</Tab>
                <Tab value="2">Volumes?</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                   <PodList />
                </TabPanel>
                <TabPanel value="1">
                    <div>NOT DONE</div>
                </TabPanel>
                <TabPanel value="2">
                    <div>NOT DONE</div>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>


</style>