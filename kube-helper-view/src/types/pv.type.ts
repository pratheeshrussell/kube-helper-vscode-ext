export type PVListType = {
    apiVersion?: string;
    items?: PersistentVolume[];
    kind?: string;
    metadata?: {
        [key: string]: any;
    };    
}

export type PersistentVolume = {
    apiVersion?: string;
    kind?: string;
    metadata?: ObjectMeta;
    spec?: PersistentVolumeSpec;
    status?: PersistentVolumeStatus;
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
    fieldsV1?: Record<string, any>;
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
  
  // PersistentVolume specification
  type PersistentVolumeSpec = {
    accessModes?: string[];
    awsElasticBlockStore?: AWSElasticBlockStoreVolumeSource;
    azureDisk?: AzureDiskVolumeSource;
    azureFile?: AzureFilePersistentVolumeSource;
    capacity?: Record<string, string>;
    cephfs?: CephFSPersistentVolumeSource;
    cinder?: CinderPersistentVolumeSource;
    claimRef?: ObjectReference;
    csi?: CSIPersistentVolumeSource;
    fc?: FCVolumeSource;
    flexVolume?: FlexPersistentVolumeSource;
    flocker?: FlockerVolumeSource;
    gcePersistentDisk?: GCEPersistentDiskVolumeSource;
    glusterfs?: GlusterfsPersistentVolumeSource;
    hostPath?: HostPathVolumeSource;
    iscsi?: ISCSIPersistentVolumeSource;
    local?: LocalVolumeSource;
    mountOptions?: string[];
    nfs?: NFSVolumeSource;
    nodeAffinity?: VolumeNodeAffinity;
    persistentVolumeReclaimPolicy?: "Delete" | "Recycle" | "Retain";
    photonPersistentDisk?: PhotonPersistentDiskVolumeSource;
    portworxVolume?: PortworxVolumeSource;
    quobyte?: QuobyteVolumeSource;
    rbd?: RBDPersistentVolumeSource;
    scaleIO?: ScaleIOPersistentVolumeSource;
    storageClassName?: string;
    storageos?: StorageOSPersistentVolumeSource;
    volumeAttributesClassName?: string;
    volumeMode?: "Block" | "Filesystem";
    vsphereVolume?: VsphereVirtualDiskVolumeSource;
  };
  
  // PersistentVolume status
  type PersistentVolumeStatus = {
    lastPhaseTransitionTime?: string;
    message?: string;
    phase?: "Available" | "Bound" | "Failed" | "Pending";
    reason?: string;
  };
  
  // Example volume sources (simplified)
  type AWSElasticBlockStoreVolumeSource = {
    fsType?: string;
    partition?: number;
    readOnly?: boolean;
    volumeID: string;
  };
  
  type AzureDiskVolumeSource = {
    cachingMode?: "None" | "ReadOnly" | "ReadWrite";
    diskName: string;
    diskURI: string;
    fsType?: string;
    kind?: "Dedicated" | "Managed" | "Shared";
    readOnly?: boolean;
  };
  
  type AzureFilePersistentVolumeSource = {
    readOnly?: boolean;
    secretName: string;
    secretNamespace?: string;
    shareName: string;
  };
  
  type CephFSPersistentVolumeSource = {
    monitors: string[];
    path?: string;
    readOnly?: boolean;
    secretFile?: string;
    secretRef?: SecretReference;
    user?: string;
  };
  
  type CinderPersistentVolumeSource = {
    fsType?: string;
    readOnly?: boolean;
    secretRef?: SecretReference;
    volumeID: string;
  };
  
  type CSIPersistentVolumeSource = {
    controllerExpandSecretRef?: SecretReference;
    controllerPublishSecretRef?: SecretReference;
    driver: string;
    fsType?: string;
    nodeExpandSecretRef?: SecretReference;
    nodePublishSecretRef?: SecretReference;
    nodeStageSecretRef?: SecretReference;
    readOnly?: boolean;
    volumeAttributes?: Record<string, string>;
    volumeHandle: string;
  };
  
  type FCVolumeSource = {
    fsType?: string;
    lun?: number;
    readOnly?: boolean;
    targetWWNs?: string[];
    wwids?: string[];
  };
  
  type FlexPersistentVolumeSource = {
    driver: string;
    fsType?: string;
    options?: Record<string, string>;
    readOnly?: boolean;
    secretRef?: SecretReference;
  };
  
  type FlockerVolumeSource = {
    datasetName?: string;
    datasetUUID?: string;
  };
  
  type GCEPersistentDiskVolumeSource = {
    fsType?: string;
    partition?: number;
    pdName: string;
    readOnly?: boolean;
  };
  
  type GlusterfsPersistentVolumeSource = {
    endpoints: string;
    endpointsNamespace?: string;
    path: string;
    readOnly?: boolean;
  };
  
  type HostPathVolumeSource = {
    path: string;
    type?: string;
  };
  
  type ISCSIPersistentVolumeSource = {
    chapAuthDiscovery?: boolean;
    chapAuthSession?: boolean;
    fsType?: string;
    initiatorName?: string;
    iqn: string;
    iscsiInterface?: string;
    lun: number;
    portals?: string[];
    readOnly?: boolean;
    secretRef?: SecretReference;
    targetPortal: string;
  };
  
  type LocalVolumeSource = {
    fsType?: string;
    path: string;
  };
  
  type NFSVolumeSource = {
    path: string;
    readOnly?: boolean;
    server: string;
  };
  
  type PhotonPersistentDiskVolumeSource = {
    fsType?: string;
    pdID: string;
  };
  
  type PortworxVolumeSource = {
    fsType?: string;
    readOnly?: boolean;
    volumeID: string;
  };
  
  type QuobyteVolumeSource = {
    group?: string;
    readOnly?: boolean;
    registry: string;
    tenant?: string;
    user?: string;
    volume: string;
  };
  
  type RBDPersistentVolumeSource = {
    fsType?: string;
    image: string;
    keyring?: string;
    monitors: string[];
    pool?: string;
    readOnly?: boolean;
    secretRef?: SecretReference;
    user?: string;
  };
  
  type ScaleIOPersistentVolumeSource = {
    fsType?: string;
    gateway: string;
    protectionDomain?: string;
    readOnly?: boolean;
    secretRef: SecretReference;
    sslEnabled?: boolean;
    storageMode?: string;
    storagePool?: string;
    system: string;
    volumeName?: string;
  };
  
  type StorageOSPersistentVolumeSource = {
    fsType?: string;
    readOnly?: boolean;
    secretRef?: ObjectReference;
    volumeName?: string;
    volumeNamespace?: string;
  };
  
  type VsphereVirtualDiskVolumeSource = {
    fsType?: string;
    storagePolicyID?: string;
    storagePolicyName?: string;
    volumePath: string;
  };
  
  // Node Affinity
  type VolumeNodeAffinity = {
    required?: NodeSelector;
  };
  
  type NodeSelector = {
    nodeSelectorTerms: NodeSelectorTerm[];
  };
  
  type NodeSelectorTerm = {
    matchExpressions?: NodeSelectorRequirement[];
    matchFields?: NodeSelectorRequirement[];
  };
  
  type NodeSelectorRequirement = {
    key: string;
    operator: "DoesNotExist" | "Exists" | "Gt" | "In";
    values?: string[];
  };
  
  // Secret reference
  type SecretReference = {
    name?: string;
    namespace?: string;
  };
  
  // Object reference
  type ObjectReference = {
    apiVersion?: string;
    fieldPath?: string;
    kind?: string;
    name?: string;
    namespace?: string;
    resourceVersion?: string;
    uid?: string;
  };
  

  export type PVTableItem = {
    name: string;
    capacity: string;
    accessModes: string;
    
    persistentVolumeReclaimPolicy: string;
    storageClassName: string;
    status: string;
    claim: string;
    reason: string;
    volAttributionClass: string;
    
    namespace: string;
    age: string;
    timestamp: string;
  }