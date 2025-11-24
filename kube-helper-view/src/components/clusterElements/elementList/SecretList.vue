<template>
    <DataTable :value="secretTableData" v-model:filters="filters" paginator :rows="5" dataKey="name" filterDisplay="row"
        :loading="loading">
        <template #header>
            <div class="d-flex justify-content-between">
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Global Search" />
                </IconField>

                <RefreshData :reloadFunction="getSecretList" />
            </div>
        </template>
        <template #empty> No secrets found. </template>
        <template #loading> Loading secrets. Please wait. </template>

        <Column v-if="!isNamespace" field="namespace" header="Namespace" style="min-width: 12rem">
            <template #body="{ data }">
                <Button :label="data.namespace" variant="link" @click="gotoNamespaceDetails(data.namespace)" />
            </template>
        </Column>
        <Column field="name" header="Name" style="min-width: 12rem">
            <template #body="{ data }">
                <Button :label="data.name" variant="link" @click="gotoSecretDetails(data)" />
            </template>
        </Column>
        <Column field="age" header="Age" style="min-width: 12rem">
            <template #body="{ data }">
                {{ data.age }}
            </template>
        </Column>
        <Column field="data-count" header="Data Count" style="min-width: 12rem">
            <template #body="{ data }">
                {{ data.dataCount }}
            </template>
        </Column>
        <Column field="type" header="Type" style="min-width: 12rem">
            <template #body="{ data }">
                {{ data.type }}
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
import type { SecretListType, SecretTableItem, SecretType } from '@src/types/secret.type';




const secretListData = ref<SecretListType | null>(null);
const secretTableData = ref<SecretTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const isNamespace = ref(false);
const router = useRouter();

const getSecretList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'secretList',
        command: HelperUtils.prepareCommand(kubeCmds
            .getNamespacedResourceByType.replace("{{resType}}", 'secret'))
    });
}

const gotoNamespaceDetails = (name: string) => {
    router.push({ name: 'namespaceoverview', params: { namespace: name } });
}

const gotoSecretDetails = (data: SecretTableItem) => {
    if (globalStore.namespace === null) {
        globalStore.namespace = data.namespace;
        globalStore.breadcrumbItems = [
            {
                label: data.namespace, params: { namespace: data.namespace }
                , navigateTo: 'namespaceoverview', index: 0
            }
        ];
    }
    router.push({ name: 'secretoverview', params: { secretname: data.name } });
}


window.addEventListener('message', (event) => {
    loading.value = false;
    if (event.data.type == "secretList") {
        let configDetails: SecretListType | null = null;
        const rawData = event.data.data;

        if (rawData && rawData.error) {
            console.error("Error fetching secret list:", rawData.errormessage || rawData.message);
            secretTableData.value = [];
            secretListData.value = null;
            return;
        }

        try {
            if (typeof rawData === 'string') {
                configDetails = JSON.parse(rawData) as SecretListType;
            } else if (typeof rawData === 'object') {
                configDetails = rawData as SecretListType;
            }

            if (configDetails?.items && configDetails?.items?.length > 0) {
                const timeAgo = new TimeAgo('en-US');
                const tData = configDetails.items.map((item: SecretType) => {
                    const timeStamp = item?.metadata?.creationTimestamp || (new Date()).toISOString();
                    const age = timeAgo.format(new Date(timeStamp));

                    return {
                        age: age,
                        timestamp: timeStamp,
                        name: item?.metadata?.name || '',
                        dataCount: item?.data ? Object.keys(item.data).length : 0,
                        namespace: item?.metadata?.namespace || 'default',
                        type: item?.type || 'Opaque',
                    } as SecretTableItem
                });
                secretTableData.value = [...tData];
                secretListData.value = configDetails;
            } else {
                secretTableData.value = [];
                secretListData.value = null;
            }
        } catch (error) {
            console.error("Failed to parse secret list:", typeof rawData === 'object' ? JSON.stringify(rawData) : rawData, error);
            secretTableData.value = [];
            secretListData.value = null;
        }
    }
});

onMounted(() => {
    getSecretList();
    if (globalStore.namespace !== null) {
        isNamespace.value = true;
    }
});


</script>
<style scoped></style>