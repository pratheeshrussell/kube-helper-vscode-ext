// Generic type for Custom Resources
// Specific CRs will have their own spec and status structures.

export interface KubeCustomResourceMetadata {
    name: string;
    namespace?: string;
    uid?: string;
    resourceVersion?: string;
    generation?: number;
    creationTimestamp?: string;
    annotations?: { [key: string]: string };
    labels?: { [key: string]: string };
    [key: string]: any; // Allow other metadata fields
}

export interface KubeCustomResource {
    apiVersion: string; // e.g., "group/version"
    kind: string;
    metadata: KubeCustomResourceMetadata;
    spec?: { [key: string]: any }; // CR specific
    status?: { [key: string]: any }; // CR specific
    [key: string]: any; // Allow other top-level fields if any
}

export interface KubeCRList {
    apiVersion: string; // e.g., "group/version"
    kind: string; // e.g., "MyResourceList"
    metadata: {
        resourceVersion?: string;
        continue?: string;
    };
    items: KubeCustomResource[];
}
