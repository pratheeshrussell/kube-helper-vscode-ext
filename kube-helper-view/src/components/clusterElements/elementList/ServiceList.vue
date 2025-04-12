<template>
    <DataTable :value="svcTableData" v-model:filters="filters"
    paginator :rows="5" dataKey="name" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getSvcList" />
        </div>
    </template>
    <template #empty> No svc found. </template>
    <template #loading> Loading svcs. Please wait. </template>

    <Column v-if="!isNamespace" field="namespace" header="Namespace" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.namespace" variant="link" @click="gotoNamespaceDetails(data.namespace)" />
        </template>
    </Column>
    <Column field="name" header="Name" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.name" variant="link" @click="gotoSvcDetails(data)" />
        </template>
    </Column>
    <Column field="owner" header="Owner" style="min-width: 12rem">
        <template #body="{ data }">
            <span v-if="data.primaryOwner != null" v-tooltip="data.primaryOwner.kind">
                {{data.primaryOwner.name}}
            </span>
            <span v-else> - </span>
        </template>
    </Column>
    <Column field="type" header="Type" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.type }}
        </template>
    </Column>
    <Column field="cluster-ip" header="Cluster IP" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.clusterIP }}
        </template>
    </Column>
    <Column field="external-ip" header="External IP" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.externalIP }}
        </template>
    </Column>
    <Column field="ports" header="Ports" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.ports }}
        </template>
    </Column>
    
    <Column field="age" header="Age" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.age }}
        </template>
    </Column>

    </DataTable>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { kubeCmds } from '../../../constants/commands';
import { MessageTypes } from '@common/messageTypes';
import TimeAgo from 'javascript-time-ago';
import { HelperUtils } from '../../../utils/helpers';
import { globalStore } from '../../../store/store';
import { useRouter } from 'vue-router';
import type { ServiceListType, ServiceTableItem } from '@src/types/service.type';



const svcListData = ref<ServiceListType| null>(null);
const svcTableData = ref<ServiceTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const isNamespace = ref(false);
const router = useRouter();

const getSvcList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'svcList',
        command: HelperUtils.prepareCommand(kubeCmds
        .getNamespacedResourceByType.replace("{{resType}}", 'service'))
    });
}

const gotoNamespaceDetails = (name: string) => {
    router.push({name: 'namespaceoverview', params: {namespace: name}});
}

const gotoSvcDetails = (data: ServiceTableItem) => {
    if(globalStore.namespace === null){
        globalStore.namespace = data.namespace;
        globalStore.breadcrumbItems = [
            {label: data.namespace, params:{namespace: data.namespace}
                , navigateTo: 'namespaceoverview', index: 0}
        ];
    }
    router.push({name: 'svcoverview', params: {svcname: data.name}});
}

window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "svcList"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as ServiceListType;
        
        if(configDetails?.items?.length > 0){
            const timeAgo = new TimeAgo('en-US');
            const tData = configDetails.items.map(item => {
                const timeStamp = item.metadata?.creationTimestamp ?? (new Date()).toString();
                const age = timeAgo.format(new Date(timeStamp));
                const ports = item.spec?.ports?.map((p) => {
                    return `${p.port}/${p.protocol || "TCP"}`
                }).join(", ") || "-";
                const clusterIp = item.spec?.clusterIP || "-";
                const externalIp = item.spec?.externalIPs?.join(", ") || "-";
                
                const ownerReferences = item.metadata?.ownerReferences?.filter(ref => {
                    return ref.controller === true;
                    }).map(ref => {
                        return {name: ref.name, kind: ref.kind};
                    }) ?? null;
                return {
                    name: item.metadata!.name,
                    namespace: item.metadata!.namespace,
                    type: item.spec?.type,
                    ports: ports,
                    clusterIP: clusterIp,
                    externalIP: externalIp,
                    age: age,
                    timestamp: timeStamp,
                    primaryOwner:ownerReferences && ownerReferences?.length > 0 ? ownerReferences[0] : null,
                } as ServiceTableItem
            });
            svcTableData.value = [...tData];
            svcListData.value = configDetails;
        }else{
            svcTableData.value = [];
            svcListData.value = null;
        }
    }
});

onMounted(() => {
    getSvcList();
    if(globalStore.namespace !== null){
        isNamespace.value = true;
    }
});


</script>
<style scoped>


</style>