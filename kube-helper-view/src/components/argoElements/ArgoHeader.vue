<template>
    <Card class="argo-header-card">
        <template #title>
            <div class="d-flex justify-content-between align-items-center">
                <span>ArgoCD Overview</span>
                <Button v-if="argoNamespace" label="Show Admin Password" icon="pi pi-key" size="small" @click="fetchAdminSecret" />
            </div>
        </template>
        <template #content>
            <div class="stats-list">
                <div class="stat-item">
                    <div class="stat-left">
                        <i class="pi pi-box stat-icon"></i>
                        <span class="stat-label">Applications</span>
                    </div>
                    <div class="stat-right">
                        <div class="stat-main-value">{{ stats.total }} Total</div>
                        <div class="stat-sub-texts" v-if="stats.synced > 0 || stats.outOfSync > 0 || stats.healthy > 0 || stats.degraded > 0">
                            <span class="text-success" v-if="stats.synced > 0">{{ stats.synced }} Synced</span>
                            <span class="text-warn" v-if="stats.outOfSync > 0">{{ stats.outOfSync }} OutOfSync</span>
                            <span class="text-success" v-if="stats.healthy > 0">{{ stats.healthy }} Healthy</span>
                            <span class="text-danger" v-if="stats.degraded > 0">{{ stats.degraded }} Degraded</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <Dialog v-model:visible="showSecretDialog" modal header="ArgoCD Initial Admin Password" :style="{ width: '50vw' }">
                <p>
                    <strong>Username:</strong> admin
                </p>
                <div class="p-inputgroup mb-3 mt-3">
                    <InputText :value="adminPassword" readonly />
                    <Button icon="pi pi-copy" severity="secondary" @click="copyPassword" />
                </div>
                <p v-if="secretError" class="text-danger">{{ secretError }}</p>
                <template #footer>
                    <Button label="Close" @click="showSecretDialog = false" autofocus />
                </template>
            </Dialog>
        </template>
    </Card>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { MessageTypes } from '@common/messageTypes';
import { kubeCmds } from '../../constants/commands';
import { HelperUtils } from '../../utils/helpers';
import type { ArgoApplicationList } from '@src/types/argoApp.type';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';

const stats = ref({
    total: 0,
    synced: 0,
    outOfSync: 0,
    healthy: 0,
    degraded: 0
});

const argoNamespace = ref<string | null>(null);
const adminPassword = ref('');
const showSecretDialog = ref(false);
const secretError = ref('');

const fetchStats = () => {
    // We can reuse the apps list query to generate stats
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'argoAppListForStats',
        command: HelperUtils.prepareCommand(kubeCmds.getArgoCDApplications)
    });
};

const getArgoCDNamespace = () => {
    tsvscode?.postMessage({
        type: MessageTypes.GET_ARGOCD_NAMESPACE,
        context: globalStore.context
    });
};

const fetchAdminSecret = () => {
    if (!argoNamespace.value) return;
    
    let cmd = kubeCmds.getArgoCDAdminSecret.replace('{{argoNamespace}}', argoNamespace.value);
    cmd = HelperUtils.prepareCommand(cmd);
    
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'argoAdminSecretResult',
        command: cmd
    });
};

const copyPassword = () => {
    navigator.clipboard.writeText(adminPassword.value);
};

const handleMessage = (event: MessageEvent) => {
    const message = event.data;
    
    if (message.type === 'argoAppListForStats' || message.type === 'argoAppList') {
        try {
            const data = typeof message.data === 'string'
                ? JSON.parse(message.data) as ArgoApplicationList
                : message.data as ArgoApplicationList;
                
            let synced = 0;
            let outOfSync = 0;
            let healthy = 0;
            let degraded = 0;
            
            if (data?.items) {
                for (const app of data.items) {
                    if (app.status?.sync?.status === 'Synced') synced++;
                    if (app.status?.sync?.status === 'OutOfSync') outOfSync++;
                    if (app.status?.health?.status === 'Healthy') healthy++;
                    if (app.status?.health?.status === 'Degraded') degraded++;
                }
                
                stats.value = {
                    total: data.items.length,
                    synced,
                    outOfSync,
                    healthy,
                    degraded
                };
            }
        } catch (e) {
            console.error('Error parsing apps for stats:', e);
        }
    } else if (message.type === MessageTypes.ARGOCD_NAMESPACE_RESULT) {
        argoNamespace.value = message.data;
    } else if (message.type === 'argoAdminSecretResult') {
        if (message.data && !message.data.includes('error')) {
            try {
                // Secret is base64 encoded
                const base64Password = message.data.replace(/['"]/g, '');
                adminPassword.value = atob(base64Password);
                secretError.value = '';
                showSecretDialog.value = true;
            } catch (e) {
                secretError.value = 'Failed to decode password.';
                showSecretDialog.value = true;
            }
        } else {
            secretError.value = 'Secret not found or access denied.';
            showSecretDialog.value = true;
        }
    }
};

onMounted(() => {
    window.addEventListener('message', handleMessage);
    fetchStats();
    getArgoCDNamespace();
});

onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
});
</script>

<style scoped>
.argo-header-card {
    margin-bottom: 1rem;
}

.stats-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.stat-item {
    padding: 0.75rem 1.25rem;
    background-color: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
}

.stat-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.stat-right {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.stat-main-value {
    font-weight: bold;
    font-size: 1.1rem;
}

.stat-sub-texts {
    display: flex;
    gap: 0.75rem;
    font-size: 0.85rem;
}

.stat-icon {
    font-size: 1.25rem;
    color: var(--primary-color);
}

.stat-label {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    text-transform: uppercase;
}

.text-danger {
    color: var(--red-500);
}

.text-warn {
    color: var(--orange-500);
}

.text-success {
    color: var(--green-500);
}
</style>
