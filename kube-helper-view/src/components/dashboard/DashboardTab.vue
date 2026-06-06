<template>
    <div class="dashboard-tab">
        <div class="dashboard-left">
            <ClusterOverview @navigate="handleNavigation" />
        </div>
        <Divider layout="vertical" />
        <div class="dashboard-right">
            <TimelineView />
        </div>
    </div>
</template>

<script setup lang="ts">
import ClusterOverview from './ClusterOverview.vue';
import TimelineView from '../timeline/TimelineView.vue';
import Divider from 'primevue/divider';

const handleNavigation = (view: string) => {
    // TODO: Implement navigation to other tabs
    console.log('Navigate to view:', view);
    // This could switch to the appropriate tab in ClusterWideElements
};
</script>

<style scoped>
.dashboard-tab {
    display: flex;
    height: 100%;
    gap: 0;
}

.dashboard-left {
    flex: 0 0 70%;
    overflow-y: auto;
}

.dashboard-right {
    flex: 0 0 30%;
    overflow-y: auto;
    padding: 1rem;
    border-left: 1px solid var(--surface-border);
}

@media (max-width: 768px) {
    .dashboard-tab {
        flex-direction: column;
    }

    .dashboard-left,
    .dashboard-right {
        flex: 1 1 auto;
    }

    .dashboard-right {
        border-left: none;
        border-top: 1px solid var(--surface-border);
    }
}
</style>
