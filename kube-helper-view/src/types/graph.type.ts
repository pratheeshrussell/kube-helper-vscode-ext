export interface VisNode {
    id: string;
    label: string;
    shape: string;
    resourceType: string;
}

export interface VisEdge {
    id?: string | number;
    from: string;
    to: string;
    arrows: string;
}

export interface K8sResource {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace: string;
        labels?: Record<string, string>;
        ownerReferences?: {
            kind: string;
            name: string;
        }[];
    };
    spec: any;
}

export interface K8sResourceList {
    apiVersion: string;
    kind: string;
    items: K8sResource[];
}
