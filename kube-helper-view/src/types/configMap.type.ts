export interface ConfigMapTableItem {
    namespace: string;
    name: string;
    age: string;
    dataCount: number; // Number of data entries in the ConfigMap
    // Potentially other fields if needed from the list view
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
        [key: string]: any; // Other metadata fields
    };
    data?: {
        [key: string]: string;
    };
    binaryData?: {
        [key: string]: string; // Base64 encoded binary data
    };
    // Potentially immutable field
    immutable?: boolean;
}

export interface ConfigMapListType {
    apiVersion: string;
    kind: string;
    metadata: {
        resourceVersion: string;
    };
    items: K8sConfigMap[];
}
