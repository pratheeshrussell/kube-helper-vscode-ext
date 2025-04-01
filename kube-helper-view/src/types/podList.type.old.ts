export type PodListType = {
    apiVersion: string;
    items:      PodListTypeItem[];
    kind:       string;
    metadata:   PodListTypeMetadata;
}

export type PodListTypeItem = {
    apiVersion: string;
    kind:       string;
    metadata:   ItemMetadata;
    spec:       Spec;
    status:     Status;
}

export type ItemMetadata = {
    creationTimestamp: string;
    generateName:      string;
    labels:            Labels;
    name:              string;
    namespace:         string;
    ownerReferences:   OwnerReference[];
    resourceVersion:   string;
    uid:               string;
}

export type Labels = {
    app:                 string;
    "pod-template-hash": string;
}

export type OwnerReference = {
    apiVersion:         string;
    blockOwnerDeletion: boolean;
    controller:         boolean;
    kind:               string;
    name:               string;
    uid:                string;
}

export type Spec = {
    containers:                    Container[];
    dnsPolicy:                     string;
    enableServiceLinks:            boolean;
    initContainers?:               InitContainer[];
    nodeName:                      string;
    preemptionPolicy:              string;
    priority:                      number;
    restartPolicy:                 string;
    schedulerName:                 string;
    securityContext:               SecurityContext;
    serviceAccount:                string;
    serviceAccountName:            string;
    terminationGracePeriodSeconds: number;
    tolerations:                   Toleration[];
    volumes:                       Volume[];
}

export type Container = {
    command?:                 string[];
    env?:                     Env[];
    image:                    string;
    imagePullPolicy:          string;
    name:                     string;
    ports:                    Port[];
    resources:                SecurityContext;
    terminationMessagePath:   string;
    terminationMessagePolicy: string;
    volumeMounts:             VolumeMount[];
}

export type InitContainer = Container;

export type Env = {
    name:  string;
    value: string;
}

export type Port = {
    containerPort: number;
    protocol:      string;
}

export type SecurityContext = {
    [key:string]:any
}

export type VolumeMount = {
    mountPath:          string;
    name:               string;
    subPath?:           string;
    readOnly?:          boolean;
    recursiveReadOnly?: string;
}

export type Toleration = {
    effect:            string;
    key:               string;
    operator:          string;
    tolerationSeconds: number;
}

export type Volume = {
    configMap?: VolumeConfigMap;
    name:       string;
    projected?: Projected;
}

export type VolumeConfigMap = {
    defaultMode: number;
    name:        string;
}

export type Projected = {
    defaultMode: number;
    sources:     Source[];
}

export type Source = {
    serviceAccountToken?: ServiceAccountToken;
    configMap?:           SourceConfigMap;
    downwardAPI?:         DownwardAPI;
}

export type SourceConfigMap = {
    items: ConfigMapItem[];
    name:  string;
}

export type ConfigMapItem = {
    key:  string;
    path: string;
}

export type DownwardAPI = {
    items: DownwardAPIItem[];
}

export type DownwardAPIItem = {
    fieldRef: FieldRef;
    path:     string;
}

export type FieldRef = {
    apiVersion: string;
    fieldPath:  string;
}

export type ServiceAccountToken = {
    expirationSeconds: number;
    path:              string;
}

export type Status = {
    conditions:             Condition[];
    containerStatuses:      ContainerStatus[];
    hostIP:                 string;
    hostIPs:                IP[];
    initContainerStatuses?: InitContainerStatus[];
    phase:                  string;
    qosClass:               string;
    startTime:              string;
    podIP?:                 string;
    podIPs?:                IP[];
}

export type Condition = {
    lastProbeTime:      null;
    lastTransitionTime: string;
    status:             string;
    type:               string;
    message?:           string;
    reason?:            string;
}

export type ContainerStatus = {
    image:        string;
    imageID:      string;
    lastState:    SecurityContext;
    name:         string;
    ready:        boolean;
    restartCount: number;
    started:      boolean;
    state:        ContainerStatusState;
    volumeMounts: VolumeMount[];
    containerID?: string;
}

export type ContainerStatusState = {
    running?:    Running;
    waiting?:    Waiting;
    terminated?: Terminated;
}


export type Running = {
    startedAt: string;
}

export type Waiting = {
    reason: string;
    message?: string;
}

export type IP = {
    ip: string;
}

export type InitContainerStatus = {
    image:        string;
    imageID:      string;
    lastState:    LastState;
    name:         string;
    ready:        boolean;
    restartCount: number;
    started:      boolean;
    state:        ContainerStatusState;
    volumeMounts: VolumeMount[];
    containerID?: string;
}

export type LastState = {
    terminated?: Terminated;
}

export type Terminated = {
    containerID: string;
    exitCode:    number;
    finishedAt:  string;
    reason:      string;
    startedAt:   string;
}


export type PodListTypeMetadata = {
    resourceVersion: string;
}



export type PodTableItem = {
    namespace: string;
    name: string;
    age: string;
    timestamp: string;

    primaryOwner: {
        name: string;
        kind: string;
    } | null;

    ready:string;
    status: string;
    restarts: string; 
}

export type TableContainerTypes = "container" | "init";
export type ContainerTableItem = {
    name: string;
    image: string;
    type: TableContainerTypes;

    status: string;
    reason: string;
    exitcode?: string;
    
}