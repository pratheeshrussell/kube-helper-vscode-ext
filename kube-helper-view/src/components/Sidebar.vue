<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { MessageTypes } from '@common/messageTypes';
import { kubeCmds } from '../constants/commands';
import type { KClusterConfig, KConfig } from '@apptypes/cluster.type';
import type { MenuItem } from 'primevue/menuitem';
import Menu from 'primevue/menu';
import Button from 'primevue/button';


const kubeConfig = ref<null | KConfig>(null);
const kubeContexts = ref<null | KClusterConfig[]>(null);

const isError = ref(false);
const getClusterDetails = () => {
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'clusterDetails',
        command: kubeCmds.getClusters
    });
}

// Kebab menu refs: one Menu ref per context card, keyed by contextName
const contextMenuRefs = ref<Record<string, InstanceType<typeof Menu> | null>>({});

const setMenuRef = (el: unknown, contextName: string) => {
    contextMenuRefs.value[contextName] = el as InstanceType<typeof Menu> | null;
};

const toggleContextMenu = (event: Event, contextName: string) => {
    contextMenuRefs.value[contextName]?.toggle(event);
};

const buildContextMenuItems = (contextName: string): MenuItem[] => [
    {
        label: 'Set as default',
        icon: 'pi pi-star',
        command: () => setDefaultContext(contextName)
    }
];

const setDefaultContext = (contextName: string) => {
    const command = kubeCmds.setDefaultContext.replace('{{contextName}}', contextName);
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'setDefaultContext',
        command: command
    });
};

window.addEventListener('message', (event) => {
    if (event.data.type == "clusterDetails") {
        if (event.data?.data?.error) {
            isError.value = true;
            return;
        }
        isError.value = false;
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as KConfig;
        if (configDetails?.clusters?.length > 0) {
            const contextDetails: KClusterConfig[] = [];
            configDetails.contexts.forEach(ctx => {
                const clusterName = ctx.context.cluster;
                const cluster = configDetails.clusters.find(c => c.name === clusterName);
                contextDetails.push({
                    clusterName: clusterName,
                    server: cluster?.cluster?.server,
                    contextName: ctx.name,
                    user: ctx.context.user,
                    active: ctx.name === configDetails["current-context"]
                });
            });
            kubeContexts.value = [...contextDetails];
            kubeConfig.value = configDetails;
        } else {
            kubeConfig.value = null;
            kubeContexts.value = null;
        }
    }

    if (event.data.type == "setDefaultContext") {
        // Refresh the cluster list so the star updates
        getClusterDetails();
    }
});

const showClusterDetails = (contextName: string, clusterName: string) => {
    tsvscode?.postMessage({
        type: MessageTypes.SHOW_DETAILS,
        clusterName: clusterName,
        contextName: contextName
    });
}

onMounted(() => {
    getClusterDetails();
})
</script>

<template>
    <div class="sidebar">
        <template v-if="isError">
            <div class="error">
                <div>Error fetching cluster details</div>
                <div class="my-2">Is kubectl installed and available in env path?</div>
                <div class="d-flex justify-content-center align-items-center">
                    <Button label="Retry" @click="getClusterDetails" size="small" class="text-nowrap"></Button>
                </div>
            </div>
        </template>
        <template v-else-if="!kubeContexts || kubeContexts.length == 0">
            <div class="no-contexts">No contexts found</div>
        </template>
        <template v-else>
            <DataView :value="kubeContexts" data-key="name" class="dataview-content">
                <template #list="slotProps">
                    <div class="d-flex flex-column">
                        <div v-for="(item, index) in slotProps.items" :key="index">
                            <div class="d-flex flex-column justify-content-between context-element p-2 mb-2"
                                :class="{ 'border-top border-light': index !== 0 }">
                                <div class="d-flex flex-row justify-content-between align-items-center mt-2 mb-1">
                                    <div>
                                        <div class="fs-2 fw-bold">{{ item.clusterName }}</div>
                                    </div>
                                    <div class="d-flex align-items-center gap-1">
                                        <!-- Star for active/default context -->
                                        <i v-if="item.active"
                                            class="pi pi-star-fill"
                                            v-tooltip="'Default Context'"
                                            style="color: #ffff00" />

                                        <!-- Three-dot kebab menu for non-active contexts -->
                                        <template v-if="!item.active">
                                            <Button
                                                icon="pi pi-ellipsis-v"
                                                severity="secondary"
                                                text
                                                rounded
                                                size="small"
                                                class="kebab-btn"
                                                v-tooltip="'More options'"
                                                :id="`kebab-btn-${item.contextName}`"
                                                @click="toggleContextMenu($event, item.contextName)"
                                            />
                                            <Menu
                                                :ref="(el) => setMenuRef(el, item.contextName)"
                                                :model="buildContextMenuItems(item.contextName)"
                                                popup
                                            />
                                        </template>
                                    </div>
                                </div>
                                <div class="d-flex flex-row-reverse mt-3">
                                    <Button label="View" @click="showClusterDetails(item.contextName, item.clusterName)"
                                        :disabled="item.clusterName === ''" size="small"
                                        class="text-nowrap"></Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </DataView>
        </template>

    </div>
</template>

<style scoped>
:deep(.p-dataview-content) {
    background: transparent;
}
.context-element{
    background: var(--p-dataview-content-background);
    border-radius: 0.5rem;
}
.kebab-btn {
    opacity: 0.6;
    transition: opacity 0.15s ease;
}
.kebab-btn:hover {
    opacity: 1;
}
</style>