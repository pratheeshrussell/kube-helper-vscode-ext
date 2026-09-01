import type { Node, Edge } from '@vue-flow/core';

export type VueFlowNode = Node;
export type VueFlowEdge = Edge;

export interface K8sResource {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace: string;
        uid?: string;
        creationTimestamp?: string;
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
        ownerReferences?: {
            apiVersion?: string;
            kind: string;
            name: string;
            uid?: string;
        }[];
    };
    spec?: any;
    status?: any;
}

export interface K8sResourceList {
    apiVersion: string;
    kind: string;
    items: K8sResource[];
}

export type HealthStatusType = 'healthy' | 'progressing' | 'degraded' | 'suspended' | 'unknown';

export interface HealthInfo {
    status: HealthStatusType;
    reason?: string;
    message?: string;
}

export interface PodSummary {
    name: string;
    phase: string;
    health: HealthStatusType;
    healthReason?: string;
    restarts: number;
    ready: boolean;
    raw?: any;
}

export interface PodGroupData {
    parentKind: string;
    parentName: string;
    totalCount: number;
    readyCount: number;
    pods: PodSummary[];
}

export type GraphViewMode = 'workload' | 'traffic';
export type LayoutDirection = 'LR' | 'TB';

export interface NetworkPolicySummary {
    name: string;
    kind: string;
    ingressRulesCount: number;
    egressRulesCount: number;
}

export interface ServicePortInfo {
    name?: string;
    port: number;
    targetPort: number | string;
    protocol: string;
    nodePort?: number;
}

export interface TrafficEdgeData {
    pathLabel?: string;
    targetPort?: string;
    trafficColor?: string;
    isNetworkFlow?: boolean;
    originalStyle?: Record<string, any>;
}

export interface GraphNodeData {
    resourceType: string;
    name: string;
    status?: any;
    spec?: any;
    metadata?: any;
    health: HealthInfo;
    restarts?: number;
    age?: string;
    externalUrl?: string;
    imageTag?: string;
    isPodGroup?: boolean;
    podGroup?: PodGroupData;
    childCount?: number;
    isCollapsed?: boolean;
    serviceType?: string;
    clusterIP?: string;
    servicePorts?: ServicePortInfo[];
    ingressHosts?: string[];
    ingressPaths?: string[];
    hasNetworkPolicy?: boolean;
    networkPolicies?: NetworkPolicySummary[];
    isExternalTraffic?: boolean;
    isInternalTraffic?: boolean;
    isExternalName?: boolean;
    externalName?: string;
    isHeadless?: boolean;
    layoutDirection?: LayoutDirection;
    viewMode?: GraphViewMode;
    [key: string]: any;
}

export interface GraphParserOptions {
    groupPods?: boolean;
    viewMode?: GraphViewMode;
}

