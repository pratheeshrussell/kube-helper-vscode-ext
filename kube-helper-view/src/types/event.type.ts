export type EventListType = {
    items: Event[];
    kind: string;
    apiVersion: string;
    metadata: {
        [key: string]: any;
    }
}

export type EventType = {
    action?: string;
    apiVersion?: string;
    count?: number;
    eventTime?: string;
    firstTimestamp?: string;
    involvedObject?: InvolvedObject;
    kind?: string;
    lastTimestamp?: string;
    message?: string;
    metadata?: Metadata;
    reason?: string;
    related?: RelatedObject;
    reportingComponent?: string;
    reportingInstance?: string;
    series?: EventSeries;
    source?: EventSource;
    type?: string;
  };
  
  type InvolvedObject = {
    apiVersion?: string;
    fieldPath?: string;
    kind?: string;
    name?: string;
    namespace?: string;
    resourceVersion?: string;
    uid?: string;
  };
  
  type Metadata = {
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
    fieldsV1?: Record<string, unknown>;
    manager?: string;
    operation?: string;
    subresource?: string;
    time?: string;
  };
  
  type OwnerReference = {
    apiVersion?: string;
    blockOwnerDeletion?: boolean;
    controller?: boolean;
    kind?: string;
    name?: string;
    uid?: string;
  };
  
  type RelatedObject = {
    apiVersion?: string;
    fieldPath?: string;
    kind?: string;
    name?: string;
    namespace?: string;
    resourceVersion?: string;
    uid?: string;
  };
  
  type EventSeries = {
    count?: number;
    lastObservedTime?: string;
  };
  
  type EventSource = {
    component?: string;
    host?: string;
  };
  

  export type EventTableItem = {
    lastSeen: string;
    lastTimestamp: string;
    type: string;
    reason: string;
    object: string;
    message: string;
    namespace: string;
  }