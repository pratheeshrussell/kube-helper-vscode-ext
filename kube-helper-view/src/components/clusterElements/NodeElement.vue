<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import { kubeCmds } from '@src/constants/commands';
import NodeDebugPod from '../common/NodeDebugPod.vue';

const route = useRoute();

const value = ref('0');

const nodeName = ref('');
const nodeExecCommand = ref('');
const nodeDescribeCommand = ref('');

const isNodeName = ref(false);

onMounted(() => {
    const nodename = route.params.nodename;
    
    console.log("BBBBBBBBBBBBBBBBBBBB",nodename);
    if ((nodename !== null) &&
        (typeof nodename === 'string')) {
        nodeName.value = nodename;

        nodeExecCommand.value = kubeCmds.nodeDebugPod
            .replace('{{nodename}}', nodename);

        nodeDescribeCommand.value = kubeCmds.describeNonNamespacedResource
        .replace("{{resType}}", 'node')
        .replace("{{resName}}", nodename);

        isNodeName.value = true;

        globalStore.breadcrumbItems = [
            ...globalStore.breadcrumbItems,
            {
                label: nodename,
                navigateTo: 'nodeoverview',
                params: { nodename: nodename },
                index: globalStore.breadcrumbItems.length
            }
        ];
    }
})

</script>

<template>
    <div class="node-over-view" v-if="!isNodeName">
        <div>Unable to load node details</div>
    </div>
    
    <div class="node-over-view" v-if="isNodeName">
        <div class="d-flex flex-row-reverse p-2 node-options">
            <NodeDebugPod :execCommand="nodeExecCommand" />
        </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="0">Describe</Tab>

            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <DescribeViewer :describeCommand="nodeDescribeCommand" />
                </TabPanel>

            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.node-options {
    background-color: var(--p-surface-900);
}
</style>