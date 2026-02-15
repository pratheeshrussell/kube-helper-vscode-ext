import type { ArgoAppDestination, ArgoAppSource, ArgoSyncPolicy } from './argoApp.type';

export interface ArgoAppSetGenerator {
    list?: {
        elements?: any[];
    };
    clusters?: {
        selector?: any;
        values?: Record<string, string>;
    };
    git?: {
        repoURL?: string;
        revision?: string;
        directories?: { path: string; exclude?: boolean }[];
        files?: { path: string }[];
    };
    matrix?: {
        generators?: ArgoAppSetGenerator[];
    };
    merge?: {
        generators?: ArgoAppSetGenerator[];
        mergeKeys?: string[];
    };
    pullRequest?: any;
    scmProvider?: any;
    clusterDecisionResource?: any;
}

export interface ArgoAppSetCondition {
    type: string;
    message: string;
    status: string;
    lastTransitionTime?: string;
    reason?: string;
}

export interface ArgoApplicationSet {
    apiVersion?: string;
    kind?: string;
    metadata: {
        name: string;
        namespace?: string;
        creationTimestamp?: string;
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
        uid?: string;
    };
    spec: {
        generators?: ArgoAppSetGenerator[];
        template?: {
            metadata?: {
                name?: string;
                namespace?: string;
                labels?: Record<string, string>;
                annotations?: Record<string, string>;
            };
            spec?: {
                project?: string;
                source?: ArgoAppSource;
                sources?: ArgoAppSource[];
                destination?: ArgoAppDestination;
                syncPolicy?: ArgoSyncPolicy;
            };
        };
        syncPolicy?: {
            preserveResourcesOnDeletion?: boolean;
        };
    };
    status?: {
        conditions?: ArgoAppSetCondition[];
        applicationStatus?: {
            application: string;
            message: string;
            status: string;
            step: string;
        }[];
    };
}

export interface ArgoApplicationSetList {
    apiVersion: string;
    kind: string;
    items: ArgoApplicationSet[];
}

export interface ArgoAppSetTableItem {
    namespace: string;
    name: string;
    generators: string;
    templateApp: string;
    project: string;
    age: string;
}
