<template>
    <VueFlow :nodes="nodes" :edges="edges" :fit-view-on-init="true">
        <Controls position="top-left" />
        <template #node-custom="props">
            <ResourceGraphNode :id="props.id" :data="props.data" />
        </template>
    </VueFlow>
    <Dialog v-model:visible="isDescribeVisible" header="Resource Details" modal :style="{ width: '75vw' }">
        <pre>{{ describeOutput }}</pre>
    </Dialog>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Controls } from '@vue-flow/controls';
import { MessageTypes } from '@common/messageTypes';
import { globalStore } from '../../store/store';
import { parseGraphData } from '../../utils/graph-parser';
import type { Node, Edge } from '@vue-flow/core';
import ELK from 'elkjs/lib/elk.bundled.js';
import ResourceGraphNode from './ResourceGraphNode.vue';

import '@vue-flow/controls/dist/style.css'
import { EDGE_STYLE } from './graphConstants';
import { HelperUtils } from '@src/utils/helpers';

const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);
const isDescribeVisible = ref(false);
const describeOutput = ref('');


const { onNodeClick, onPaneClick, getConnectedEdges } = useVueFlow();

const elk = new ELK();

const getLayoutedElements = async (nodes: Node[], edges: Edge[]) => {
    const graph = {
        id: 'root',
        layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'DOWN' },
        children: nodes.map((node) => ({
            id: node.id,
            width: (HelperUtils.approximateTextWidth(node.data.name, node.data.resourceType) + 20), // approximate width of your nodes
            height: 120, // approximate height of your nodes
        })),
        edges: edges.map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target]
        })),
    };

    const { children } = await elk.layout(graph);

    return {
        nodes: nodes.map((node) => {
            const layoutNode = children?.find((n) => n.id === node.id);
            return {
                ...node,
                position: { x: layoutNode?.x || 0, y: layoutNode?.y || 0 },
            };
        }),
        edges: edges,
    };
};

const getGraphData = () => {
    tsvscode?.postMessage({
        type: MessageTypes.GET_GRAPH_RESOURCES,
        namespace: globalStore.namespace,
        context: globalStore.context,
    });
};

// const describeResource = (resourceType: string, resourceName: string) => {
//     tsvscode?.postMessage({
//         type: MessageTypes.DESCRIBE_RESOURCE,
//         resourceType,
//         resourceName,
//         namespace: globalStore.namespace,
//     });
// };

window.addEventListener('message', async (event) => {
    if (event.data.type === MessageTypes.GRAPH_RESOURCES_RESULT) {
        const { nodes: parsedNodes, edges: parsedEdges } = parseGraphData(event.data.data);
        const layoutedElements = await getLayoutedElements(parsedNodes, parsedEdges);
        nodes.value = layoutedElements.nodes;
        edges.value = layoutedElements.edges.map((edge) => ({
            ...edge,
            style: { ...EDGE_STYLE.default }
        }));
    }
    if (event.data.type === MessageTypes.DESCRIBE_RESOURCE_RESULT) {
        describeOutput.value = event.data.data;
        isDescribeVisible.value = true;
    }
});

onNodeClick((event) => {
    const node = event.node;
    if (!node) return;

    // TODO: move this to node template
    // if (typeof node.data.name === 'string') {
    //     describeResource(node.data.resourceType, node.data.name);
    // }

    const connectedEdges = getConnectedEdges(node.id);
    edges.value = edges.value.map((edge) => {
        if (connectedEdges.some(e => e.id === edge.id)) {
            return {
                ...edge,
                style: { ...EDGE_STYLE.selected }
            }
        }
        return {
            ...edge,
            style: { ...EDGE_STYLE.default }
        }
    });
});

onPaneClick(() => {
    edges.value = edges.value.map((edge) => ({
        ...edge,
        style: {...EDGE_STYLE.default}
    }));
});

onMounted(() => {
    getGraphData();
});
</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.vue-flow {
    height: 100vh;
    width: 100%;
}
</style>

