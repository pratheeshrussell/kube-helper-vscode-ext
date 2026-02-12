<template>
    <Card class="timeline-event-card" @click="$emit('navigate', event)">
        <template #header>
            <div class="event-header">
                <Tag :severity="getEventSeverity(event.eventType)" :value="event.eventType">
                    <template #default>
                        <span>{{ getEventIcon(event.eventType) }} {{ event.eventType }}</span>
                    </template>
                </Tag>
                <small class="event-time" :title="getAbsoluteTimestamp(event.timestamp)">
                    {{ formatTimestamp(event.timestamp) }}
                </small>
            </div>
        </template>

        <template #title>
            <div class="event-title">
                {{ event.resourceKind }}/{{ event.resourceName }}
                <Tag v-if="event.namespace" :value="event.namespace" severity="secondary" size="small" />
            </div>
        </template>

        <template #content>
            <p class="event-message">{{ event.message }}</p>
            <div v-if="event.reason" class="event-reason">
                <strong>Reason:</strong> {{ event.reason }}
            </div>
            <div v-if="event.source" class="event-source">
                <strong>Source:</strong> {{ event.source }}
            </div>
            <div v-if="event.diff" class="event-diff">
                <strong>Change:</strong> {{ formatDiff(event.diff) }}
            </div>
        </template>
    </Card>
</template>

<script setup lang="ts">
import type { TimelineEvent } from '../../types/timeline.types';
import { formatTimestamp, getEventIcon, getEventSeverity, formatDiff, getAbsoluteTimestamp } from '../../utils/eventFormatter';

// PrimeVue components
import Card from 'primevue/card';
import Tag from 'primevue/tag';

defineProps<{
    event: TimelineEvent;
}>();

defineEmits<{
    navigate: [event: TimelineEvent];
}>();
</script>

<style scoped>
.timeline-event-card {
    margin-bottom: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
}

.timeline-event-card:hover {
    background-color: var(--surface-hover);
    transform: translateX(2px);
}

.event-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
}

.event-time {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
}

.event-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    font-weight: 600;
}

.event-message {
    margin: 0.5rem 0;
    color: var(--text-color);
}

.event-reason,
.event-source,
.event-diff {
    font-size: 0.85rem;
    color: var(--text-color-secondary);
    margin-top: 0.25rem;
}

.event-diff {
    font-family: monospace;
    background-color: var(--surface-ground);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    display: inline-block;
}
</style>
