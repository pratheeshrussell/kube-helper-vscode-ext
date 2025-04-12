<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute, useRouter } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import { kubeCmds } from '@src/constants/commands';
import EditResource from '../common/EditResource.vue';
import DeleteResource from '../common/DeleteResource.vue';
import LogViewer from '../common/LogViewer.vue';

const route = useRoute();
const router = useRouter();

const rsName = ref('');

const value = ref('0');
const isRsName = ref(false);

const rsLogCommand = ref('');
const rsDescribeCommand = ref('');
const rsEditCommand = ref('');
const rsDelCommand = ref('');

const handleRsDelete = () => {
    const lastBreadcrumb = globalStore.breadcrumbItems[globalStore.breadcrumbItems.length - 1];
    if (lastBreadcrumb && lastBreadcrumb.navigateTo === 'replsetoverview') {
        globalStore.breadcrumbItems.pop();
        router.back();
    }
}

onMounted(() => {
    const rsname = route.params.rsname;

    if((rsname !== null ) && 
    (typeof rsname === 'string')){
        rsName.value = rsname;
        
        isRsName.value = true;

        rsDescribeCommand.value = kubeCmds.describeNamespacedResource
        .replace("{{resType}}", 'replicaset')
        .replace("{{resName}}", rsname);
        
        rsEditCommand.value = kubeCmds.editNamespacedResource.replace("{{resType}}", 'replicaset')
        .replace("{{resName}}", rsname);
        rsDelCommand.value = kubeCmds.deleteNamespacedResource.replace("{{resType}}", 'replicaset')
        .replace("{{resName}}", rsname);
        rsLogCommand.value = kubeCmds.getNamespacedResourceLogs
        .replace("{{resType}}",'rs').replace("{{resName}}",rsname);

        globalStore.breadcrumbItems = [
            ...globalStore.breadcrumbItems,
            {
                label: rsname, 
                navigateTo: 'replsetoverview', 
                params:{rsname: rsname},
                index: globalStore.breadcrumbItems.length
            }
        ];
    }
})

</script>

<template>
    <div class="rs-over-view" v-if="!isRsName">
        <div>Unable to load replicaset details</div>
    </div>
    <div class="rs-over-view" v-if="isRsName">
        <div class="d-flex flex-row-reverse p-2 rs-options">
            <EditResource :editCommand="rsEditCommand" buttonText="Edit rs" />
            <DeleteResource :deleteCommand="rsDelCommand" @deleted="handleRsDelete" />
        </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="0">Logs</Tab>
                <Tab value="1">Describe</Tab>
                
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <LogViewer :logCommand="rsLogCommand" :allowPrevious="true" />
                </TabPanel>
                <TabPanel value="1">
                    <DescribeViewer :describeCommand="rsDescribeCommand" />
                </TabPanel>
                
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.rs-options{
    background-color: var(--p-surface-900);
}

</style>