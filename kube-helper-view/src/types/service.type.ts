export type ServiceListType = {
    items: ServiceType[];
    kind: string;
    apiVersion: string;
    metadata: {
        [key: string]: any;
    }
}
export type ServiceType = {
    apiVersion?: string;
    kind?: string;
    metadata?: ObjectMeta;
    spec?: ServiceSpec;
    status?: ServiceStatus;
  };
  
  type ObjectMeta = {
    annotations?: Record<string, string>;
    creationTimestamp: string;
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
    fieldsV1?: FieldsV1;
    manager?: string;
    operation?: string;
    subresource?: string;
    time?: string;
  };
  
  type FieldsV1 = Record<string, unknown>;
  
  type OwnerReference = {
    apiVersion: string; // Required
    blockOwnerDeletion?: boolean;
    controller?: boolean;
    kind: string; // Required
    name: string; // Required
    uid: string; // Required
  };
  
  type ServiceTypes = "ClusterIP" | "ExternalName" | "LoadBalancer" | "NodePort";
  type ServiceSpec = {
    allocateLoadBalancerNodePorts?: boolean;
    clusterIP?: string;
    clusterIPs?: string[];
    externalIPs?: string[];
    externalName?: string;
    externalTrafficPolicy?: "Cluster" | "Local";
    healthCheckNodePort?: number;
    internalTrafficPolicy?: "Cluster" | "Local";
    ipFamilies?: string[];
    ipFamilyPolicy?: "PreferDualStack" | "RequireDualStack" | "SingleStack";
    loadBalancerClass?: string;
    loadBalancerIP?: string;
    loadBalancerSourceRanges?: string[];
    ports?: ServicePort[];
    publishNotReadyAddresses?: boolean;
    selector?: Record<string, string>;
    sessionAffinity?: "ClientIP" | "None";
    sessionAffinityConfig?: SessionAffinityConfig;
    trafficDistribution?: string;
    type?: ServiceTypes;
  };
  
  type ServicePort = {
    appProtocol?: string;
    name?: string;
    nodePort?: number;
    port: number; // Required
    protocol?: "SCTP" | "TCP" | "UDP";
    targetPort?: IntOrString;
  };
  
  type IntOrString = string | number;
  
  type SessionAffinityConfig = {
    clientIP?: ClientIPConfig;
  };
  
  type ClientIPConfig = {
    timeoutSeconds?: number;
  };
  
  type ServiceStatus = {
    conditions?: Condition[];
    loadBalancer?: LoadBalancerStatus;
  };
  
  type Condition = {
    lastTransitionTime: string; // Required
    message: string; // Required
    observedGeneration?: number;
    reason: string; // Required
    status: string; // Required
    type: string; // Required
  };
  
  type LoadBalancerStatus = {
    ingress?: LoadBalancerIngress[];
  };
  
  type LoadBalancerIngress = {
    hostname?: string;
    ip?: string;
    ipMode?: string;
    ports?: PortStatus[];
  };
  
  type PortStatus = {
    error?: string;
    port: number; // Required
    protocol: "SCTP" | "TCP" | "UDP"; // Required
  };
  


  export type ServiceTableItem = {
      name: string;
      namespace: string;
      type: ServiceTypes | '-' | null;
      clusterIP: string;
      externalIP: string;
      ports: string;
      age: string;
      timestamp: string;

      primaryOwner: {
        name: string;
        kind: string;
    } | null;
      
  }