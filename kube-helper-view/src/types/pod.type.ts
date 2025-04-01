type Quantity = string;

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

type ManagedFieldsEntry = {
  apiVersion?: string;
  fieldsType?: string;
  fieldsV1?: FieldsV1;
  manager?: string;
  operation?: string;
  subresource?: string;
  time?: string;
};

type FieldsV1 = any; // Placeholder for FieldsV1 type

type OwnerReference = {
  apiVersion: string;
  blockOwnerDeletion?: boolean;
  controller?: boolean;
  kind: string;
  name: string;
  uid: string;
};

type NodeSelectorRequirement = {
  key: string;
  operator: 'DoesNotExist' | 'Exists' | 'Gt' | 'In' | string;
  values?: string[];
};

type NodeSelectorTerm = {
  matchExpressions?: NodeSelectorRequirement[];
  matchFields?: NodeSelectorRequirement[];
};

type NodeSelector = {
  nodeSelectorTerms: NodeSelectorTerm[];
};

type PreferredSchedulingTerm = {
  preference: NodeSelectorTerm;
  weight: number;
};

type NodeAffinity = {
  preferredDuringSchedulingIgnoredDuringExecution?: PreferredSchedulingTerm[];
  requiredDuringSchedulingIgnoredDuringExecution?: NodeSelector;
};

type LabelSelectorRequirement = {
  key: string;
  operator: string;
  values?: string[];
};

type LabelSelector = {
  matchExpressions?: LabelSelectorRequirement[];
  matchLabels?: Record<string, string>;
};

type PodAffinityTerm = {
  labelSelector?: LabelSelector;
  matchLabelKeys?: string[];
  mismatchLabelKeys?: string[];
  namespaceSelector?: LabelSelector;
  namespaces?: string[];
  topologyKey: string;
};

type WeightedPodAffinityTerm = {
  podAffinityTerm: PodAffinityTerm;
  weight: number;
};

type PodAffinity = {
  preferredDuringSchedulingIgnoredDuringExecution?: WeightedPodAffinityTerm[];
  requiredDuringSchedulingIgnoredDuringExecution?: PodAffinityTerm[];
};

type PodAntiAffinity = {
  preferredDuringSchedulingIgnoredDuringExecution?: WeightedPodAffinityTerm[];
  requiredDuringSchedulingIgnoredDuringExecution?: PodAffinityTerm[];
};

type Affinity = {
  nodeAffinity?: NodeAffinity;
  podAffinity?: PodAffinity;
  podAntiAffinity?: PodAntiAffinity;
};

type EnvVarSource = {
  configMapKeyRef?: ConfigMapKeySelector;
  fieldRef?: ObjectFieldSelector;
  resourceFieldRef?: ResourceFieldSelector;
  secretKeyRef?: SecretKeySelector;
};

type ConfigMapKeySelector = {
  key: string;
  name?: string;
  optional?: boolean;
};

type ObjectFieldSelector = {
  apiVersion?: string;
  fieldPath: string;
};

type ResourceFieldSelector = {
  containerName?: string;
  divisor?: Quantity;
  resource: string;
};

type SecretKeySelector = {
  key: string;
  name?: string;
  optional?: boolean;
};

type EnvVar = {
  name: string;
  value?: string;
  valueFrom?: EnvVarSource;
};

type ConfigMapEnvSource = {
  name?: string;
  optional?: boolean;
};

type SecretEnvSource = {
  name?: string;
  optional?: boolean;
};

type EnvFromSource = {
  configMapRef?: ConfigMapEnvSource;
  prefix?: string;
  secretRef?: SecretEnvSource;
};

type ExecAction = {
  command?: string[];
};

type HTTPHeader = {
  name: string;
  value: string;
};

type HTTPGetAction = {
  host?: string;
  httpHeaders?: HTTPHeader[];
  path?: string;
  port: IntOrString;
  scheme?: 'HTTP' | 'HTTPS';
};

type SleepAction = {
  seconds: number;
};

type TCPSocketAction = {
  host?: string;
  port: IntOrString;
};

type LifecycleHandler = {
  exec?: ExecAction;
  httpGet?: HTTPGetAction;
  sleep?: SleepAction;
  tcpSocket?: TCPSocketAction;
};

type Lifecycle = {
  postStart?: LifecycleHandler;
  preStop?: LifecycleHandler;
};

type GRPCAction = {
  port: number;
  service?: string;
};

