export type ClusterNodeType = {
    apiVersion: string;
    items:      Item[];
    kind:       string;
    metadata:   ClusterNodeTypeMetadata;
}

export type Item = {
    apiVersion: string;
    kind:       string;
    metadata:   ItemMetadata;
    spec:       Spec;
    status:     Status;
}

export type ItemMetadata = {
    annotations:       Annotations;
    creationTimestamp: string;
    labels:            Labels;
    name:              string;
    resourceVersion:   string;
    uid:               string;
}

export type Annotations = {
    [key:string]: string;
}

export type Labels = {
    [key:string]: string;
}

export type Spec = {
    podCIDR:    string;
    podCIDRs:   string[];
    providerID: string;
}

export type Status = {
    addresses:       Address[];
    allocatable:     Allocatable;
    capacity:        Allocatable;
    conditions:      Condition[];
    daemonEndpoints: DaemonEndpoints;
    images:          Image[];
    nodeInfo:        NodeInfo;
}

export type Address = {
    address: string;
    type:    string;
}

export type Allocatable = {
    cpu:                 string;
    "ephemeral-storage": string;
    "hugepages-1Gi":     string;
    "hugepages-2Mi":     string;
    memory:              string;
    pods:                string;
}

export type Condition = {
    lastHeartbeatTime:  Date;
    lastTransitionTime: Date;
    message:            string;
    reason:             string;
    status:             string;
    type:               string;
}

export type DaemonEndpoints = {
    kubeletEndpoint: KubeletEndpoint;
}

export type KubeletEndpoint = {
    Port: number;
}

export type Image = {
    names:     string[];
    sizeBytes: number;
}

export type NodeInfo = {
    architecture:            string;
    bootID:                  string;
    containerRuntimeVersion: string;
    kernelVersion:           string;
    kubeProxyVersion:        string;
    kubeletVersion:          string;
    machineID:               string;
    operatingSystem:         string;
    osImage:                 string;
    systemUUID:              string;
}

export type ClusterNodeTypeMetadata = {
    resourceVersion: string;
}

export type ClusterNodeTableData = {
    name: string;
    status: string;
    roles: string;
    age: string;
    timestamp: string;
    version: string;
    internalIp: string;
    externalIp: string;
    osImage: string;
    kernelVersion: string;
    containerRuntime: string;

    // kubeletVersion: string;
    // kubeProxyVersion: string;
    // architecture: string;
    // kubeletEndpoint: string;
    // nodeInfo: string;
}
