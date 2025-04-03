export type IngressListType = {
    apiVersion?: string;
    items?: Ingress[];
    kind?: string;
    metadata?: {
        [key: string]: any;
    };    
}

export type Ingress = {
    apiVersion: "networking.k8s.io/v1";
    kind: "Ingress";
    metadata?: ObjectMeta;
    spec?: IngressSpec;
    status?: IngressStatus;
  };
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
  
  type IngressSpec = {
    defaultBackend?: IngressBackend;
    ingressClassName?: string;
    rules?: IngressRule[];
    tls?: IngressTLS[];
  };
  
  type IngressBackend = {
    resource?: TypedLocalObjectReference;
    service?: IngressServiceBackend;
  };
  
  type TypedLocalObjectReference = {
    apiGroup?: string;
    kind: string;
    name: string;
  };
  
  type IngressServiceBackend = {
    name: string;
    port?: ServiceBackendPort;
  };
  
  type ServiceBackendPort = {
    name?: string;
    number?: number;
  };
  
  type IngressRule = {
    host?: string;
    http?: HTTPIngressRuleValue;
  };
  
  type HTTPIngressRuleValue = {
    paths: HTTPIngressPath[];
  };
  
  type HTTPIngressPath = {
    backend: IngressBackend;
    path?: string;
    pathType: "Exact" | "ImplementationSpecific" | "Prefix";
  };
  
  type IngressTLS = {
    hosts?: string[];
    secretName?: string;
  };
  
  type IngressStatus = {
    loadBalancer?: IngressLoadBalancerStatus;
  };
  
  type IngressLoadBalancerStatus = {
    ingress?: IngressLoadBalancerIngress[];
  };
  
  type IngressLoadBalancerIngress = {
    hostname?: string;
    ip?: string;
    ports?: IngressPortStatus[];
  };
  
  type IngressPortStatus = {
    error?: string;
    port: number;
    protocol: "SCTP" | "TCP" | "UDP";
  };
  
  export type IngressTableItem = {
    name: string;
    class: string;
    hosts: string;
    
    address: string;
    ports: string;
    
    namespace: string;
    age: string;
    timestamp: string;
  }