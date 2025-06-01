// Based on kubectl explain crd --recursive
export interface KubeCustomResourceDefinitionCondition {
    lastTransitionTime?: string;
    message?: string;
    reason?: string;
    status: string;
    type: string;
}

export interface KubeCustomResourceDefinitionNames {
    categories?: string[];
    kind: string;
    listKind?: string;
    plural: string;
    shortNames?: string[];
    singular?: string;
}

export interface KubeCustomResourceValidation {
    openAPIV3Schema?: KubeJSONSchemaProps;
}

export interface KubeJSONSchemaProps {
    // This is a simplified version, as a full JSON schema can be very complex.
    // For actual validation, a more complete definition would be needed.
    type?: string;
    description?: string;
    properties?: { [key: string]: KubeJSONSchemaProps };
    items?: KubeJSONSchemaProps;
    required?: string[];
    format?: string;
    // Allow any other properties for extensibility
    [key: string]: any;
}

export interface KubeCustomResourceDefinitionVersion {
    additionalPrinterColumns?: {
        description?: string;
        jsonPath: string;
        name: string;
        type: string;
        format?: string;
        priority?: number;
    }[];
    deprecated?: boolean;
    deprecationWarning?: string;
    name: string;
    schema?: KubeCustomResourceValidation;
    served: boolean;
    storage: boolean;
    subresources?: {
        scale?: {
            labelSelectorPath?: string;
            specReplicasPath: string;
            statusReplicasPath: string;
        };
        status?: object; // Define more specifically if needed
    };
}

export interface KubeCustomResourceDefinitionSpec {
    conversion?: {
        strategy: string; // 'None' or 'Webhook'
        webhook?: {
            clientConfig?: {
                caBundle?: string; // base64 encoded
                service?: {
                    name: string;
                    namespace: string;
                    path?: string;
                    port?: number;
                };
                url?: string;
            };
            conversionReviewVersions: string[];
        };
    };
    group: string;
    names: KubeCustomResourceDefinitionNames;
    preserveUnknownFields?: boolean;
    scope: 'Namespaced' | 'Cluster';
    versions: KubeCustomResourceDefinitionVersion[];
}

export interface KubeCustomResourceDefinitionStatus {
    acceptedNames?: KubeCustomResourceDefinitionNames;
    conditions?: KubeCustomResourceDefinitionCondition[];
    storedVersions?: string[];
}

export interface KubeCustomResourceDefinition {
    apiVersion: string; // Typically "apiextensions.k8s.io/v1"
    kind: 'CustomResourceDefinition';
    metadata: {
        name: string;
        uid?: string;
        resourceVersion?: string;
        generation?: number;
        creationTimestamp?: string;
        annotations?: { [key: string]: string };
        labels?: { [key: string]: string };
        [key: string]: any; // Allow other metadata fields
    };
    spec: KubeCustomResourceDefinitionSpec;
    status?: KubeCustomResourceDefinitionStatus;
}

export interface KubeCRDList {
    apiVersion: string; // Typically "apiextensions.k8s.io/v1"
    kind: 'CustomResourceDefinitionList';
    metadata: {
        resourceVersion?: string;
        continue?: string;
    };
    items: KubeCustomResourceDefinition[];
}
