import type { ObjectMeta, LabelSelector } from './pod.type';
import type { PodTemplateSpec } from './replicaset.type';


export type DeploymentCondition = {
  lastTransitionTime?: string;
  lastUpdateTime?: string;
  message?: string;
  reason?: string;
  status: string;
  type: string;
};

export type RollingUpdateDeployment = {
  maxSurge?: string | number;
  maxUnavailable?: string | number;
};

export type DeploymentStrategy = {
  rollingUpdate?: RollingUpdateDeployment;
  type?: 'Recreate' | 'RollingUpdate';
};

export type DeploymentSpec = {
  minReadySeconds?: number;
  paused?: boolean;
  progressDeadlineSeconds?: number;
  replicas?: number;
  revisionHistoryLimit?: number;
  selector: LabelSelector;
  strategy?: DeploymentStrategy;
  template: PodTemplateSpec;
};

export type DeploymentStatus = {
  availableReplicas?: number;
  collisionCount?: number;
  conditions?: DeploymentCondition[];
  observedGeneration?: number;
  readyReplicas?: number;
  replicas?: number;
  unavailableReplicas?: number;
  updatedReplicas?: number;
};

export type DeploymentType = {
  apiVersion?: string;
  kind?: string;
  metadata?: ObjectMeta;
  spec?: DeploymentSpec;
  status?: DeploymentStatus;
};

export type DeploymentListType = {
  apiVersion: string;
  items: DeploymentType[];
  kind: string;
  metadata: {
    [key: string]: any;
  }
};

export type DeploymentTableItem = {
  namespace: string;
  name: string;
  age: string;
  timestamp: string;
  ready: string;
  totalReplicas: string;
  upToDate: string;
  available: string;
  containers: string;
  images: string;
  selector: string;
};