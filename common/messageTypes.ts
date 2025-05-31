export const MessageTypes = {
    VIEW_READY: 'VIEW_READY',
    RUN_CMD_TERMINAL: 'RUN_CMD_TERMINAL',
    RUN_CMD_RESULT: 'RUN_CMD_RESULT',
    SHOW_DETAILS: 'OPEN_DETAILS',
    GET_RESOURCE_GRAPH: 'GET_RESOURCE_GRAPH', // Added for tree view
} as const;

// Types for Resource Tree View data structure (shared between backend and frontend)

// Data structure for individual Kubernetes resource nodes
export interface K8sResourceNodeData {
  id: string; // Should match the node's id (e.g., kind/namespace/name or kind/name)
  kind: string;
  name: string;
  namespace?: string;
  uid: string; // K8s UID
  apiVersion: string; // e.g., apps/v1, v1, networking.k8s.io/v1
  labels?: { [key: string]: string }; // Added labels
  status: string; // Simplified status: 'Running', 'Pending', 'Failed', 'Succeeded', 'Unknown', etc.
  health?: {
    ready?: boolean | number; // e.g. true for most, 1/1 for pods
    desired?: number;
    actual?: number;
    message?: string; // Additional health detail
  };
  labelDetails?: string; // e.g. "Pods: 3/3 Ready" for Deployment, or specific status for Pod
  // rawObject?: any; // Optionally send the raw K8s object if needed for deep inspection on frontend (can be large)
}

// Base interfaces for Vue Flow, assuming these are not directly importable in common
// These are simplified versions of Vue Flow's Node and Edge types.
// The frontend will use the actual Vue Flow types.
interface BaseNode<T = any, U extends string = string> {
    id: string;
    type?: U;
    label?: string | object | Function | Promise<any>;
    position?: { x: number; y: number };
    data?: T;
    // other properties Vue Flow uses e.g. hidden, selected, draggable, width, height etc.
}

interface BaseEdge<T = any, U extends string = string> {
    id: string;
    type?: U;
    source: string;
    target: string;
    label?: string | object | Function | Promise<any>;
    animated?: boolean;
    data?: T;
    // other properties
}

// For Vue Flow nodes, the `data` property will use K8sResourceNodeData
export type K8sVueFlowNode = BaseNode<K8sResourceNodeData, 'k8sNode' | 'default'>; // Allow 'default' or custom 'k8sNode'
export type K8sVueFlowEdge = BaseEdge; // Edge data can be anything, or omit for now

export interface ResourceGraphData {
    nodes: K8sVueFlowNode[];
    edges: K8sVueFlowEdge[];
    error?: string; // Optional error message
}