import type { PodType, Container as PodContainer, ContainerStatus as PodContainerStatus ,ContainerState} from "./pod.type";

export type PodListType = {
    apiVersion: string;
    items:      PodListTypeItem[];
    kind:       string;
    metadata:   {
        [key: string]: any;
    }
}

export type PodListTypeItem = PodType;
export type Container = PodContainer;
export type ContainerStatus = PodContainerStatus;
export type ContainerStatusState = ContainerState;

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