type Probe = {
  exec?: ExecAction;
  failureThreshold?: number;
  grpc?: GRPCAction;
  httpGet?: HTTPGetAction;
  initialDelaySeconds?: number;
  periodSeconds?: number;
  successThreshold?: number;
  tcpSocket?: TCPSocketAction;
  terminationGracePeriodSeconds?: number;
  timeoutSeconds?: number;
};

type ContainerPort = {
  containerPort: number;
  hostIP?: string;
  hostPort?: number;
  name?: string;
  protocol?: 'SCTP' | 'TCP' | 'UDP';
};

type ContainerResizePolicy = {
  resourceName: string;
  restartPolicy: string;
};

type ResourceClaim = {
  name: string;
  request?: string;
};

type ResourceRequirements = {
  claims?: ResourceClaim[];
  limits?: Record<string, Quantity>;
  requests?: Record<string, Quantity>;
};

type Capabilities = {
  add?: string[];
  drop?: string[];
};

type SELinuxOptions = {
  level?: string;
  role?: string;
  type?: string;
  user?: string;
};

type SeccompProfile = {
  localhostProfile?: string;
  type: 'Localhost' | 'RuntimeDefault' | 'Unconfined';
};

type WindowsSecurityContextOptions = {
  gmsaCredentialSpec?: string;
  gmsaCredentialSpecName?: string;
  hostProcess?: boolean;
  runAsUserName?: string;
};

type AppArmorProfile = {
  localhostProfile?: string;
  type: 'Localhost' | 'RuntimeDefault' | 'Unconfined';
};

type SecurityContext = {
  allowPrivilegeEscalation?: boolean;
  appArmorProfile?: AppArmorProfile;
  capabilities?: Capabilities;
  privileged?: boolean;
  procMount?: 'Default' | 'Unmasked';
  readOnlyRootFilesystem?: boolean;
  runAsGroup?: number;
  runAsNonRoot?: boolean;
  runAsUser?: number;
  seLinuxOptions?: SELinuxOptions;
  seccompProfile?: SeccompProfile;
  windowsOptions?: WindowsSecurityContextOptions;
};

type VolumeDevice = {
  devicePath: string;
  name: string;
};

type VolumeMount = {
  mountPath: string;
  mountPropagation?: 'Bidirectional' | 'HostToContainer' | 'None';
  name: string;
  readOnly?: boolean;
  recursiveReadOnly?: string;
  subPath?: string;
  subPathExpr?: string;
};

export type Container = {
  args?: string[];
  command?: string[];
  env?: EnvVar[];
  envFrom?: EnvFromSource[];
  image?: string;
  imagePullPolicy?: 'Always' | 'IfNotPresent' | 'Never';
  lifecycle?: Lifecycle;
  livenessProbe?: Probe;
  name: string;
  ports?: ContainerPort[];
  readinessProbe?: Probe;
  resizePolicy?: ContainerResizePolicy[];
  resources?: ResourceRequirements;
  restartPolicy?: string;
  securityContext?: SecurityContext;
  startupProbe?: Probe;
  stdin?: boolean;
  stdinOnce?: boolean;
  terminationMessagePath?: string;
  terminationMessagePolicy?: 'FallbackToLogsOnError' | 'File';
  tty?: boolean;
  volumeDevices?: VolumeDevice[];
  volumeMounts?: VolumeMount[];
  workingDir?: string;
};

type PodDNSConfigOption = {
  name?: string;
  value?: string;
};

type PodDNSConfig = {
  nameservers?: string[];
  options?: PodDNSConfigOption[];
  searches?: string[];
};

type EphemeralContainer = Container & {
  targetContainerName?: string;
};

type HostAlias = {
  hostnames?: string[];
  ip: string;
};

type PodOS = {
  name: string;
};

type PodReadinessGate = {
  conditionType: string;
};

type PodResourceClaim = {
  name: string;
  resourceClaimName?: string;
  resourceClaimTemplateName?: string;
};

type PodSchedulingGate = {
  name: string;
};

type Sysctl = {
  name: string;
  value: string;
};

type PodSecurityContext = {
  appArmorProfile?: AppArmorProfile;
  fsGroup?: number;
  fsGroupChangePolicy?: 'Always' | 'OnRootMismatch';
  runAsGroup?: number;
  runAsNonRoot?: boolean;
  runAsUser?: number;
  seLinuxOptions?: SELinuxOptions;
  seccompProfile?: SeccompProfile;
  supplementalGroups?: number[];
  supplementalGroupsPolicy?: 'Merge' | 'Strict';
  sysctls?: Sysctl[];
  windowsOptions?: WindowsSecurityContextOptions;
};

