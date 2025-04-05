export type RoleListType = {
    apiVersion?: string;
    items?: RoleType[];
    kind?: string;
    metadata?: {
        [key: string]: any;
    };
}

export interface RoleType {
    apiVersion?: string;
    kind?: string;
    metadata?: ObjectMeta;
    rules?: PolicyRule[];
}

export interface ObjectMeta {
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
}

export interface ManagedFieldsEntry {
    apiVersion?: string;
    fieldsType?: string;
    fieldsV1?: FieldsV1;
    manager?: string;
    operation?: string;
    subresource?: string;
    time?: string;
}

// This is a generic representation, update based on your actual structure of FieldsV1
export interface FieldsV1 {
    [key: string]: any;
}

export interface OwnerReference {
    apiVersion: string;
    blockOwnerDeletion?: boolean;
    controller?: boolean;
    kind: string;
    name: string;
    uid: string;
}

export interface PolicyRule {
    apiGroups?: string[];
    nonResourceURLs?: string[];
    resourceNames?: string[];
    resources?: string[];
    verbs: string[]; // Required
}

export type RoleTableItem = {
    name: string;
    namespace: string;
    createdAt: string;
  }