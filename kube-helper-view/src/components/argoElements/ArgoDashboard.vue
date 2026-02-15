<template>
    <div class="argo-dashboard">
        <div class="header-container mb-3">
            <ArgoHeader />
        </div>
        <div class="argo-tabs">
            <Tabs v-model:value="value" scrollable lazy>
                <TabList>
                    <Tab value="apps">Applications</Tab>
                    <Tab value="projects">Projects</Tab>
                    <Tab value="appsets">ApplicationSets</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel value="apps">
                        <ArgoAppList />
                    </TabPanel>
                    <TabPanel value="projects">
                        <ArgoProjectList />
                    </TabPanel>
                    <TabPanel value="appsets">
                        <ArgoAppSetList />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import ArgoHeader from './ArgoHeader.vue';
import ArgoAppList from './elementList/ArgoAppList.vue';
import ArgoProjectList from './elementList/ArgoProjectList.vue';
import ArgoAppSetList from './elementList/ArgoAppSetList.vue';

const value = ref('apps');

onMounted(() => {
    // argo crd should always be the first element
    globalStore.breadcrumbItems = [
        {
            label: "ArgoCD", navigateTo: 'argocdoverview',
            params: {}, index: 0
        }
    ];
    // Force global namespace to null so we query --all-namespaces
    globalStore.namespace = null;
})
</script>

<style scoped>
.argo-dashboard {
    display: flex;
    flex-direction: column;
    height: 100%;
}
.header-container {
    flex-shrink: 0;
}
.argo-tabs {
    flex-grow: 1;
    overflow: hidden;
}
</style>