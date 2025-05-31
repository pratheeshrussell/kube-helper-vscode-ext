<template>
  <div style="height: 100vh; width: 100%;">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :fit-view-on-init="fitViewOnInit"
      :default-viewport="{ zoom: 1 }"
      :min-zoom="0.1"
      :max-zoom="4"
    >
      <Controls />
      <MiniMap />
      <Background :pattern-color="themeVariables['surface-ground'] || '#aabbcc'" gap="10" />
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { VueFlow, useVueFlow, type Node, type Edge } from '@vue-flow/core';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { Background } from '@vue-flow/background';
import dagre from 'dagre';

// Import Vue Flow styles
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
import '@vue-flow/minimap/dist/style.css';
import '@vue-flow/background/dist/style.css';

import type { K8sVueFlowNode, K8sVueFlowEdge } from '@src/types/treeView.type'; // K8sResourceNodeData not directly used here anymore for mock
import { globalStore } from '@src/store/store';
import K8sResourceNode from './K8sResourceNode.vue';
import { MessageTypes } from '@common/messageTypes'; // For sending messages
import ProgressSpinner from 'primevue/progressspinner'; // For loading indicator

const nodeTypes = {
  k8sNode: K8sResourceNode,
};

const nodes = ref<K8sVueFlowNode[]>([]);
const edges = ref<K8sVueFlowEdge[]>([]);
const fitViewOnInit = ref(true); // Keep true, layoutNodes will fit view
const loading = ref(false);
const errorMessage = ref<string | null>(null);

const { vueFlowInstance, onPaneReady } = useVueFlow();

// Theme variables for background pattern color
const themeVariables = ref({
  'surface-ground': getComputedStyle(document.documentElement).getPropertyValue('--surface-ground').trim() || '#f0f0f0',
});

watch(() => globalStore.theme, () => {
    nextTick(() => {
        themeVariables.value = {
            'surface-ground': getComputedStyle(document.documentElement).getPropertyValue('--surface-ground').trim() || '#f0f0f0',
        };
    });
}, { immediate: true });


const NODE_WIDTH = 172;
const NODE_HEIGHT = 36;

const layoutNodes = (nodesToLayout: K8sVueFlowNode[], edgesToLayout: K8sVueFlowEdge[]) => {
  if (!nodesToLayout || nodesToLayout.length === 0) return;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 70 }); // TB: Top to Bottom
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  nodesToLayout.forEach((node) => {
    dagreGraph.setNode(node.id, {
      label: node.data?.name || node.id, // Use node name for label if available
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  edgesToLayout.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodesToLayout.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - NODE_WIDTH / 2,
        y: dagreNode.y - NODE_HEIGHT / 2,
      },
    };
  });

  nodes.value = layoutedNodes;
  edges.value = edgesToLayout; // Assign edges passed to layout (backend generated)

  // Ensure view fits after layout, especially if fitViewOnInit didn't catch it
  // or if data is loaded asynchronously.
  nextTick(() => {
    if (vueFlowInstance.value) {
      vueFlowInstance.value.fitView();
    }
  });
};

const fetchResourceGraph = (namespace: string | null) => {
  if (!namespace) {
    nodes.value = [];
    edges.value = [];
    errorMessage.value = "No namespace selected to display resource graph.";
    loading.value = false;
    return;
  }

  loading.value = true;
  errorMessage.value = null;
  console.log(`Fetching resource graph for namespace: ${namespace}`);
  tsvscode?.postMessage({
    type: MessageTypes.GET_RESOURCE_GRAPH, // New MessageType
    subType: 'namespaceGraph', // Specific subtype
    data: { namespace: namespace }
  });
};

window.addEventListener('message', (event) => {
  const message = event.data;
  if (message.type === MessageTypes.GET_RESOURCE_GRAPH && message.subType === 'namespaceGraphData') {
    loading.value = false;
    if (message.error) {
      console.error('Error fetching resource graph:', message.error);
      errorMessage.value = `Failed to fetch resource graph: ${message.error}`;
      nodes.value = [];
      edges.value = [];
    } else if (message.data) {
      console.log('Received namespace graph data:', message.data);
      // Backend directly provides nodes and edges in Vue Flow format
      // but positions are not set yet.
      const receivedNodes = message.data.nodes as K8sVueFlowNode[];
      const receivedEdges = message.data.edges as K8sVueFlowEdge[];

      if (receivedNodes.length === 0) {
        // errorMessage.value = `No resources found in namespace ${globalStore.namespace} or unable to build graph.`;
        nodes.value = []; // Clear nodes explicitly
        edges.value = []; // Clear edges explicitly
      } else {
         // Ensure all nodes have a type, default to 'k8sNode' if not provided by backend
        receivedNodes.forEach(node => {
            if (!node.type) {
                node.type = 'k8sNode';
            }
        });
        layoutNodes(receivedNodes, receivedEdges);
      }
    }
  }
});

onMounted(() => {
  if (globalStore.namespace) {
    fetchResourceGraph(globalStore.namespace);
  } else {
    // Optionally, display a message to select a namespace
    errorMessage.value = "Please select a namespace to view the resource graph.";
  }
});

watch(() => globalStore.namespace, (newNamespace, oldNamespace) => {
  if (newNamespace !== oldNamespace) {
    fetchResourceGraph(newNamespace);
  }
});

// Ensure fitView is called when the pane is ready and nodes are present
onPaneReady(({ fitView }) => {
    if (nodes.value.length > 0) {
        fitView();
    }
});

// Watch nodes and fit view if they change and vueFlowInstance is ready
watch(nodes, (newNodes) => {
    if (newNodes && newNodes.length > 0 && vueFlowInstance.value) {
        nextTick(() => {
            vueFlowInstance.value.fitView();
        });
    }
}, { deep: true });

</script>

<style>
/* Ensure VueFlow container has a defined size */
.vue-flow__container {
  height: 100%;
  width: 100%;
}
/* Add any additional global styles for the tree view if needed */
.loading-spinner-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10; /* Ensure it's above the graph */
}
.error-message-container {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: auto;
  max-width: 80%;
}
</style>

<template>
  <div style="height: 100vh; width: 100%; position: relative;">
    <div v-if="loading" class="loading-spinner-container">
      <ProgressSpinner />
    </div>
    <Message v-if="errorMessage" severity="error" :closable="true" @close="errorMessage = null" class="error-message-container">
        {{ errorMessage }}
    </Message>
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :fit-view-on-init="fitViewOnInit"
      :default-viewport="{ zoom: 1 }"
      :min-zoom="0.1"
      :max-zoom="4"
      :node-types="nodeTypes"
      :class="{ 'opacity-50': loading }"
    >
      <Controls />
      <MiniMap />
      <Background :pattern-color="themeVariables['surface-ground'] || '#aabbcc'" gap="10" />
    </VueFlow>
  </div>
});

</script>

<style>
/* Ensure VueFlow container has a defined size */
.vue-flow__container {
  height: 100%;
  width: 100%;
}
/* Add any additional global styles for the tree view if needed */
</style>
