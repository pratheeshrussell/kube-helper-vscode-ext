export type SecretListType = {
    apiVersion?: string;
    items?: SecretType[];
    kind?: string;
    metadata?: {
        [key: string]: any;
    };    
}

export type SecretType = {
    apiVersion?: string;
    data?: Record<string, string>;
    immutable?: boolean;
    kind?: string;
    metadata?: ObjectMeta;
    stringData?: Record<string, string>;
    type?: string;
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
  

  export type SecretTableItem = {
    uid: string; // Added for unique key
    age: string;
    timestamp: string;
    name: string;
    namespace: string;
    dataCount: number;
    type: string;
  }

  export type SecretDataTableItem = {
    key: string;
    value: string;
  }