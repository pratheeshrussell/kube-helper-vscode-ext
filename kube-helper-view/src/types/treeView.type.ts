import type { Node, Edge } from '@vue-flow/core';

// Data structure for individual Kubernetes resource nodes
export interface K8sResourceNodeData {
  id: string; // Should match the node's id
  kind: string;
  name: string;
  status?: string; // e.g., 'Running', 'Pending', 'Failed'
  namespace?: string;
  rawObject?: any; // Store the raw K8s object if needed for details later
  // Add any other specific fields you want to access in your custom nodes or for layout
}

// For Vue Flow nodes, the `data` property will use K8sResourceNodeData
export type K8sVueFlowNode = Node<K8sResourceNodeData>;
export type K8sVueFlowEdge = Edge;

// If you need to store layouted nodes with specific structure before passing to VueFlow
export interface LayoutedNode extends K8sVueFlowNode {
    // Dagre might add x, y, width, height here if you directly mutate
    // but Vue Flow nodes have `position` and `dimensions`
}
