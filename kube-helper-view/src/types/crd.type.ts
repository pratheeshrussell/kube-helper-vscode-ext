export interface CRDTableItem {
    uid: string;
    name: string; // e.g., certificates.cert-manager.io
    group: string; // e.g., cert-manager.io
    version: string; // e.g., v1
    scope: 'Namespaced' | 'Cluster';
    kind: string; // e.g., Certificate
    // Add established status?
}

export interface K8sCRDNames {
    kind: string;
    listKind?: string;
    plural: string;
    singular?: string;
    shortNames?: string[];
}

export interface K8sCRDVersion {
    name: string; // e.g., v1, v1alpha1
    served: boolean;
    storage: boolean;
    schema?: object; // OpenAPI v3 schema
    subresources?: object;
    additionalPrinterColumns?: object[];
}

export interface K8sCRDStatusCondition {
    type: string;
    status: string;
    lastTransitionTime?: string;
    reason?: string;
    message?: string;
}

export interface K8sCRDStatus {
    conditions?: K8sCRDStatusCondition[];
    acceptedNames?: K8sCRDNames;
    storedVersions?: string[];
}

export interface K8sCRDSpec {
    group: string;
    versions: K8sCRDVersion[];
    scope: 'Namespaced' | 'Cluster';
    names: K8sCRDNames;
    conversion?: object;
    preserveUnknownFields?: boolean;
}

export interface K8sCRD {
    apiVersion: string; // e.g., apiextensions.k8s.io/v1
    kind: 'CustomResourceDefinition';
    metadata: {
        name: string; // Full name of the CRD, e.g., certificates.cert-manager.io
        uid: string;
        creationTimestamp?: string;
        [key: string]: any;
    };
    spec: K8sCRDSpec;
    status?: K8sCRDStatus;
}

export interface CRDListType {
    apiVersion: string;
    kind: string;
    metadata?: {
        resourceVersion?: string;
        [key: string]: any;
    };
    items: K8sCRD[];
}
