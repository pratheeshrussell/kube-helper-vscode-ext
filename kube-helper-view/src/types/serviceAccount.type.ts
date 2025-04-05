export type ServiceAccountListType = {
    items: ServiceAccountType[];
    kind: string;
    apiVersion: string;
    metadata: {
        [key: string]: any;
    }
}
export type ServiceAccountType = {
    apiVersion?: string;
    kind?: string;
    metadata?: ObjectMeta;
    automountServiceAccountToken?: boolean;
    imagePullSecrets?: LocalObjectReference[];
    secrets?: ObjectReference[];
};

export type LocalObjectReference = {
    name?: string;
};

export type ObjectReference = {
    apiVersion?: string;
    fieldPath?: string;
    kind?: string;
    name?: string;
    namespace?: string;
    resourceVersion?: string;
    uid?: string;
};

export type ObjectMeta = {
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

export type ManagedFieldsEntry = {
    apiVersion?: string;
    fieldsType?: string;
    fieldsV1?: FieldsV1;
    manager?: string;
    operation?: string;
    subresource?: string;
    time?: string;
};

export type FieldsV1 = {
    [key: string]: any;
};

export type OwnerReference = {
    apiVersion: string;
    blockOwnerDeletion?: boolean;
    controller?: boolean;
    kind: string;
    name: string;
    uid: string;
};

export type ServiceAccountTableItem = {
    name: string;
    namespace: string;

    imagePullSecrets: string;
    secretsCount: string;

    timestamp: string;
    age: string;
}