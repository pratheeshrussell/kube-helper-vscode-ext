export type KConfig = {
    kind:              string;
    apiVersion:        string;
    preferences:       Preferences;
    clusters:          ClusterElement[];
    users:             UserElement[];
    contexts:          ContextElement[];
    "current-context": string;
}

export type ClusterElement = {
    name:    string;
    cluster: ClusterCluster;
}

export type ClusterCluster = {
    server:                       string;
    "certificate-authority-data": string;
}

export type ContextElement = {
    name:    string;
    context: ContextContext;
}

export type ContextContext = {
    cluster: string;
    user:    string;
}

export type Preferences = any

export type UserElement = {
    name: string;
    user: UserUser;
}

export type UserUser = {
    "client-certificate-data": string;
    "client-key-data":         string;
}


export type KClusterConfig = {
    clusterName: string | undefined;
    server: string | undefined;
    contextName: string;
    user: string | undefined;
    active:boolean;
}
export * from './crd.type';
export * from './cr.type';