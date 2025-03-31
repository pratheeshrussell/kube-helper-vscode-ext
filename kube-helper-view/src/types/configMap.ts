export type ConfigMapListType = {
    apiVersion?: string;
    items?: ConfigMapType[];
    kind?: string;
    metadata?: {
        [key: string]: any;
    };    
}

export type ConfigMapType = {
    apiVersion?: string;
    binaryData?: Record<string, string>;
    data?: Record<string, string>;
    immutable?: boolean;
    kind?: string;
    metadata?: ObjectMeta;
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

  export type ConfigMapTableItem = {
    age: string;
    timestamp: string;
    name: string;
    dataCount: number;
    namespace: string;
  }
  
  export type ConfigMapDataTableItem = {
    key: string;
    value: string;
  }