/**
 * Timeline & Event Tracking Types for Frontend
 */

export interface TimelineEvent {
    id: string;
    timestamp: string;
    type: 'EVENT' | 'CHANGE';
    eventType: 'ADDED' | 'MODIFIED' | 'DELETED' | 'WARNING' | 'NORMAL';
    resourceKind: string;
    resourceName: string;
    namespace: string;
    message: string;
    reason?: string;
    source?: string;
    diff?: TimelineEventDiff;
}

export interface TimelineEventDiff {
    field: string;
    before: any;
    after: any;
}

export interface TimelineFilter {
    warningOnly: boolean;
    resourceKinds: string[];
    namespaces: string[];
    searchText: string;
}
