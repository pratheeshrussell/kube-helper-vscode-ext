export type SCListType = {
    apiVersion?: string;
    items?: StorageClass[];
    kind?: string;
    metadata?: {
        [key: string]: any;
    };    
}

export type StorageClass = {
    allowVolumeExpansion?: boolean;
    allowedTopologies?: TopologySelectorTerm[];
    apiVersion?: string;
    kind?: string;
    metadata?: ObjectMeta;
    mountOptions?: string[];
    parameters?: Record<string, string>;
    provisioner: string;
    reclaimPolicy?: "Delete" | "Recycle" | "Retain";
    volumeBindingMode?: "Immediate" | "WaitForFirstConsumer";
  };
  
  // Defines topology selection criteria for a StorageClass
  type TopologySelectorTerm = {
    matchLabelExpressions?: TopologySelectorLabelRequirement[];
  };
  
  // Defines key-value constraints for topology selection
  type TopologySelectorLabelRequirement = {
    key: string;
    values: string[];
  };
  
  // Metadata for Kubernetes objects
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
  
  // Managed fields metadata
  type ManagedFieldsEntry = {
    apiVersion?: string;
    fieldsType?: string;
    fieldsV1?: FieldsV1;
    manager?: string;
    operation?: string;
    subresource?: string;
    time?: string;
  };
  
  // Owner reference metadata
  type OwnerReference = {
    apiVersion: string;
    blockOwnerDeletion?: boolean;
    controller?: boolean;
    kind: string;
    name: string;
    uid: string;
  };
  
  // Placeholder for FieldsV1 (used in managedFields)
  type FieldsV1 = Record<string, any>;
  

  export type SCTableItem = {
    name: string;
    provisioner: string;
    reclaimPolicy: string;
    volBindingMode: string;
    allowVolumeExpansion: string;
    age: string;
    timestamp: string;
  }