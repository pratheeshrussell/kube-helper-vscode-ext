export type ResourceData = {
    name: string;
    namespace: string;
    reason: string;
    message: string;
}

export type PodStatData = {
    failed?: ResourceData[];
    pending?: ResourceData[];
}

export type PodStats = {
    total: number; running: number;
    failed: number; pending: number; data: PodStatData
}
export type NodeStats = { total: number; ready: number; notReady: number; }
export type DeployStats = { total: number; ready: number; failed: number; }
export type ServiceStats = { total: number; }
