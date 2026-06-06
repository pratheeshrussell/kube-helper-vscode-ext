export interface ArgoAppSource {
    repoURL: string;
    path?: string;
    targetRevision?: string;
    chart?: string;
    helm?: {
        valueFiles?: string[];
        parameters?: { name: string; value: string }[];
        values?: string;
    };
    kustomize?: {
        namePrefix?: string;
        nameSuffix?: string;
        images?: string[];
    };
    directory?: {
        recurse?: boolean;
    };
}

export interface ArgoAppDestination {
    server?: string;
    namespace?: string;
    name?: string;
}

export interface ArgoSyncPolicy {
    automated?: {
        prune?: boolean;
        selfHeal?: boolean;
        allowEmpty?: boolean;
    };
    syncOptions?: string[];
    retry?: {
        limit?: number;
        backoff?: {
            duration?: string;
            factor?: number;
            maxDuration?: string;
        };
    };
}

export interface ArgoSyncStatus {
    status: string;
    comparedTo?: {
        source?: ArgoAppSource;
        destination?: ArgoAppDestination;
    };
    revision?: string;
}

export interface ArgoHealthStatus {
    status: string;
    message?: string;
}

export interface ArgoCondition {
    type: string;
    message: string;
    lastTransitionTime?: string;
}

export interface ArgoOperationState {
    operation?: {
        sync?: {
            revision?: string;
            syncStrategy?: any;
        };
    };
    phase?: string;
    message?: string;
    syncResult?: {
        resources?: any[];
        revision?: string;
        source?: ArgoAppSource;
    };
    startedAt?: string;
    finishedAt?: string;
}

export interface ArgoManagedResource {
    group?: string;
    version?: string;
    kind?: string;
    namespace?: string;
    name?: string;
    status?: string;
    health?: ArgoHealthStatus;
    requiresPruning?: boolean;
}

export interface ArgoSyncHistoryEntry {
    id?: number;
    revision?: string;
    deployedAt?: string;
    deployStartedAt?: string;
    source?: ArgoAppSource;
    sources?: ArgoAppSource[];
}

export interface ArgoApplication {
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
        project: string;
        source?: ArgoAppSource;
        sources?: ArgoAppSource[];
        destination: ArgoAppDestination;
        syncPolicy?: ArgoSyncPolicy;
    };
    status?: {
        sync?: ArgoSyncStatus;
        health?: ArgoHealthStatus;
        conditions?: ArgoCondition[];
        operationState?: ArgoOperationState;
        reconciledAt?: string;
        summary?: {
            images?: string[];
        };
        resources?: ArgoManagedResource[];
        history?: ArgoSyncHistoryEntry[];
    };
}

export interface ArgoApplicationList {
    apiVersion: string;
    kind: string;
    items: ArgoApplication[];
}

export interface ArgoAppTableItem {
    namespace: string;
    name: string;
    project: string;
    syncStatus: string;
    healthStatus: string;
    repoURL: string;
    targetRevision: string;
    destServer: string;
    destNamespace: string;
    age: string;
}
