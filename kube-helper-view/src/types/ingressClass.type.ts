export type IngressClassListType = {
    apiVersion?: string;
    items?: IngressClassType[];
    kind?: string;
    metadata?: {
        [key: string]: any;
    };
}
export type IngressClassType = {
    apiVersion: "networking.k8s.io/v1";
    kind: "IngressClass";
    metadata?: ObjectMeta;
    spec?: IngressClassSpec;
};

type IngressClassSpec = {
    controller?: string;
    parameters?: IngressClassParametersReference;
};

type IngressClassParametersReference = {
    apiGroup?: string;
    kind: string;
    name: string;
    namespace?: string;
    scope?: string;
};

// Shared types

type ObjectMeta = {
    annotations?: Record<string, string>;
    creationTimestamp?: string;
    deletionGracePeriodSeconds?: number;
    deletionTimestamp?: string;
    finalizers?: string[];
    generateName?: string;
    generation?: number;
    labels?: Record<string, string>;
    managedFields?: ManagedFieldsEntry[];
    name?: string;
    namespace?: string;
    ownerReferences?: OwnerReference[];
    resourceVersion?: string;
    selfLink?: string;
    uid?: string;
};

type ManagedFieldsEntry = {
    apiVersion?: string;
    fieldsType?: string;
    fieldsV1?: any;
    manager?: string;
    operation?: string;
    subresource?: string;
    time?: string;
};

type OwnerReference = {
    apiVersion: string;
    blockOwnerDeletion?: boolean;
    controller?: boolean;
    kind: string;
    name: string;
    uid: string;
};

export type IngressClassTableItem = {
    name: string;
    controller: string;
    parameters: string;
    age: string;
    timestamp: string;
  }