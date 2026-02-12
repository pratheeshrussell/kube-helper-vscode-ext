import { spawn, ChildProcess } from 'child_process';
import * as vscode from 'vscode';
import { randomUUID } from 'crypto';
import { TimelineEvent, K8sEvent, WatchEvent } from '../types/timeline.types';
import { MessageTypes } from '../../common/messageTypes';

/**
 * EventWatcher - Singleton service to watch Kubernetes events
 * Manages kubectl watch processes and broadcasts events to subscribed panels
 */
export class EventWatcher {
    private static instances = new Map<string, EventWatcher>();

    private watchProcess?: ChildProcess;
    private panels = new Set<vscode.WebviewPanel>();
    private eventBuffer: TimelineEvent[] = [];
    private maxEvents: number;
    private context: string;
    private buffer = '';

    private constructor(context: string) {
        this.context = context;
        const config = vscode.workspace.getConfiguration('kubeHelper');
        this.maxEvents = config.get<number>('timeline.maxEvents') || 1000;
    }

    /**
     * Get singleton instance for a context
     */
    static getInstance(context: string): EventWatcher {
        if (!this.instances.has(context)) {
            this.instances.set(context, new EventWatcher(context));
        }
        return this.instances.get(context)!;
    }

    /**
     * Subscribe a panel to receive events
     */
    subscribe(panel: vscode.WebviewPanel): void {
        this.panels.add(panel);

        // Start watcher if first subscriber
        if (this.panels.size === 1) {
            this.start();
        }

        // Send buffered events to new subscriber
        panel.webview.postMessage({
            type: MessageTypes.TIMELINE_EVENTS_RESULT,
            data: this.eventBuffer
        });

        // Cleanup on panel disposal
        panel.onDidDispose(() => {
            this.unsubscribe(panel);
        });
    }

    /**
     * Unsubscribe a panel
     */
    private unsubscribe(panel: vscode.WebviewPanel): void {
        this.panels.delete(panel);

        // Stop watcher if last panel closed
        if (this.panels.size === 0) {
            this.stop();
            EventWatcher.instances.delete(this.context);
        }
    }

    /**
     * Start watching Kubernetes events
     */
    private start(): void {
        if (this.watchProcess) {
            return; // Already running
        }

        console.log(`[EventWatcher] Starting event watch for context: ${this.context}`);

        this.watchProcess = spawn('kubectl', [
            'get', 'events',
            '--all-namespaces',
            '--watch',
            '-o', 'json',
            '--context', this.context
        ]);

        this.watchProcess.stdout?.on('data', (data: Buffer) => {
            this.handleWatchData(data);
        });

        this.watchProcess.stderr?.on('data', (data: Buffer) => {
            console.error(`[EventWatcher] Error: ${data.toString()}`);
        });

        this.watchProcess.on('exit', (code) => {
            console.log(`[EventWatcher] Process exited with code ${code}`);
            this.watchProcess = undefined;
        });
    }

    /**
     * Stop watching and cleanup
     */
    private stop(): void {
        console.log(`[EventWatcher] Stopping event watch for context: ${this.context}`);

        if (this.watchProcess) {
            this.watchProcess.kill('SIGTERM');

            // Fallback: force kill after 5 seconds
            setTimeout(() => {
                if (this.watchProcess && !this.watchProcess.killed) {
                    console.warn('[EventWatcher] Force killing watch process');
                    this.watchProcess.kill('SIGKILL');
                }
            }, 5000);

            this.watchProcess = undefined;
        }

        // Clear buffers
        this.buffer = '';
        this.eventBuffer = [];
    }

