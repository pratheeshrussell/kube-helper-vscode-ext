export type RoleBindListType = {
    apiVersion?: string;
    items?: RoleBindingType[];
    kind?: string;
    metadata?: {
        [key: string]: any;
    };
}

export type RoleBindingType = {
    apiVersion?: string;
    kind?: string;
    metadata?: ObjectMeta;
    roleRef: RoleRef;
    subjects?: Subject[];
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
  
  // Simplified; actual FieldsV1 is deeply structured but varies
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
  
  export type RoleRef = {
    apiGroup: string;
    kind: string;
    name: string;
  };
  
  export type Subject = {
    apiGroup?: string;
    kind: string;
    name: string;
    namespace?: string;
  };
  

export type RoleBindTableItem = {
    name: string;
    namespace: string;
    
    age: string;
    timestamp: string;

    roleref: {
        kind: string;
        name: string;
    }
    users: string;
    groups: string;
  }