/**
 * Timeline Event Formatting Utilities
 */
import type { TimelineEvent, TimelineEventDiff } from '../types/timeline.types';

/**
 * Format timestamp to relative time (e.g., "2m ago")
 */
export function formatTimestamp(timestamp: string): string {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffMs = now.getTime() - eventTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else {
        return `${diffDays}d ago`;
    }
}

/**
 * Get icon for event type
 */
export function getEventIcon(eventType: string): string {
    switch (eventType) {
        case 'WARNING':
            return '⚠️';
        case 'NORMAL':
            return '✅';
        case 'ADDED':
            return '➕';
        case 'MODIFIED':
            return '📝';
        case 'DELETED':
            return '🗑️';
        default:
            return '📦';
    }
}

/**
 * Get severity for PrimeVue Tag component
 */
export function getEventSeverity(eventType: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (eventType) {
        case 'WARNING':
            return 'warn';
        case 'NORMAL':
            return 'success';
        case 'ADDED':
            return 'info';
        case 'MODIFIED':
            return 'info';
        case 'DELETED':
            return 'danger';
        default:
            return 'info';
    }
}

/**
 * Format diff for display
 */
export function formatDiff(diff: TimelineEventDiff): string {
    const { field, before, after } = diff;
    return `${field}: ${before} → ${after}`;
}

/**
 * Format event message for display
 */
export function formatEventMessage(event: TimelineEvent): string {
    if (event.diff) {
        return `${event.message} (${formatDiff(event.diff)})`;
    }
    return event.message;
}

/**
 * Get absolute timestamp
 */
export function getAbsoluteTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
}
