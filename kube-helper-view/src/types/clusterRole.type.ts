export type ClusterRoleListType = {
    apiVersion?: string;
    items?: ClusterRoleType[];
    kind?: string;
    metadata?: {
        [key: string]: any;
    };
}

export type ClusterRoleType = {
    apiVersion: "rbac.authorization.k8s.io/v1";
    kind: "ClusterRole";
    metadata?: ObjectMeta;
    aggregationRule?: AggregationRule;
    rules?: PolicyRule[];
};

type AggregationRule = {
    clusterRoleSelectors?: LabelSelector[];
};

type LabelSelector = {
    matchExpressions?: LabelSelectorRequirement[];
    matchLabels?: Record<string, string>;
};

type LabelSelectorRequirement = {
    key: string;
    operator: string;
    values?: string[];
};

type PolicyRule = {
    apiGroups?: string[];
    nonResourceURLs?: string[];
    resourceNames?: string[];
    resources?: string[];
    verbs: string[]; // Required
};

// Reused types from previous resources (ObjectMeta, OwnerReference, etc.)

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

export type ClusterRoleTableItem = {
    name: string;
    
    createdAt: string;
  }