type Toleration = {
  effect?: 'NoExecute' | 'NoSchedule' | 'PreferNoSchedule';
  key?: string;
  operator?: 'Equal' | 'Exists';
  tolerationSeconds?: number;
  value?: string;
};

type TopologySpreadConstraint = {
  labelSelector?: LabelSelector;
  matchLabelKeys?: string[];
  maxSkew: number;
  minDomains?: number;
  nodeAffinityPolicy?: 'Honor' | 'Ignore';
  nodeTaintsPolicy?: 'Honor' | 'Ignore';
  topologyKey: string;
  whenUnsatisfiable: 'DoNotSchedule' | 'ScheduleAnyway';
};

type AWSElasticBlockStoreVolumeSource = {
  fsType?: string;
  partition?: number;
  readOnly?: boolean;
  volumeID: string;
};

type AzureDiskVolumeSource = {
  cachingMode?: 'None' | 'ReadOnly' | 'ReadWrite';
  diskName: string;
  diskURI: string;
  fsType?: string;
  kind?: 'Dedicated' | 'Managed' | 'Shared';
  readOnly?: boolean;
};

type AzureFileVolumeSource = {
  readOnly?: boolean;
  secretName: string;
  shareName: string;
};

type CephFSVolumeSource = {
  monitors: string[];
  path?: string;
  readOnly?: boolean;
  secretFile?: string;
  secretRef?: LocalObjectReference;
  user?: string;
};

type CinderVolumeSource = {
  fsType?: string;
  readOnly?: boolean;
  secretRef?: LocalObjectReference;
  volumeID: string;
};

type KeyToPath = {
  key: string;
  mode?: number;
  path: string;
};

type ConfigMapVolumeSource = {
  defaultMode?: number;
  items?: KeyToPath[];
  name?: string;
  optional?: boolean;
};

type CSIVolumeSource = {
  driver: string;
  fsType?: string;
  nodePublishSecretRef?: LocalObjectReference;
  readOnly?: boolean;
  volumeAttributes?: Record<string, string>;
};

type DownwardAPIVolumeFile = {
  fieldRef?: ObjectFieldSelector;
  mode?: number;
  path: string;
  resourceFieldRef?: ResourceFieldSelector;
};

type DownwardAPIVolumeSource = {
  defaultMode?: number;
  items?: DownwardAPIVolumeFile[];
};

type EmptyDirVolumeSource = {
  medium?: string;
  sizeLimit?: Quantity;
};

type PersistentVolumeClaimSpec = {
  accessModes?: string[];
  dataSource?: TypedLocalObjectReference;
  dataSourceRef?: TypedObjectReference;
  resources?: VolumeResourceRequirements;
  selector?: LabelSelector;
  storageClassName?: string;
  volumeAttributesClassName?: string;
  volumeMode?: 'Block' | 'Filesystem';
  volumeName?: string;
};

type TypedLocalObjectReference = {
  apiGroup?: string;
  kind: string;
  name: string;
};

type TypedObjectReference = {
  apiGroup?: string;
  kind: string;
  name: string;
  namespace?: string;
};

type VolumeResourceRequirements = {
  limits?: Record<string, Quantity>;
  requests?: Record<string, Quantity>;
};

type PersistentVolumeClaimTemplate = {
  metadata?: ObjectMeta;
  spec: PersistentVolumeClaimSpec;
};

type EphemeralVolumeSource = {
  volumeClaimTemplate?: PersistentVolumeClaimTemplate;
};

type FCVolumeSource = {
  fsType?: string;
  lun?: number;
  readOnly?: boolean;
  targetWWNs?: string[];
  wwids?: string[];
};

