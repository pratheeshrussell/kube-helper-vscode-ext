export interface ConfigMapTableItem {
    uid: string; // For DataKey
    namespace: string;
    name: string;
    age: string;
    timestamp: string; // For sorting by age
    dataCount: number;
}

export interface K8sConfigMap {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace: string;
        creationTimestamp?: string;
        uid: string;
        resourceVersion: string;
        [key: string]: any;
    };
    data?: {
        [key: string]: string;
    };
    binaryData?: {
        [key: string]: string;
    };
    immutable?: boolean;
}

export interface ConfigMapListType {
    apiVersion: string;
    kind: string;
    metadata?: {
        resourceVersion?: string;
        [key: string]: any;
    };
    items: K8sConfigMap[];
}
