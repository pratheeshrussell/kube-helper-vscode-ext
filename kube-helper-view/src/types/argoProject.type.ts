export interface ArgoProjectDestination {
    server?: string;
    namespace?: string;
    name?: string;
}

export interface ArgoGroupKind {
    group: string;
    kind: string;
}

export interface ArgoProjectRole {
    name: string;
    description?: string;
    policies?: string[];
    groups?: string[];
}

export interface ArgoProject {
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
        description?: string;
        sourceRepos?: string[];
        sourceNamespaces?: string[];
        destinations?: ArgoProjectDestination[];
        clusterResourceWhitelist?: ArgoGroupKind[];
        clusterResourceBlacklist?: ArgoGroupKind[];
        namespaceResourceWhitelist?: ArgoGroupKind[];
        namespaceResourceBlacklist?: ArgoGroupKind[];
        roles?: ArgoProjectRole[];
        orphanedResources?: {
            warn?: boolean;
            ignore?: { group?: string; kind?: string; name?: string }[];
        };
    };
    status?: {
        jwtTokensByRole?: Record<string, any>;
    };
}

export interface ArgoProjectList {
    apiVersion: string;
    kind: string;
    items: ArgoProject[];
}

export interface ArgoProjectTableItem {
    namespace: string;
    name: string;
    description: string;
    sourceRepos: string;
    destinations: string;
    age: string;
}
