<template>
    <div class="project-overview" v-if="!isProjectName">
        <div>Unable to load project details</div>
    </div>
    <div class="project-overview" v-if="isProjectName">
        <div class="d-flex flex-row-reverse p-2 project-options">
            <EditResource :editCommand="projectEditCommand" buttonText="Edit Project" />
            <DeleteResource :deleteCommand="projectDelCommand" @deleted="handleProjectDelete" />
        </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="overview">Overview</Tab>
                <Tab value="describe">Describe</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="overview">
                    <div class="overview-grid" v-if="projectDetails">
                        <div class="card-row mb-3">
                            <!-- Source Repos -->
                            <Card class="info-card">
                                <template #title>Source Repositories</template>
                                <template #content>
                                    <ul v-if="projectDetails.spec?.sourceRepos?.length">
                                        <li v-for="(repo, idx) in projectDetails.spec.sourceRepos" :key="idx">{{ repo }}</li>
                                    </ul>
                                    <span v-else>No source repositories defined</span>
                                </template>
                            </Card>
                            
                            <!-- Destinations -->
                            <Card class="info-card">
                                <template #title>Destinations</template>
                                <template #content>
                                    <ul v-if="projectDetails.spec?.destinations?.length">
                                        <li v-for="(dest, idx) in projectDetails.spec.destinations" :key="idx">
                                            <strong>{{ dest.server || dest.name || '*' }}</strong> / {{ dest.namespace || '*' }}
                                        </li>
                                    </ul>
                                    <span v-else>No destinations defined</span>
                                </template>
                            </Card>
                        </div>
                        
                        <!-- Resource Whitelists/Blacklists -->
                        <div class="card-row mb-3">
                            <Card class="info-card">
                                <template #title>Cluster Resource Whitelist</template>
                                <template #content>
                                    <ul v-if="projectDetails.spec?.clusterResourceWhitelist?.length">
                                        <li v-for="(res, idx) in projectDetails.spec.clusterResourceWhitelist" :key="idx">
                                            Group: {{ res.group || '*' }}, Kind: {{ res.kind || '*' }}
                                        </li>
                                    </ul>
                                    <span v-else>Not configured</span>
                                </template>
                            </Card>
                            
                            <Card class="info-card">
                                <template #title>Namespace Resource Whitelist</template>
                                <template #content>
                                    <ul v-if="projectDetails.spec?.namespaceResourceWhitelist?.length">
                                        <li v-for="(res, idx) in projectDetails.spec.namespaceResourceWhitelist" :key="idx">
                                            Group: {{ res.group || '*' }}, Kind: {{ res.kind || '*' }}
                                        </li>
                                    </ul>
                                    <span v-else>Not configured</span>
                                </template>
                            </Card>
                        </div>
                        
                        <!-- Roles -->
                        <Card v-if="projectDetails.spec?.roles && projectDetails.spec.roles.length > 0">
                            <template #title>Roles</template>
                            <template #content>
                                <div v-for="(role, idx) in projectDetails.spec.roles" :key="idx" class="role-item mb-3 p-3 border-round surface-border border-1">
                                    <div class="font-bold mb-2">{{ role.name }}</div>
                                    <div v-if="role.description" class="text-sm mb-2">{{ role.description }}</div>
                                    <div v-if="role.groups?.length" class="text-sm mb-2"><strong>Groups:</strong> {{ role.groups.join(', ') }}</div>
                                    <div v-if="role.policies?.length" class="text-sm">
                                        <strong>Policies:</strong>
                                        <pre class="bg-gray-900 p-2 border-round mt-1 text-xs">{{ role.policies.join('\n') }}</pre>
                                    </div>
                                </div>
                            </template>
                        </Card>
                    </div>
                    <div v-else class="p-3">
                        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i> Loading details...
                    </div>
                </TabPanel>
                <TabPanel value="describe">
                    <DescribeViewer :describeCommand="projectDescribeCommand" />
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute, useRouter } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import EditResource from '../common/EditResource.vue';
import DeleteResource from '../common/DeleteResource.vue';
import { kubeCmds } from '@src/constants/commands';
import { MessageTypes } from '@common/messageTypes';
import { HelperUtils } from '../../utils/helpers';
import type { ArgoProject } from '@src/types/argoProject.type';
import Card from 'primevue/card';

const route = useRoute();
const router = useRouter();

const projectName = ref('');
const isProjectName = ref(false);
const value = ref('overview');

const projectDescribeCommand = ref('');
const projectEditCommand = ref('');
const projectDelCommand = ref('');
const projectDetails = ref<ArgoProject | null>(null);

onMounted(() => {
    const projectname = route.params.projectname;

    if (projectname !== null && typeof projectname === 'string') {
        projectName.value = projectname;
        isProjectName.value = true;

        const baseParams = {
            '{{resType}}': 'appproject',
            '{{resName}}': projectname
        };

        let cmdDesc: string = kubeCmds.describeArgoCDResource;
        let cmdEdit: string = kubeCmds.editArgoCDResource;
        let cmdDel: string = kubeCmds.deleteArgoCDResource;

        for (const [k, v] of Object.entries(baseParams)) {
            cmdDesc = cmdDesc.replace(k, v);
            cmdEdit = cmdEdit.replace(k, v);
            cmdDel = cmdDel.replace(k, v);
        }

        projectDescribeCommand.value = cmdDesc;
        projectEditCommand.value = cmdEdit;
        projectDelCommand.value = cmdDel;

        globalStore.breadcrumbItems = [
            ...globalStore.breadcrumbItems,
            {
                label: projectname,
                navigateTo: 'argoprojectoverview',
                params: { projectname: projectname },
                index: globalStore.breadcrumbItems.length
            }
        ];

        fetchProjectDetails();
        window.addEventListener('message', handleMessage);
    }
});

onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
});

const fetchProjectDetails = () => {
    let cmd = kubeCmds.getNamespacedResourceByName
        .replace('{{resType}}', 'appproject')
        .replace('{{resName}}', projectName.value);
    
    cmd = HelperUtils.prepareCommand(cmd);

    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'argoProjectDetails',
        command: cmd
    });
};

const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'argoProjectDetails') {
        try {
            const data = typeof event.data.data === 'string'
                ? JSON.parse(event.data.data)
                : event.data.data;
            projectDetails.value = data as ArgoProject;
        } catch (e) {
            console.error('Failed to parse project details', e);
        }
    }
};

const handleProjectDelete = () => {
    const lastBreadcrumb = globalStore.breadcrumbItems[globalStore.breadcrumbItems.length - 1];
    if (lastBreadcrumb && lastBreadcrumb.navigateTo === 'argoprojectoverview') {
        globalStore.breadcrumbItems.pop();
        router.back();
    }
};
</script>

<style scoped>
.project-options {
    background-color: var(--p-surface-900);
}
.overview-grid {
    display: flex;
    flex-direction: column;
    padding: 1rem;
}
.card-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
}
ul {
    margin: 0;
    padding-left: 1.5rem;
}
li {
    margin-bottom: 0.25rem;
}
pre {
    white-space: pre-wrap;
    word-break: break-all;
}
</style>
