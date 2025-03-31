export type PVCListType = {
    apiVersion?: string;
    items?: PersistentVolumeClaim[];
    kind?: string;
    metadata?: {
        [key: string]: any;
    };    
}

export type PersistentVolumeClaim = {
    apiVersion?: string;
    kind?: string;
    metadata?: ObjectMeta;
    spec?: PersistentVolumeClaimSpec;
    status?: PersistentVolumeClaimStatus;
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
  
  // PersistentVolumeClaim specification
  type PersistentVolumeClaimSpec = {
    accessModes?: string[];
    dataSource?: TypedLocalObjectReference;
    dataSourceRef?: TypedObjectReference;
    resources?: VolumeResourceRequirements;
    selector?: LabelSelector;
    storageClassName?: string;
    volumeAttributesClassName?: string;
    volumeMode?: "Block" | "Filesystem";
    volumeName?: string;
  };
  
  // Reference to an API object within the same namespace
  type TypedLocalObjectReference = {
    apiGroup?: string;
    kind: string;
    name: string;
  };
  
  // Reference to an API object across different namespaces
  type TypedObjectReference = {
    apiGroup?: string;
    kind: string;
    name: string;
    namespace?: string;
  };
  
  // Resource requirements for the volume
  type VolumeResourceRequirements = {
    limits?: Record<string, string>;
    requests?: Record<string, string>;
  };
  
  // Label selector for volume selection
  type LabelSelector = {
    matchExpressions?: LabelSelectorRequirement[];
    matchLabels?: Record<string, string>;
  };
  
  // Label selector conditions
  type LabelSelectorRequirement = {
    key: string;
    operator: string;
    values?: string[];
  };
  
  // PersistentVolumeClaim status
  type PersistentVolumeClaimStatus = {
    accessModes?: string[];
    allocatedResourceStatuses?: Record<string, string>;
    allocatedResources?: Record<string, string>;
    capacity?: Record<string, string>;
    conditions?: PersistentVolumeClaimCondition[];
    currentVolumeAttributesClassName?: string;
    modifyVolumeStatus?: ModifyVolumeStatus;
    phase?: "Bound" | "Lost" | "Pending";
  };
  
  // Conditions affecting the PVC
  type PersistentVolumeClaimCondition = {
    lastProbeTime?: string;
    lastTransitionTime?: string;
    message?: string;
    reason?: string;
    status: string;
    type: string;
  };
  
  // Modification status of the PVC volume
  type ModifyVolumeStatus = {
    status: "InProgress" | "Infeasible" | "Pending";
    targetVolumeAttributesClassName?: string;
  };
  
  export type PVCTableItem = {
    namespace: string;
    name: string;
    status: string;
    volume: string;
    capacity: string;
    accessModes: string; 
    
    storageClassName: string;
    volAttributionClass: string;

    age: string;
    timestamp: string;
  }