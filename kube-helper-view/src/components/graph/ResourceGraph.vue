<template>
    <div ref="graphContainer" class="resource-graph-container"></div>
    <Dialog v-model:visible="isDescribeVisible" header="Resource Details" modal :style="{ width: '75vw' }">
        <pre>{{ describeOutput }}</pre>
    </Dialog>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data/peer';
import { MessageTypes } from '@common/messageTypes';
import { globalStore } from '../../store/store';
import { parseGraphData } from '../../utils/graph-parser';
import { getThemeOptions } from '../../utils/graph-theme';
import type { VisNode, VisEdge } from '../../types/graph.type';

const graphContainer = ref<HTMLElement | null>(null);
const isDescribeVisible = ref(false);
const describeOutput = ref('');
let network: Network | null = null;
const nodes = ref<DataSet<VisNode>>(new DataSet<VisNode>());
const edges = ref<DataSet<VisEdge>>(new DataSet<VisEdge>());

const props = defineProps({
    active: {
        type: Boolean,
        required: true,
    }
});

const getGraphData = () => {
    tsvscode?.postMessage({
        type: MessageTypes.GET_GRAPH_RESOURCES,
        namespace: globalStore.namespace,
        context: globalStore.context,
    });
};

const describeResource = (resourceType: string, resourceName: string) => {
    tsvscode?.postMessage({
        type: MessageTypes.DESCRIBE_RESOURCE,
        resourceType,
        resourceName,
        namespace: globalStore.namespace,
    });
};

window.addEventListener('message', (event) => {
    if (event.data.type === MessageTypes.GRAPH_RESOURCES_RESULT) {
        const parsedData = parseGraphData(event.data.data);
        nodes.value.clear();
        nodes.value.add(parsedData.nodes);
        edges.value.clear();
        edges.value.add(parsedData.edges);
        createGraph();
    }
    if (event.data.type === MessageTypes.DESCRIBE_RESOURCE_RESULT) {
        describeOutput.value = event.data.data;
        isDescribeVisible.value = true;
    }
});

const createGraph = () => {
    if (graphContainer.value) {
        const data = { nodes: nodes.value, edges: edges.value };
        const theme = document.body.getAttribute('data-theme') === '1' ?  'light': 'dark';
        const options = getThemeOptions(theme);
        network = new Network(graphContainer.value, data, options);

        network.on('click', (params) => {
            const allEdges = edges.value.get({ returnType: 'Array' }) as VisEdge[];
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node = nodes.value.get(nodeId) as unknown as VisNode;
                if (node) {
                    describeResource(node.resourceType, node.label.split('\n')[0]);
                }
                if (!network) return;
                const connectedEdges = network.getConnectedEdges(nodeId);
                const updates = allEdges.map((edge: VisEdge) => ({
                    id: edge.id,
                    arrows: connectedEdges.includes(edge.id as any) ? 'to' : ''
                }));
                edges.value.update(updates as any);
            } else {
                const updates = allEdges.map((edge: VisEdge) => ({
                    id: edge.id,
                    arrows: 'to'
                }));
                edges.value.update(updates as any);
            }
        });
    }
};

watch(() => props.active, (isActive) => {
    if (isActive && !network) {
        getGraphData();
    }
});

onMounted(() => {
    if (props.active) {
        getGraphData();
    }
});
</script>

<style scoped>
.resource-graph-container {
    height: 100vh;
    width: 100%;
}
/* Viz Controls */

::v-deep(div.vis-network div.vis-navigation div.vis-button.vis-up) {
    top: 10px;
    left: 55px;
    background-image: url('images/arrow-up.png');
}

::v-deep(div.vis-network div.vis-navigation div.vis-button.vis-down) {
    top: 50px;
    left: 55px;
    background-image: url('images/arrow-down.png');
}

::v-deep(div.vis-network div.vis-navigation div.vis-button.vis-left) {
    top: 10px;
    left: 15px;
    background-image: url('images/arrow-left.png');
}

::v-deep(div.vis-network div.vis-navigation div.vis-button.vis-right) {
    top: 10px;
    left: 95px;
    background-image: url('images/arrow-right.png');
}


::v-deep(div.vis-network div.vis-navigation div.vis-button.vis-zoomIn) {
    top: 10px;
    right: 15px;
    background-image: url('images/zoom-in.png');
}

::v-deep(div.vis-network div.vis-navigation div.vis-button.vis-zoomOut) {
    top: 10px;
    right: 55px;
    background-image: url('images/zoom-out.png');
}

::v-deep(div.vis-network div.vis-navigation div.vis-button.vis-zoomExtends) {
    top: 50px;
    right: 15px;
    background-image: url('images/zoom-extend.png');
}


</style>
