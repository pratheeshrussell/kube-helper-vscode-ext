<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { MessageTypes } from '@common/messageTypes';
import { kubeCmds } from '../constants/commands';
import type { KClusterConfig, KConfig } from '@apptypes/cluster.type';


const kubeConfig = ref<null | KConfig>(null);
const kubeContexts = ref<null | KClusterConfig[]>(null);
const getClusterDetails = () => {
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'clusterDetails',
        command: kubeCmds.getClusters
    });
}

window.addEventListener('message', (event) => {
    if(event.data.type == "clusterDetails"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as KConfig;
        if(configDetails?.clusters?.length > 0){
            const contextDetails:KClusterConfig[]=[];
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
        }else{
            kubeConfig.value = null;
            kubeContexts.value = null;
        }
        
    }
});

const showClusterDetails = (contextName:string, clusterName: string) => {
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
        <template v-if="!kubeContexts || kubeContexts.length == 0">
            <div class="no-contexts">No contexts found</div>
        </template>
        <template v-else>
            <DataView :value="kubeContexts" data-key="name" class="dataview-content">
                <template #list="slotProps">
                    <div class="d-flex flex-column">
                        <div v-for="(item, index) in slotProps.items" :key="index">
                            <div class="d-flex flex-column justify-content-between p-1 m-2" 
                            :class="{ 'border-top border-light': index !== 0 }">
                            <div class="d-flex flex-row justify-content-between align-items-center mt-2 mb-1">
                              <div>
                                <div class="fs-2 fw-bold">{{ item.clusterName }}</div>
                              </div>
                              <div v-if="item.active">
                                <i class="pi pi-star-fill" v-tooltip="'Default Context'" style="color: #ffff00" />
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


</style>