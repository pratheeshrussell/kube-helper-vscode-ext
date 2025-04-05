<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import { kubeCmds } from '@src/constants/commands';
import { HelperUtils } from '@src/utils/helpers';

const route = useRoute();

const roleName = ref('');

const value = ref('0');
const isRoleName = ref(false);

const roleDescribeCommand = ref('');


onMounted(() => {
    const rolename = route.params.rolename;

    if((rolename !== null ) && 
    (typeof rolename === 'string')){
        roleName.value = rolename;
        
        isRoleName.value = true;

        roleDescribeCommand.value = HelperUtils.prepareCommand(
        kubeCmds.getDescribeRole.replace("{{rolename}}",rolename));

        globalStore.breadcrumbItems = [
            ...globalStore.breadcrumbItems,
            {
                label: rolename, 
                navigateTo: 'roleoverview', 
                params:{rolename: rolename},
                index: globalStore.breadcrumbItems.length
            }
        ];
    }
})

</script>

<template>
    <div class="role-over-view" v-if="!isRoleName">
        <div>Unable to load role details</div>
    </div>
    <div class="role-over-view" v-if="isRoleName">
        <div class="d-flex flex-row-reverse p-2 role-options">
        
        </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="0">Describe</Tab>
                
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <DescribeViewer :describeCommand="roleDescribeCommand" />
                </TabPanel>
                
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.role-options{
    background-color: var(--p-surface-900);
}

</style>