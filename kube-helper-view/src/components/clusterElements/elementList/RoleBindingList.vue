<template>
    <DataTable :value="rbTableData" v-model:filters="filters" paginator :rows="5" dataKey="name" filterDisplay="row"
        :loading="loading">
        <template #header>
            <div class="d-flex justify-content-between">
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Global Search" />
                </IconField>

                <RefreshData :reloadFunction="getRoleBindList" />
            </div>
        </template>
        <template #empty> No role bindings found. </template>
        <template #loading> Loading role bindings. Please wait. </template>

        <Column v-if="!isNamespace" field="namespace" header="Namespace" style="min-width: 12rem">
            <template #body="{ data }">
                <Button :label="data.namespace" variant="link" @click="gotoNamespaceDetails(data.namespace)" />
            </template>
        </Column>
        <Column field="name" header="Name" style="min-width: 12rem">
            <template #body="{ data }">
                <Button :label="data.name" variant="link" @click="gotoRBDetails(data)" />
            </template>
        </Column>
        <Column field="role" header="Role" style="min-width: 12rem">
            <template #body="{ data }">
                <Button :label="`${data.roleref.kind}/${data.roleref.name}`" variant="link"
                    @click="gotoRoleDetails(data)" />
            </template>
        </Column>
        <Column field="users" header="Users" style="min-width: 12rem">
            <template #body="{ data }">
                {{ data.users }}
            </template>
        </Column>
        <Column field="groups" header="Groups" style="min-width: 12rem">
            <template #body="{ data }">
                {{ data.groups }}
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
import { HelperUtils } from '../../../utils/helpers';
import { globalStore } from '../../../store/store';
import { useRouter } from 'vue-router';
import TimeAgo from 'javascript-time-ago';
import type { RoleBindListType, RoleBindingType, RoleBindTableItem } from '@src/types/roleBinding.type';


const rbListData = ref<RoleBindListType | null>(null);
const rbTableData = ref<RoleBindTableItem[]>([]);
const loading = ref(true);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const isNamespace = ref(false);
const router = useRouter();

const getRoleBindList = () => {
    loading.value = true;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'roleBindingList',
        command: HelperUtils.prepareCommand(kubeCmds.getRoleBindingList)
    });
}

const gotoRBDetails = (data: RoleBindTableItem) => {
    if (globalStore.namespace === null) {
        globalStore.namespace = data.namespace;
        globalStore.breadcrumbItems = [
            {
                label: data.namespace, params: { namespace: data.namespace }
                , navigateTo: 'namespaceoverview', index: 0
            }
        ];
    }
    router.push({ name: 'rolebindoverview', params: { rolebindname: data.name } });
}

const gotoNamespaceDetails = (name: string) => {
    router.push({name: 'namespaceoverview', params: {namespace: name}});
}

const gotoRoleDetails = (data: RoleBindTableItem) => {

    if (data.roleref.kind.toLowerCase() == 'role') {
       
        router.push({ name: 'roleoverview', params: { rolename: data.roleref.name } });
    }

}


window.addEventListener('message', (event) => {
    loading.value = false;
    if (event.data.type == "roleBindingList") {
        // TODO: Handle error
        const configDetails = JSON.parse(event.data.data) as RoleBindListType;

        if (configDetails?.items && configDetails?.items?.length > 0) {
            const timeAgo = new TimeAgo('en-US');
            const tData = configDetails.items.map((item: RoleBindingType) => {
                const timeStamp = item?.metadata?.creationTimestamp || (new Date()).toISOString();
                const age = timeAgo.format(new Date(timeStamp));

                const users = item?.subjects?.filter((sub: any) => sub?.kind == 'User').map((sub: any) => {
                    return `${sub?.name}`;
                }).join(', ') || '';
                const groups = item?.subjects?.filter((sub: any) => sub?.kind == 'Group').map((sub: any) => {
                    return `${sub?.name}`;
                }).join(', ') || '';
                return {
                    name: item?.metadata?.name || '',
                    namespace: item?.metadata?.namespace || 'default',
                    users: users,
                    groups: groups,
                    roleref: {
                        name: item?.roleRef?.name || '',
                        kind: item?.roleRef?.kind || ''
                    },
                    age: age,
                    timestamp: timeStamp,
                } as RoleBindTableItem
            });
            rbTableData.value = [...tData];
            rbListData.value = configDetails;
        } else {
            rbTableData.value = [];
            rbListData.value = null;
        }
    }
});

onMounted(() => {
    getRoleBindList();
    if (globalStore.namespace !== null) {
        isNamespace.value = true;
    }
});


</script>
<style scoped></style>