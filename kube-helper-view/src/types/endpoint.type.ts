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
  
  type EndpointSubset = {
    addresses?: EndpointAddress[];
    notReadyAddresses?: EndpointAddress[];
    ports?: EndpointPort[];
  };
  
  type EndpointAddress = {
    hostname?: string;
    ip: string;
    nodeName?: string;
    targetRef?: ObjectReference;
  };
  
  type ObjectReference = {
    apiVersion?: string;
    fieldPath?: string;
    kind?: string;
    name?: string;
    namespace?: string;
    resourceVersion?: string;
    uid?: string;
  };
  
  type EndpointPort = {
    appProtocol?: string;
    name?: string;
    port: number;
    protocol?: "SCTP" | "TCP" | "UDP";
  };
  
 export type Endpoints = {
    apiVersion: "v1";
    kind: "Endpoints";
    metadata?: ObjectMeta;
    subsets?: EndpointSubset[];
  };
  
  export type EndpointsListType = {
      apiVersion?: string;
      items?: Endpoints[];
      kind?: string;
      metadata?: {
          [key: string]: any;
      };    
  }

  export type EndpointsTableItem = {
    name: string;
    namespace: string;
    endpoints: string;
    timestamp: string;
  }