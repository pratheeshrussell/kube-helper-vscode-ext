<template>
    <DataTable :value="eventTableData" v-model:filters="filters"
    paginator :rows="5" filterDisplay="row" :loading="loading">
    <template #header>
        <div class="d-flex justify-content-between">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>

            <RefreshData :reloadFunction="getEventList" />
        </div>
    </template>
    <template #empty> No events found. </template>
    <template #loading> Loading events. Please wait. </template>

    <Column v-if="!isNamespace" field="namespace" header="Namespace" style="min-width: 12rem">
        <template #body="{ data }">
            <Button :label="data.namespace" variant="link" @click="gotoNamespaceDetails(data.namespace)" />
        </template>
    </Column>
    <Column field="lastSeenTime" sortable header="Last seen" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.lastSeen }}
        </template>
    </Column>
    <Column field="type" header="Type" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.type }}
        </template>
    </Column>
    <Column field="reason" header="Reason" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.reason }}
        </template>
    </Column>
    <Column field="object" header="Object" style="min-width: 12rem">
        <template #body="{ data }">
            {{ data.object }}
        </template>
    </Column>
    <Column field="message" header="Message" style="min-width: 12rem">
        <template #body="{ data }">
            <span class="selectable">{{ data.message }}</span>
        </template>
    </Column>
    </DataTable>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { MessageTypes } from '@common/messageTypes';
import TimeAgo from 'javascript-time-ago';
import { HelperUtils } from '../../utils/helpers';
import { globalStore } from '../../store/store';
import { useRouter } from 'vue-router';
import type { EventListType, EventTableItem, EventType } from '@src/types/event.type';

const inputprops = defineProps({
    eventCommand: {
        type: String,
        required: true
    }
});

const eventListData = ref<EventListType| null>(null);
const eventTableData = ref<EventTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const isNamespace = ref(false);
const router = useRouter();

const getEventList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'eventList',
        command: HelperUtils.prepareCommand(inputprops.eventCommand)
    });
}

const gotoNamespaceDetails = (name: string) => {
    router.push({name: 'namespaceoverview', params: {namespace: name}});
}


window.addEventListener('message', (event) => {
    loading.value = false;
    if(event.data.type == "eventList"){
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as EventListType;
        
        if(configDetails?.items?.length > 0){
            const timeAgo = new TimeAgo('en-US');
            const tData = configDetails.items.map((item:EventType) => {
                const timeStamp = item?.lastTimestamp || item?.eventTime || item?.firstTimestamp || (new Date()).toISOString();
                const lastSeenAge = timeAgo.format(new Date(timeStamp));
                
                return {
                    namespace: item.metadata?.namespace ?? 'default',
                    reason: item.reason || "-",
                    object:  item.involvedObject? `${item.involvedObject?.kind}/${item.involvedObject?.name}` : "-",
                    type: item.type || "-",
                    lastSeen: lastSeenAge,
                    lastTimestamp: timeStamp,
                    message: item.message || "-",
                    lastSeenTime: new Date(timeStamp)
                } as EventTableItem
            });
            eventTableData.value = [...tData];
            eventListData.value = configDetails;
        }else{
            eventTableData.value = [];
            eventListData.value = null;
        }
    }
});

onMounted(() => {
    getEventList();
    if(globalStore.namespace !== null){
        isNamespace.value = true;
    }
});


</script>
<style scoped>


</style>