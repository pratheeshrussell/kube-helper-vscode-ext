<template>
    <div class="graph-container">
        <div class="graph-toolbar">
            <IconField>
                <InputIcon class="pi pi-search" />
                <InputText v-model="searchQuery" placeholder="Search resources..." class="search-input" />
            </IconField>
        </div>
        <VueFlow :nodes="filteredNodes" :edges="edges" :fit-view-on-init="true" class="vue-flow-container">
            <Controls position="top-left" />
            <template #node-custom="props">
                <ResourceGraphNode :id="props.id" :data="props.data" />
            </template>
        </VueFlow>

        <Drawer v-model:visible="isDescribeVisible" position="right" class="resource-details-drawer"
            :style="{ width: '50vw' }">
            <template #header>
                <div class="drawer-header">
                    <h3>{{ selectedNode?.data?.name }}</h3>
                    <span class="resource-type">{{ selectedNode?.data?.resourceType }}</span>
                </div>
            </template>
            <Tabs v-model:value="activeTab" class="details-tabs">
                <TabList>
                    <Tab value="0">Describe</Tab>
                    <Tab value="1">YAML</Tab>
                </TabList>
                <TabPanels class="details-tab-panels">
                    <TabPanel value="0" class="details-tab-panel">
                        <div class="resource-details-content">
                            <v-ace-editor v-model:value="describeOutput" readonly lang="text" theme="cloud_editor_dark"
                                class="ace-editor-full" />
                        </div>
                    </TabPanel>
                    <TabPanel value="1" class="details-tab-panel">
                        <div class="resource-details-content">
                            <v-ace-editor v-model:value="yamlOutput" readonly lang="yaml" theme="cloud_editor_dark"
                                class="ace-editor-full" />
                        </div>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Drawer>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Controls } from '@vue-flow/controls';
import { MessageTypes } from '@common/messageTypes';
import { globalStore } from '../../store/store';
import { parseGraphData } from '../../utils/graph-parser';
import type { Node, Edge } from '@vue-flow/core';
import ELK from 'elkjs/lib/elk.bundled.js';
import ResourceGraphNode from './ResourceGraphNode.vue';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Drawer from 'primevue/drawer';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import { VAceEditor } from 'vue3-ace-editor';

import '@vue-flow/controls/dist/style.css'
import { EDGE_STYLE } from './graphConstants';
import { HelperUtils } from '@src/utils/helpers';

const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);
const isDescribeVisible = ref(false);
const describeOutput = ref('');
const yamlOutput = ref('');
const searchQuery = ref('');
const selectedNode = ref<Node | null>(null);
const activeTab = ref('0');

const { onPaneClick, onNodeClick, getConnectedEdges } = useVueFlow();

const elk = new ELK();

const filteredNodes = computed(() => {
    if (!searchQuery.value) {
        // Explicitly reset opacity to 1 for all nodes when search is empty
        return nodes.value.map(node => ({
            ...node,
            style: {
                ...node.style,
                opacity: 1,
            }
        }));
    }
    const query = searchQuery.value.toLowerCase();
    return nodes.value.map(node => {
        const isMatch = node.data.name.toLowerCase().includes(query) ||
            node.data.resourceType.toLowerCase().includes(query);
        return {
            ...node,
            style: {
                ...node.style,
                opacity: isMatch ? 1 : 0.2,
            }
        };
    });
});

const getLayoutedElements = async (nodes: Node[], edges: Edge[]) => {
    const graph = {
        id: 'root',
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN',
            'elk.spacing.nodeNode': '80',
            'elk.layered.spacing.nodeNodeBetweenLayers': '100',
            'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF'
        },
        children: nodes.map((node) => ({
            id: node.id,
            width: (HelperUtils.approximateTextWidth(node.data.name, node.data.resourceType) + 40), // approximate width
            height: 80, // approximate height
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

const describeResource = (resourceType: string, resourceName: string) => {
    tsvscode?.postMessage({
        type: MessageTypes.DESCRIBE_RESOURCE,
        resourceType,
        resourceName,
        namespace: globalStore.namespace,
    });
};

const getResourceYaml = (resourceType: string, resourceName: string) => {
    yamlOutput.value = 'Loading YAML...';
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'resourceYaml',
        command: `kubectl get ${resourceType} ${resourceName} -n ${globalStore.namespace} -o yaml`
    });
};

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
    if (event.data.type === 'resourceYaml') {
        yamlOutput.value = event.data.data;
    }
});

onNodeClick((event) => {
    const node = event.node;
    if (!node) return;

    selectedNode.value = node;
    activeTab.value = '0'; // Reset to Describe tab

    // Highlighting edges
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

    // Trigger describe
    describeResource(node.data.resourceType, node.data.name);
});

// Watch for tab change to fetch YAML
watch(activeTab, (newTab) => {
    if (newTab === '1' && selectedNode.value) {
        getResourceYaml(selectedNode.value.data.resourceType, selectedNode.value.data.name);
    }
});

onPaneClick(() => {
    edges.value = edges.value.map((edge) => ({
        ...edge,
        style: { ...EDGE_STYLE.default }
    }));
});

onMounted(() => {
    getGraphData();
});
</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.graph-container {
    height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-color, #121212);
}

.graph-toolbar {
    padding: 1rem;
    background-color: var(--surface-card, #1e1e1e);
    border-bottom: 1px solid var(--surface-border, #333);
    display: flex;
    gap: 1rem;
    align-items: center;
}

.search-input {
    width: 300px;
}

.vue-flow-container {
    flex-grow: 1;
}

/* Drawer Styles */
.resource-details-drawer .p-drawer-content {
    padding: 0 !important;
    /* Remove default padding to maximize space */
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    /* Prevent drawer body scroll */
}

.drawer-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.drawer-header h3 {
    margin: 0;
    font-size: 1.25rem;
}

.resource-type {
    font-size: 0.875rem;
    color: #888;
    text-transform: uppercase;
}

/* Tabs Styles */
.details-tabs {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    height: 100%;
    overflow: hidden;
}

.details-tab-panels {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
    /* Remove default padding */
}

.details-tab-panel {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
}

.resource-details-content {
    flex-grow: 1;
    background: #1e1e1e;
    color: #e0e0e0;
    overflow: hidden;
    /* Let Ace Editor handle scrolling */
    height: 100%;
    display: flex;
    flex-direction: column;
}

.ace-editor-full {
    height: 100% !important;
    width: 100% !important;
}

pre {
    margin: 0;
    white-space: pre-wrap;
    font-family: monospace;
}
</style>
