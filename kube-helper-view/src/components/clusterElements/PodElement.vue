<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { globalStore } from '../../store/store';
import { MessageTypes } from '@common/messageTypes';
import { HelperUtils } from '@src/utils/helpers';
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

const containerNames = ref<string[]>([]);
const selectedContainer = ref<string | null>(null);

const podDescribeCommand = ref('');

const podExecCommand = ref('');
const podPortfwdCommand = ref('');
const podPortDelCommand = ref('');
const podEditCommand = ref('');
const podEventCommand = ref('');

onMounted(() => {
    const name = route.params.podname as string;
    const tabQuery = route.query.tab as string;

    if (name !== null && typeof name === 'string') {
        podName.value = name;
        isPodName.value = true;

        podDescribeCommand.value = kubeCmds.describeNamespacedResource
        .replace("{{resType}}", 'pod')
        .replace("{{resName}}", name);

        // Fetch pod details for container names
        fetchPodDetailsForLogContainerSelection(name);

        podExecCommand.value = kubeCmds.execPod.replace('{{podname}}', name);
        podPortfwdCommand.value = kubeCmds.portfwdPod.replace('{{podname}}', name);
        podPortDelCommand.value = kubeCmds.deleteNamespacedResource.replace("{{resType}}", 'pod')
        .replace("{{resName}}", name);

        podEditCommand.value = kubeCmds.editNamespacedResource.replace("{{resType}}", 'pod')
        .replace("{{resName}}", name);

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

        // Check for tab query parameter
        if (tabQuery) {
            // Ensure the tab value is valid, otherwise default to '0' or handle as error
            const validTabs = ["0", "1", "2", "events"]; // Add other valid tab values if any
            if (validTabs.includes(tabQuery)) {
                value.value = tabQuery;
            }
        }
    }
})

const podLogsCommand = computed(() => {
    let baseCmd = kubeCmds.getNamespacedResourceLogs
        .replace("{{resType}}", 'pod')
        .replace("{{resName}}", podName.value)
        .replace("{{namespace}}", globalStore.namespace); // Ensure namespace is included

    if (selectedContainer.value) {
        baseCmd += ` -c ${selectedContainer.value}`;
    }
    return baseCmd;
});

const fetchPodDetailsForLogContainerSelection = (pName: string) => {
    const command = HelperUtils.prepareCommand(
        kubeCmds.getNamespacedResourceByName
            .replace('{{resType}}', 'pod')
            .replace('{{resName}}', pName)
            .replace('{{namespace}}', globalStore.namespace) + ' -o json'
    );
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'getPodDetailsForLogContainerSelection',
        command: command
    });
};

window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === MessageTypes.RUN_CMD_RESULT && message.subType === 'getPodDetailsForLogContainerSelection') {
        if (message.data && !message.data.error) {
            try {
                const podDetails = JSON.parse(message.data.output);
                if (podDetails && podDetails.spec && podDetails.spec.containers) {
                    containerNames.value = podDetails.spec.containers.map((c: any) => c.name);
                    if (containerNames.value.length > 0) {
                        selectedContainer.value = containerNames.value[0]; // Default to first container
                    }
                }
            } catch (e) {
                console.error('Error parsing pod details for container selection:', e);
                containerNames.value = [];
                selectedContainer.value = null;
            }
        } else {
            console.error('Error fetching pod details for container selection:', message.data?.errormessage);
            containerNames.value = [];
            selectedContainer.value = null;
        }
    }
});

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
                    <div v-if="containerNames.length > 1" class="p-field p-mb-2">
                        <label for="container-select" class="p-mr-2">Select Container:</label>
                        <Dropdown id="container-select" v-model="selectedContainer" :options="containerNames" placeholder="Select a container" />
                    </div>
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