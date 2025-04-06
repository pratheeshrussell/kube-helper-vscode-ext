import type { ObjectMeta, PodSpec, LabelSelector } from './pod.type';

export type PodTemplateSpec = {
  metadata?: ObjectMeta;
  spec?: PodSpec;
};

type ReplicaSetCondition = {
  lastTransitionTime?: string;
  message?: string;
  reason?: string;
  status: string;
  type: string;
};

type ReplicaSetStatus = {
  availableReplicas?: number;
  conditions?: ReplicaSetCondition[];
  fullyLabeledReplicas?: number;
  observedGeneration?: number;
  readyReplicas?: number;
  replicas: number;
};

type ReplicaSetSpec = {
  minReadySeconds?: number;
  replicas?: number;
  selector: LabelSelector;
  template: PodTemplateSpec;
};

export type ReplicaSetType = {
  apiVersion?: string;
  kind?: string;
  metadata?: ObjectMeta;
  spec?: ReplicaSetSpec;
  status?: ReplicaSetStatus;
};

export type ReplicaSetListType = {
    apiVersion: string;
    items:      ReplicaSetType[];
    kind:       string;
    metadata:   {
        [key: string]: any;
    }
}

export type ReplicasetTableItem = {
    namespace: string;
    name: string;
    age: string;
    timestamp: string;

    desired: string;
    current: string;
    ready: string;
    containers  : string;
    images: string;
    selector: string;
}