import type { Node, Edge } from '@vue-flow/core';

export type VueFlowNode = Node;
export type VueFlowEdge = Edge;

export interface K8sResource {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace: string;
        labels?: Record<string, string>;
        ownerReferences?: {
            kind: string;
            name: string;
        }[];
    };
    spec: any;
}

export interface K8sResourceList {
    apiVersion: string;
    kind: string;
    items: K8sResource[];
}
