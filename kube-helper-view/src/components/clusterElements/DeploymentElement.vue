<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute, useRouter } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import LogViewer from '../common/LogViewer.vue';
import { kubeCmds } from '@src/constants/commands';
import EditResource from '../common/EditResource.vue';
import DeleteResource from '../common/DeleteResource.vue';

const route = useRoute();
const router = useRouter();

const depName = ref('');

const value = ref('0');
const isDepName = ref(false);

const depDescribeCommand = ref('');
const depLogCommand = ref('');

const depEditCommand = ref('');
const depDelCommand = ref('');

onMounted(() => {
    const depname = route.params.depname;

    if((depname !== null ) && 
    (typeof depname === 'string')){
        depName.value = depname;
        
        isDepName.value = true;

        depDescribeCommand.value = kubeCmds.getDescribeDeployment.replace("{{depname}}",depname);

        depLogCommand.value = kubeCmds.getLogsDeployment.replace("{{depname}}",depname);

        depEditCommand.value = kubeCmds.editDeployment.replace('{{depname}}', depname);
        depDelCommand.value = kubeCmds.deleteDeployment.replace('{{depname}}', depname);

        globalStore.breadcrumbItems = [
            ...globalStore.breadcrumbItems,
            {
                label: depname, 
                navigateTo: 'deploymentoverview', 
                params:{depname: depname},
                index: globalStore.breadcrumbItems.length
            }
        ];
    }
})

const handleDepDelete = () => {
    const lastBreadcrumb = globalStore.breadcrumbItems[globalStore.breadcrumbItems.length - 1];
    if (lastBreadcrumb && lastBreadcrumb.navigateTo === 'deploymentoverview') {
        globalStore.breadcrumbItems.pop();
        router.back();
    }
}

</script>

<template>
    <div class="dep-over-view" v-if="!isDepName">
        <div>Unable to load deployment details</div>
    </div>
    <div class="dep-over-view" v-if="isDepName">
        <div class="d-flex flex-row-reverse p-2 dep-options">
            <EditResource :editCommand="depEditCommand" buttonText="Edit Depl" />
            <DeleteResource :deleteCommand="depDelCommand" @deleted="handleDepDelete" />
        </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="0">Logs</Tab>
                <Tab value="1">Describe</Tab>
                
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <LogViewer :logCommand="depLogCommand" :allowPrevious="false" />
                </TabPanel>
                <TabPanel value="1">
                    <DescribeViewer :describeCommand="depDescribeCommand" />
                </TabPanel>
                
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.dep-options{
    background-color: var(--p-surface-900);
}

</style>