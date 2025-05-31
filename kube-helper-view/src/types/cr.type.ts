// Generic types for Custom Resources (CRs)

export interface CRTableItem {
    uid: string;
    name: string;
    namespace?: string; // Only if the CR is namespaced
    age: string;
    timestamp: string;
    // It's hard to predict other common fields for CRs,
    // so keep it minimal. Specific CR viewers might extract more.
}

export interface K8sCR {
    apiVersion: string; // e.g., cert-manager.io/v1
    kind: string;       // e.g., Certificate
    metadata: {
        name: string;
        namespace?: string;
        uid: string;
        creationTimestamp?: string;
        resourceVersion: string;
        labels?: { [key: string]: string };
        annotations?: { [key: string]: string };
        [key: string]: any; // Other metadata fields
    };
    spec?: {
        [key: string]: any; // CRD-specific spec
    };
    status?: {
        [key: string]: any; // CRD-specific status
    };
    [key: string]: any; // Other top-level fields a CR might have
}

export interface CRListType {
    apiVersion: string;
    kind: string; // This will often be a "<Kind>List", e.g., "CertificateList"
    metadata?: {
        resourceVersion?: string;
        [key: string]: any;
    };
    items: K8sCR[];
}
