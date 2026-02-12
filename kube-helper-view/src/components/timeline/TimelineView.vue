<template>
    <div class="timeline-view">
        <div class="timeline-header">
            <h3>Timeline</h3>
            <div class="timeline-controls">
                <Button icon="pi pi-filter" label="Filters" text size="small" @click="showFilterDialog = true" />
                <Button icon="pi pi-times" label="Clear" text size="small" severity="danger" @click="clearTimeline" />
            </div>
        </div>

        <!-- Filter Dialog -->
        <Dialog v-model:visible="showFilterDialog" header="Filter Timeline" :modal="true" style="width: 30rem">
            <div class="filter-options">
                <div class="field-checkbox">
                    <Checkbox v-model="filters.warningOnly" inputId="warningOnly" :binary="true" />
                    <label for="warningOnly">Show warnings only</label>
                </div>

                <Divider />

                <div class="field">
                    <label>Search</label>
                    <InputText v-model="filters.searchText" placeholder="Search events..." />
                </div>
            </div>
        </Dialog>

        <!-- Timeline Events -->
        <ScrollPanel style="width: 100%; height: 400px">
            <Timeline :value="filteredEvents" align="left">
                <template #content="slotProps">
                    <TimelineEventItem :event="slotProps.item" @navigate="navigateToResource" />
                </template>
            </Timeline>

            <div v-if="filteredEvents.length === 0" class="no-events">
                <i class="pi pi-inbox" style="font-size: 2rem; color: var(--text-color-secondary)"></i>
                <p>No events to display</p>
            </div>
        </ScrollPanel>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { MessageTypes } from '../../../../common/messageTypes';
import type { TimelineEvent, TimelineFilter } from '../../types/timeline.types';
import TimelineEventItem from './TimelineEventItem.vue';

// PrimeVue components
import Timeline from 'primevue/timeline';
import ScrollPanel from 'primevue/scrollpanel';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Checkbox from 'primevue/checkbox';
import Divider from 'primevue/divider';
import InputText from 'primevue/inputtext';

const allEvents = ref<TimelineEvent[]>([]);
const showFilterDialog = ref(false);

const filters = ref<TimelineFilter>({
    warningOnly: false,
    resourceKinds: [],
    namespaces: [],
    searchText: ''
});

// Computed filtered events
const filteredEvents = computed(() => {
    return allEvents.value.filter(event => {
        // Warning filter
        if (filters.value.warningOnly && event.eventType !== 'WARNING') {
            return false;
        }

        // Resource kind filter
        if (filters.value.resourceKinds.length > 0 &&
            !filters.value.resourceKinds.includes(event.resourceKind)) {
            return false;
        }

        // Namespace filter
        if (filters.value.namespaces.length > 0 &&
            !filters.value.namespaces.includes(event.namespace)) {
            return false;
        }

        // Search text filter
        if (filters.value.searchText &&
            !event.message.toLowerCase().includes(filters.value.searchText.toLowerCase()) &&
            !event.resourceName.toLowerCase().includes(filters.value.searchText.toLowerCase())) {
            return false;
        }

        return true;
    }).sort((a, b) => {
        // Sort by timestamp descending (newest first)
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA;
    });
});

// Message handler
const handleMessage = (event: MessageEvent) => {
    const message = event.data;

    if (message.type === MessageTypes.TIMELINE_EVENTS_RESULT) {
        // Initial load or refresh
        allEvents.value = message.data || [];
    } else if (message.type === MessageTypes.TIMELINE_EVENT_NEW) {
        // New event streaming in
        allEvents.value.push(message.data);
    }
};

// Request initial events
const loadEvents = () => {
    tsvscode.postMessage({
        type: MessageTypes.GET_TIMELINE_EVENTS
    });
};

// Clear timeline
const clearTimeline = () => {
    tsvscode.postMessage({
        type: MessageTypes.CLEAR_TIMELINE
    });
    allEvents.value = [];
};

// Navigate to resource
const navigateToResource = (event: TimelineEvent) => {
    // TODO: Implement navigation to resource details
    console.log('Navigate to:', event.resourceKind, event.resourceName, event.namespace);
};

onMounted(() => {
    window.addEventListener('message', handleMessage);
    loadEvents();
});

onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
});
</script>

<style scoped>
.timeline-view {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 1px solid var(--surface-border);
}

.timeline-header h3 {
    margin: 0;
    font-size: 1rem;
}

.timeline-controls {
    display: flex;
    gap: 0.5rem;
}

.filter-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.field-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.no-events {
    text-align: center;
    padding: 2rem;
    color: var(--text-color-secondary);
}

.no-events p {
    margin-top: 1rem;
}

/* Override PrimeVue Timeline styling to reduce padding */
:deep(.p-timeline-event-opposite) {
    flex: 0;
    padding: 0;
    min-width: 0;
}

:deep(.p-timeline-event-content) {
    padding-bottom: 1rem;
}
</style>
