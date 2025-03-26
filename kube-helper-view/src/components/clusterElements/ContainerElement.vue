<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute } from 'vue-router';
import LogViewer from '../common/LogViewer.vue';
import { kubeCmds } from '@src/constants/commands';
import RunExec from '../common/RunExec.vue';

const route = useRoute();

const podName = ref('');
const containerName = ref('');

const value = ref('0');
const isContainerName = ref(false);

const containerLogsCommand = ref('');
const containerExecCommand = ref('');

onMounted(() => {
    const podname = route.params.podname;
    const containername = route.params.container;

    

    if((podname !== null && containername !== null ) && 
    (typeof podname === 'string' && typeof containername === 'string')){
        podName.value = podname;
        containerName.value = containername;
        isContainerName.value = true;

        containerLogsCommand.value = kubeCmds.getLogsContainer.replace('{{podname}}', podname)
            .replace('{{container}}', containername);
        containerExecCommand.value = kubeCmds.execContainer
            .replace('{{podname}}', podname).replace('{{container}}', containername);

        globalStore.breadcrumbItems = [
            ...globalStore.breadcrumbItems,
            {
                label: containername, 
                navigateTo: 'containeroverview', 
                params:{podname: podname},
                index: globalStore.breadcrumbItems.length
            }
        ];
    }
})

</script>

<template>
    <div class="container-over-view" v-if="!isContainerName">
        <div>Unable to load container details</div>
    </div>
    <div class="container-over-view" v-if="isContainerName">
        <div class="d-flex flex-row-reverse p-2 container-options">
            <RunExec :execCommand="containerExecCommand" />
        </div>
        <Tabs v-model:value="value">
            <TabList>
                <Tab value="0">Logs</Tab>
                
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <LogViewer :logCommand="containerLogsCommand"  />
                </TabPanel>
                
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.container-options{
    background-color: var(--p-surface-900);
}

</style>