    /**
     * Handle incoming data from kubectl watch
     */
    private handleWatchData(data: Buffer): void {
        this.buffer += data.toString();

        // Try to parse complete JSON objects from the buffer
        while (this.buffer.length > 0) {
            const trimmed = this.buffer.trim();
            if (!trimmed) {
                this.buffer = '';
                break;
            }

            // Find the end of the first JSON object
            let braceCount = 0;
            let inString = false;
            let escaped = false;
            let endIndex = -1;

            for (let i = 0; i < trimmed.length; i++) {
                const char = trimmed[i];

                if (escaped) {
                    escaped = false;
                    continue;
                }

                if (char === '\\') {
                    escaped = true;
                    continue;
                }

                if (char === '"') {
                    inString = !inString;
                    continue;
                }

                if (!inString) {
                    if (char === '{') {
                        braceCount++;
                    } else if (char === '}') {
                        braceCount--;
                        if (braceCount === 0) {
                            endIndex = i + 1;
                            break;
                        }
                    }
                }
            }

            // If we found a complete JSON object
            if (endIndex > 0) {
                const jsonStr = trimmed.substring(0, endIndex);
                this.buffer = trimmed.substring(endIndex).trim();

                try {
                    const parsed = JSON.parse(jsonStr);

                    // Handle initial EventList (kubectl outputs this first)
                    if (parsed.kind === 'EventList' && parsed.items) {
                        console.log(`[EventWatcher] Received initial EventList with ${parsed.items.length} events`);
                        // Process existing events as ADDED
                        for (const event of parsed.items) {
                            const watchEvent: WatchEvent<K8sEvent> = {
                                type: 'ADDED',
                                object: event
                            };
                            const timelineEvent = this.convertToTimelineEvent(watchEvent);
                            this.addEvent(timelineEvent);
                        }
                    }
                    // Handle watch events (streaming updates)
                    else if (parsed.type && parsed.object) {
                        const watchEvent: WatchEvent<K8sEvent> = parsed;
                        const timelineEvent = this.convertToTimelineEvent(watchEvent);
                        this.addEvent(timelineEvent);
                    }
                    // Handle raw Event objects (some k8s versions/configs stream these directly)
                    else if (parsed.kind === 'Event') {
                        const watchEvent: WatchEvent<K8sEvent> = {
                            type: 'ADDED', // Treat raw event occurrence as ADDED
                            object: parsed
                        };
                        const timelineEvent = this.convertToTimelineEvent(watchEvent);
                        this.addEvent(timelineEvent);
                    }
                    // Unknown format - log and skip
                    else {
                        console.warn('[EventWatcher] Unknown event format. Kind:', parsed.kind, 'Keys:', Object.keys(parsed));
                    }
                } catch (e) {
                    console.error('[EventWatcher] Failed to parse event:', e);
                    console.error('[EventWatcher] Problematic JSON:', jsonStr.substring(0, 200));
                }
            } else {
                // No complete object yet, wait for more data
                break;
            }
        }
    }

    /**
     * Convert Kubernetes event to Timeline event
     */
    private convertToTimelineEvent(watchEvent: WatchEvent<K8sEvent>): TimelineEvent {
        const k8sEvent = watchEvent.object;
        const eventType = watchEvent.type === 'DELETED' ? 'DELETED' :
            k8sEvent.type === 'Warning' ? 'WARNING' : 'NORMAL';

        return {
            id: randomUUID(),
            timestamp: k8sEvent.lastTimestamp || k8sEvent.firstTimestamp || k8sEvent.metadata.creationTimestamp,
            type: 'EVENT',
            eventType,
            resourceKind: k8sEvent.involvedObject.kind,
            resourceName: k8sEvent.involvedObject.name,
            namespace: k8sEvent.involvedObject.namespace || k8sEvent.metadata.namespace,
            message: k8sEvent.message,
            reason: k8sEvent.reason,
            source: k8sEvent.source?.component
        };
    }

    /**
     * Add event to buffer and broadcast
     */
    private addEvent(event: TimelineEvent): void {
        // Add to circular buffer
        this.eventBuffer.push(event);
        if (this.eventBuffer.length > this.maxEvents) {
            this.eventBuffer.shift(); // Remove oldest
        }

        // Broadcast to all subscribed panels
        this.broadcastEvent(event);
    }

    /**
     * Broadcast event to all subscribed panels
     */
    private broadcastEvent(event: TimelineEvent): void {
        this.panels.forEach(panel => {
            try {
                panel.webview.postMessage({
                    type: MessageTypes.TIMELINE_EVENT_NEW,
                    data: event
                });
            } catch (e) {
                console.error('[EventWatcher] Failed to send event to panel:', e);
            }
        });
    }

    /**
     * Get all buffered events
     */
    getEvents(): TimelineEvent[] {
        return [...this.eventBuffer];
    }

    /**
     * Clear all events
     */
    clearEvents(): void {
        this.eventBuffer = [];
    }
}
