<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute, useRouter } from 'vue-router';
import ContainerList from './elementList/ContainerList.vue';
import LogViewer from '../common/LogViewer.vue';
import { kubeCmds } from '@src/constants/commands';
import DescribeViewer from '../common/DescribeViewer.vue';
import RunExec from '../common/RunExec.vue';
import PortForward from '../common/PortForward.vue';
import DeleteResource from '../common/DeleteResource.vue';
import EditResource from '../common/EditResource.vue';
import EventList from '../common/EventList.vue';

const route = useRoute();
const router = useRouter();

const podName = ref('');
const value = ref('0');
const isPodName = ref(false);

const podLogsCommand = ref('');
const podDescribeCommand = ref('');

const podExecCommand = ref('');
const podPortfwdCommand = ref('');
const podPortDelCommand = ref('');
const podEditCommand = ref('');
const podEventCommand = ref('');

onMounted(() => {
    const name = route.params.podname;

    if (name !== null && typeof name === 'string') {
        podName.value = name;
        isPodName.value = true;

        podLogsCommand.value = kubeCmds.getLogsPod.replace('{{podname}}', name);
        podDescribeCommand.value = kubeCmds.getDescribePod.replace('{{podname}}', name);

        podExecCommand.value = kubeCmds.execPod.replace('{{podname}}', name);
        podPortfwdCommand.value = kubeCmds.portfwdPod.replace('{{podname}}', name);
        podPortDelCommand.value = kubeCmds.deletePod.replace('{{podname}}', name);

        podEditCommand.value = kubeCmds.editPod.replace('{{podname}}', name);

        podEventCommand.value = kubeCmds.getEventsPerResource
                .replace('{{resName}}', name).replace('{{resType}}', 'Pod');

        const lastBreadcrumb = globalStore.breadcrumbItems[globalStore.breadcrumbItems.length - 1];
        if (!lastBreadcrumb ||
            lastBreadcrumb.navigateTo !== 'podoverview' ||
            lastBreadcrumb.label !== name ) {
            globalStore.breadcrumbItems = [
                ...globalStore.breadcrumbItems,
                {
                    label: name,
                    navigateTo: 'podoverview',
                    params: { podname: name },
                    index: globalStore.breadcrumbItems.length
                }
            ];
        }
    }
})

const handlePodDelete = () => {
    const lastBreadcrumb = globalStore.breadcrumbItems[globalStore.breadcrumbItems.length - 1];
    if (lastBreadcrumb && lastBreadcrumb.navigateTo === 'podoverview') {
        globalStore.breadcrumbItems.pop();
        router.back();
    }
}

</script>

<template>
    <div class="pod-over-view" v-if="!isPodName">
        <div>Unable to load pod details</div>
    </div>
    <div class="pod-over-view" v-if="isPodName">
        <div class="d-flex flex-row-reverse p-2 pod-options">
            <RunExec :execCommand="podExecCommand" />
            <PortForward :portfwdCommand="podPortfwdCommand" />
            <DeleteResource :deleteCommand="podPortDelCommand" @deleted="handlePodDelete" />
            <EditResource :editCommand="podEditCommand" buttonText="Edit Pod" />
        </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="0">Containers</Tab>
                <Tab value="1">Logs</Tab>
                <Tab value="2">Describe</Tab>
                <Tab value="events">Events</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <ContainerList />
                </TabPanel>
                <TabPanel value="1">
                    <LogViewer :logCommand="podLogsCommand" :allowPrevious="true" />
                </TabPanel>
                <TabPanel value="2">
                    <DescribeViewer :describeCommand="podDescribeCommand" />
                </TabPanel>
                <TabPanel value="events">
                    <EventList :event-command="podEventCommand" />
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.pod-options{
   background-color: var(--p-surface-900);
}
</style>