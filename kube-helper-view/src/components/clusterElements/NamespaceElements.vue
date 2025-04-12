<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PodList from './elementList/PodList.vue';
import { globalStore } from '../../store/store';
import { useRoute } from 'vue-router'
import ServiceList from './elementList/ServiceList.vue';
import EventList from '../common/EventList.vue';
import ConfigMapList from './elementList/ConfigMapList.vue';
import SecretList from './elementList/SecretList.vue';
import PVCList from './elementList/PVCList.vue';
import IngressList from './elementList/IngressList.vue';
import EndpointList from './elementList/EndpointList.vue';
import RoleList from './elementList/RoleList.vue';
import RoleBindingList from './elementList/RoleBindingList.vue';
import SAList from './elementList/SAList.vue';
import ReplicaSetList from './elementList/ReplicaSetList.vue';
import DeploymentList from './elementList/DeploymentList.vue';
import { kubeCmds } from '@src/constants/commands';

const route = useRoute();

const value = ref('pods');
const isNamespace = ref(false);

const getEventsCmd = kubeCmds.getNamespacedResourceByType.replace("{{resType}}", 'events');


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
                <Tab value="pods">Pods</Tab>
                <Tab value="svcs">Services</Tab>
                <Tab value="replicasets">Replica Sets</Tab>
                <Tab value="deployments">Deployments</Tab>
                <Tab value="confmaps">Config Map</Tab>
                <Tab value="secrets">Secrets</Tab>
                <Tab value="pvc">PVC</Tab>
                <Tab value="ingress">Ingress</Tab>
                <Tab value="endpoints">Endpoints</Tab>
                <Tab value="events">Events</Tab>
                <Tab value="roles">Roles</Tab>
                <Tab value="rolebinding">Role Binding</Tab>
                <Tab value="sa">Service Account</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="pods">
                   <PodList />
                </TabPanel>
                <TabPanel value="svcs">
                    <ServiceList />
                </TabPanel>
                <TabPanel value="deployments">
                    <DeploymentList />
                </TabPanel>
                <TabPanel value="replicasets">
                    <ReplicaSetList />
                </TabPanel>
                <TabPanel value="confmaps">
                    <ConfigMapList />
                </TabPanel>
                <TabPanel value="secrets">
                    <SecretList />
                </TabPanel>
                <TabPanel value="pvc">
                    <PVCList />
                </TabPanel>
                <TabPanel value="ingress">
                    <IngressList />
                </TabPanel>
                <TabPanel value="endpoints">
                    <EndpointList />
                </TabPanel>
                <TabPanel value="events">
                    <EventList :event-command="getEventsCmd" />
                </TabPanel>
                <TabPanel value="roles">
                    <RoleList />
                </TabPanel>
                <TabPanel value="rolebinding">
                    <RoleBindingList />
                </TabPanel>
                <TabPanel value="sa">
                    <SAList />
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>


</style>