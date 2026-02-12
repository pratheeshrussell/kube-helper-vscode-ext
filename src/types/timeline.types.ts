/**
 * Timeline & Event Tracking Types
 */

export interface TimelineEvent {
    id: string;              // Unique UUID
    timestamp: string;       // ISO timestamp
    type: 'EVENT' | 'CHANGE'; // Event from k8s or resource change
    eventType: 'ADDED' | 'MODIFIED' | 'DELETED' | 'WARNING' | 'NORMAL';
    resourceKind: string;    // Pod, Deployment, etc.
    resourceName: string;
    namespace: string;
    message: string;         // Event message
    reason?: string;         // Event reason (e.g., "Pulling", "Started")
    source?: string;         // Event source component
    diff?: TimelineEventDiff;
}

export interface TimelineEventDiff {
    field: string;
    before: any;
    after: any;
}

export interface K8sEvent {
    metadata: {
        name: string;
        namespace: string;
        creationTimestamp: string;
    };
    involvedObject: {
        kind: string;
        name: string;
        namespace: string;
    };
    reason: string;
    message: string;
    type: 'Normal' | 'Warning';
    source?: {
        component?: string;
    };
    firstTimestamp?: string;
    lastTimestamp?: string;
}

export interface WatchEvent<T = any> {
    type: 'ADDED' | 'MODIFIED' | 'DELETED';
    object: T;
}
