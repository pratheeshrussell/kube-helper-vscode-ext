export type ClusterRoleBindListType = {
    apiVersion?: string;
    items?: ClusterRoleBindType[];
    kind?: string;
    metadata?: {
        [key: string]: any;
    };
}

export type ClusterRoleBindType = {
    apiVersion: "rbac.authorization.k8s.io/v1";
    kind: "ClusterRoleBinding";
    metadata?: ObjectMeta;
    roleRef: RoleRef;
    subjects?: Subject[];
};

type RoleRef = {
    apiGroup: string;
    kind: string;
    name: string;
};

type Subject = {
    apiGroup?: string;
    kind: string;
    name: string;
    namespace?: string;
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


export type ClusterRoleBindTableItem = {
    name: string;
    
    age: string;
    timestamp: string;

    roleref: {
        kind: string;
        name: string;
    }
    users: string;
    groups: string;
  }