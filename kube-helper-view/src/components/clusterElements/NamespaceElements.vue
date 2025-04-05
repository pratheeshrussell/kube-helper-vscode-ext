<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PodList from './elementList/PodList.vue';
import { globalStore } from '../../store/store';
import { useRoute } from 'vue-router'
import ServiceList from './elementList/ServiceList.vue';
import EventList from './elementList/EventList.vue';
import ConfigMapList from './elementList/ConfigMapList.vue';
import SecretList from './elementList/SecretList.vue';
import PVList from './elementList/PVList.vue';
import PVCList from './elementList/PVCList.vue';
import IngressList from './elementList/IngressList.vue';
import EndpointList from './elementList/EndpointList.vue';
import RoleList from './elementList/RoleList.vue';
import RoleBindingList from './elementList/RoleBindingList.vue';

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
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="0">Pods</Tab>
                <Tab value="1">Services</Tab>
                <Tab value="2">Config Map</Tab>
                <Tab value="3">Secrets</Tab>
                <Tab value="4">Persistent Vol</Tab>
                <Tab value="5">PVC</Tab>
                <Tab value="6">Ingress</Tab>
                <Tab value="7">Endpoints</Tab>
                <Tab value="8">Events</Tab>
                <Tab value="9">Roles</Tab>
                <Tab value="10">Role Binding</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                   <PodList />
                </TabPanel>
                <TabPanel value="1">
                    <ServiceList />
                </TabPanel>
                <TabPanel value="2">
                    <ConfigMapList />
                </TabPanel>
                <TabPanel value="3">
                    <SecretList />
                </TabPanel>
                <TabPanel value="4">
                    <PVList />
                </TabPanel>
                <TabPanel value="5">
                    <PVCList />
                </TabPanel>
                <TabPanel value="6">
                    <IngressList />
                </TabPanel>
                <TabPanel value="7">
                    <EndpointList />
                </TabPanel>
                <TabPanel value="8">
                    <EventList />
                </TabPanel>
                <TabPanel value="9">
                    <RoleList />
                </TabPanel>
                <TabPanel value="10">
                    <RoleBindingList />
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>


</style>