type FlexVolumeSource = {
  driver: string;
  fsType?: string;
  options?: Record<string, string>;
  readOnly?: boolean;
  secretRef?: LocalObjectReference;
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

type GitRepoVolumeSource = {
  directory?: string;
  repository: string;
  revision?: string;
};

type GlusterfsVolumeSource = {
  endpoints: string;
  path: string;
  readOnly?: boolean;
};

type HostPathVolumeSource = {
  path: string;
  type?: string;
};

type ImageVolumeSource = {
  pullPolicy?: 'Always' | 'IfNotPresent' | 'Never';
  reference?: string;
};

type ISCSIVolumeSource = {
  chapAuthDiscovery?: boolean;
  chapAuthSession?: boolean;
  fsType?: string;
  initiatorName?: string;
  iqn: string;
  iscsiInterface?: string;
  lun: number;
  portals?: string[];
  readOnly?: boolean;
  secretRef?: LocalObjectReference;
  targetPortal: string;
};

type NFSVolumeSource = {
  path: string;
  readOnly?: boolean;
  server: string;
};

type PersistentVolumeClaimVolumeSource = {
  claimName: string;
  readOnly?: boolean;
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

type ClusterTrustBundleProjection = {
  labelSelector?: LabelSelector;
  name?: string;
  optional?: boolean;
  path: string;
  signerName?: string;
};

type ConfigMapProjection = {
  items?: KeyToPath[];
  name?: string;
  optional?: boolean;
};

type DownwardAPIProjection = {
  items?: DownwardAPIVolumeFile[];
};

type SecretProjection = {
  items?: KeyToPath[];
  name?: string;
  optional?: boolean;
};

type ServiceAccountTokenProjection = {
  audience?: string;
  expirationSeconds?: number;
  path: string;
};

type VolumeProjection = {
  clusterTrustBundle?: ClusterTrustBundleProjection;
  configMap?: ConfigMapProjection;
  downwardAPI?: DownwardAPIProjection;
  secret?: SecretProjection;
  serviceAccountToken?: ServiceAccountTokenProjection;
};

type ProjectedVolumeSource = {
  defaultMode?: number;
  sources?: VolumeProjection[];
};

type QuobyteVolumeSource = {
  group?: string;
  readOnly?: boolean;
  registry: string;
  tenant?: string;
  user?: string;
  volume: string;
};

type RBDVolumeSource = {
  fsType?: string;
  image: string;
  keyring?: string;
  monitors: string[];
  pool?: string;
  readOnly?: boolean;
  secretRef?: LocalObjectReference;
  user?: string;
};

type ScaleIOVolumeSource = {
  fsType?: string;
  gateway: string;
  protectionDomain?: string;
  readOnly?: boolean;
  secretRef: LocalObjectReference;
  sslEnabled?: boolean;
  storageMode?: string;
  storagePool?: string;
  system: string;
  volumeName?: string;
};

type SecretVolumeSource = {
  defaultMode?: number;
  items?: KeyToPath[];
  optional?: boolean;
  secretName?: string;
};

type StorageOSVolumeSource = {
  fsType?: string;
  readOnly?: boolean;
  secretRef?: LocalObjectReference;
  volumeName?: string;
  volumeNamespace?: string;
};

type VsphereVirtualDiskVolumeSource = {
  fsType?: string;
  storagePolicyID?: string;
  storagePolicyName?: string;
  volumePath: string;
};

type Volume = {
  awsElasticBlockStore?: AWSElasticBlockStoreVolumeSource;
  azureDisk?: AzureDiskVolumeSource;
  azureFile?: AzureFileVolumeSource;
  cephfs?: CephFSVolumeSource;
  cinder?: CinderVolumeSource;
  configMap?: ConfigMapVolumeSource;
  csi?: CSIVolumeSource;
  downwardAPI?: DownwardAPIVolumeSource;
  emptyDir?: EmptyDirVolumeSource;
  ephemeral?: EphemeralVolumeSource;
  fc?: FCVolumeSource;
  flexVolume?: FlexVolumeSource;
  flocker?: FlockerVolumeSource;
  gcePersistentDisk?: GCEPersistentDiskVolumeSource;
  gitRepo?: GitRepoVolumeSource;
  glusterfs?: GlusterfsVolumeSource;
  hostPath?: HostPathVolumeSource;
  image?: ImageVolumeSource;
  iscsi?: ISCSIVolumeSource;
  name: string;
  nfs?: NFSVolumeSource;
  persistentVolumeClaim?: PersistentVolumeClaimVolumeSource;
  photonPersistentDisk?: PhotonPersistentDiskVolumeSource;
  portworx?: PortworxVolumeSource;
  projected?: ProjectedVolumeSource;
  quobyte?: QuobyteVolumeSource;
  rbd?: RBDVolumeSource;
  scaleIO?: ScaleIOVolumeSource;
  secret?: SecretVolumeSource;
  storageos?: StorageOSVolumeSource;
  vsphereVolume?: VsphereVirtualDiskVolumeSource;
};

type LocalObjectReference = {
  name?: string;
};

type IntOrString = string | number;

type PodCondition = {
  lastProbeTime?: string;
  lastTransitionTime?: string;
  message?: string;
  reason?: string;
  status: string;
  type: string;
};

type ContainerStateRunning = {
  startedAt?: string;
};

type ContainerStateTerminated = {
  containerID?: string;
  exitCode: number;
  finishedAt?: string;
  message?: string;
  reason?: string;
  signal?: number;
  startedAt?: string;
};

type ContainerStateWaiting = {
  message?: string;
  reason?: string;
};

export type ContainerState = {
  running?: ContainerStateRunning;
  terminated?: ContainerStateTerminated;
  waiting?: ContainerStateWaiting;
};

type ResourceHealth = {
  health?: string;
  resourceID: string;
};

type ResourceStatus = {
  name: string;
  resources?: ResourceHealth[];
};

type LinuxContainerUser = {
  gid: number;
  supplementalGroups?: number[];
  uid: number;
};

type ContainerUser = {
  linux?: LinuxContainerUser;
};

type VolumeMountStatus = {
  mountPath: string;
  name: string;
  readOnly?: boolean;
  recursiveReadOnly?: string;
};

export type ContainerStatus = {
  allocatedResources?: Record<string, Quantity>;
  allocatedResourcesStatus?: ResourceStatus[];
  containerID?: string;
  image: string;
  imageID: string;
  lastState?: ContainerState;
  name: string;
  ready: boolean;
  resources?: ResourceRequirements;
  restartCount: number;
  started?: boolean;
  state?: ContainerState;
  user?: ContainerUser;
  volumeMounts?: VolumeMountStatus[];
};

type HostIP = {
  ip: string;
};

type PodIP = {
  ip: string;
};

type PodResourceClaimStatus = {
  name: string;
  resourceClaimName?: string;
};

type PodSpec = {
  activeDeadlineSeconds?: number;
  affinity?: Affinity;
  automountServiceAccountToken?: boolean;
  containers: Container[];
  dnsConfig?: PodDNSConfig;
  dnsPolicy?: 'ClusterFirst' | 'ClusterFirstWithHostNet' | 'Default' | 'None';
  enableServiceLinks?: boolean;
  ephemeralContainers?: EphemeralContainer[];
  hostAliases?: HostAlias[];
  hostIPC?: boolean;
  hostNetwork?: boolean;
  hostPID?: boolean;
  hostUsers?: boolean;
  hostname?: string;
  imagePullSecrets?: LocalObjectReference[];
  initContainers?: Container[];
  nodeName?: string;
  nodeSelector?: Record<string, string>;
  os?: PodOS;
  overhead?: Record<string, Quantity>;
  preemptionPolicy?: 'Never' | 'PreemptLowerPriority';
  priority?: number;
  priorityClassName?: string;
  readinessGates?: PodReadinessGate[];
  resourceClaims?: PodResourceClaim[];
  restartPolicy?: 'Always' | 'Never' | 'OnFailure';
  runtimeClassName?: string;
  schedulerName?: string;
  schedulingGates?: PodSchedulingGate[];
  securityContext?: PodSecurityContext;
  serviceAccount?: string;
  serviceAccountName?: string;
  setHostnameAsFQDN?: boolean;
  shareProcessNamespace?: boolean;
  subdomain?: string;
  terminationGracePeriodSeconds?: number;
  tolerations?: Toleration[];
  topologySpreadConstraints?: TopologySpreadConstraint[];
  volumes?: Volume[];
};

type PodStatus = {
  conditions?: PodCondition[];
  containerStatuses?: ContainerStatus[];
  ephemeralContainerStatuses?: ContainerStatus[];
  hostIP?: string;
  hostIPs?: HostIP[];
  initContainerStatuses?: ContainerStatus[];
  message?: string;
  nominatedNodeName?: string;
  phase?: 'Failed' | 'Pending' | 'Running' | 'Succeeded' | string;
  podIP?: string;
  podIPs?: PodIP[];
  qosClass?: 'BestEffort' | 'Burstable' | 'Guaranteed';
  reason?: string;
  resize?: string;
  resourceClaimStatuses?: PodResourceClaimStatus[];
  startTime?: string;
};

export type PodType = {
  apiVersion?: string;
  kind?: string;
  metadata?: ObjectMeta;
  spec?: PodSpec;
  status?: PodStatus;
};

