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
      <Background :pattern-color="themeVariables['surface-ground'] || '#aabbcc'" :gap="10" /> {/* Corrected :gap */}
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'; // Added onMounted
import { VueFlow, useVueFlow } from '@vue-flow/core';
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

import type { K8sVueFlowNode, K8sVueFlowEdge } from '@src/types/treeView.type';
import { globalStore } from '@src/store/store';
import K8sResourceNode from './K8sResourceNode.vue';
import { MessageTypes } from '@common/messageTypes';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message'; // Added Message import

const nodeTypes = {
  k8sNode: K8sResourceNode,
};

const nodes = ref<K8sVueFlowNode[]>([]);
const edges = ref<K8sVueFlowEdge[]>([]);
const fitViewOnInit = ref(true);
const loading = ref(false);
const errorMessage = ref<string | null>(null);

// Get the whole Vue Flow instance store
const vueFlow = useVueFlow();
// Destructure specific methods if needed directly, e.g. for event handlers
const { onPaneReady, fitView: directFitView } = useVueFlow();


interface PaneReadyEvent {
  fitView: () => void; // fitView from the event itself
}

const themeVariables = ref({
  'surface-ground': '#f0f0f0', // Default, will be updated
});

watch(() => globalStore.theme, () => {
    nextTick(() => {
        const newBgColor = getComputedStyle(document.documentElement).getPropertyValue('--surface-ground').trim();
        themeVariables.value = {
            'surface-ground': newBgColor || '#f0f0f0',
        };
    });
}, { immediate: true, deep: true });


const NODE_WIDTH = 172;
const NODE_HEIGHT = 36;

const layoutNodes = (nodesToLayout: K8sVueFlowNode[], edgesToLayout: K8sVueFlowEdge[]) => {
  if (!nodesToLayout || nodesToLayout.length === 0) {
      nodes.value = []; // Clear if nothing to layout
      edges.value = [];
      return;
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 70 });
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  nodesToLayout.forEach((node) => {
    dagreGraph.setNode(node.id, {
      label: node.data?.name || node.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  edgesToLayout.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodesResult = nodesToLayout.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - NODE_WIDTH / 2,
        y: dagreNode.y - NODE_HEIGHT / 2,
      },
    };
  });

  nodes.value = layoutedNodesResult;
  edges.value = edgesToLayout;

  nextTick(() => {
    if (typeof directFitView === 'function') {
        directFitView();
    } else if (vueFlow.fitView) { // Check if fitView method exists on the store
        vueFlow.fitView();
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
  tsvscode?.postMessage({
    type: MessageTypes.GET_RESOURCE_GRAPH,
    subType: 'namespaceGraph',
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
      const receivedNodes = message.data.nodes as K8sVueFlowNode[];
      const receivedEdges = message.data.edges as K8sVueFlowEdge[];

      if (receivedNodes.length === 0) {
        nodes.value = [];
        edges.value = [];
      } else {
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
  // Initialize theme first
   nextTick(() => {
        const newBgColor = getComputedStyle(document.documentElement).getPropertyValue('--surface-ground').trim();
        themeVariables.value = {
            'surface-ground': newBgColor || '#f0f0f0',
        };
    });

  if (globalStore.namespace) {
    fetchResourceGraph(globalStore.namespace);
  } else {
    errorMessage.value = "Please select a namespace to view the resource graph.";
  }
});

watch(() => globalStore.namespace, (newNamespace, oldNamespace) => {
  if (newNamespace !== oldNamespace) {
    fetchResourceGraph(newNamespace);
  }
});

onPaneReady(({ fitView: paneFitViewEvent }: PaneReadyEvent) => {
    if (nodes.value.length > 0) {
        paneFitViewEvent();
    } else {
        if (vueFlow.setViewport) {
            vueFlow.setViewport({ x:0, y:0, zoom: 1});
        }
    }
});

watch(nodes, (newNodes) => {
    if (newNodes && newNodes.length > 0) {
        nextTick(() => {
            if (typeof directFitView === 'function') {
                directFitView();
            } else if (vueFlow.fitView) {
                vueFlow.fitView();
            }
        });
    }
}, { deep: true });

</script>

<style>
.vue-flow__container {
  height: 100%;
  width: 100%;
}
.loading-spinner-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
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
