export type NamespaceType = {
    apiVersion: string;
    items:      Item[];
    kind:       string;
    metadata:   NamespaceTypeMetadata;
}

export type Item = {
    apiVersion: string;
    kind:       string;
    metadata:   ItemMetadata;
    spec:       Spec;
    status:     Status;
}

export type ItemMetadata = {
    creationTimestamp: string;
    labels:            Labels;
    name:              string;
    resourceVersion:   string;
    uid:               string;
    annotations?:      Annotations;
}

export type Annotations = {
    [key: string]: string;
}

export type Labels = {
    [key: string]: string;
}

export type Spec = {
    finalizers: string[];
}

export type Status = {
    phase: string;
}

export type NamespaceTypeMetadata = {
    resourceVersion: string;
}


export type NamespaceTableItem = {
    name: string;
    status: string;
    age: string;
    timestamp: string;
}