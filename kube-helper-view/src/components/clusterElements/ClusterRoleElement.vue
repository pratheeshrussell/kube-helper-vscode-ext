<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import { kubeCmds } from '@src/constants/commands';
import { HelperUtils } from '@src/utils/helpers';

const route = useRoute();

const crName = ref('');

const value = ref('0');
const isCrName = ref(false);

const crDescribeCommand = ref('');


onMounted(() => {
    const crname = route.params.crname;

    if((crname !== null ) && 
    (typeof crname === 'string')){
        crName.value = crname;
        
        isCrName.value = true;

        crDescribeCommand.value = HelperUtils.prepareCommand(
        kubeCmds.getDescribeClusterRole.replace("{{crname}}",crname));

        globalStore.breadcrumbItems = [
            {
                label: crname, 
                navigateTo: 'clusterRoleoverview', 
                params:{crname: crname},
                index: globalStore.breadcrumbItems.length
            }
        ];
    }
})

</script>

<template>
    <div class="cr-over-view" v-if="!isCrName">
        <div>Unable to load ingress details</div>
    </div>
    <div class="cr-over-view" v-if="isCrName">
        <div class="d-flex flex-row-reverse p-2 secret-options">
        
        </div>
        <Tabs v-model:value="value">
            <TabList>
                <Tab value="0">Describe</Tab>
                
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <DescribeViewer :describeCommand="crDescribeCommand" />
                </TabPanel>
                
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.cr-options{
    background-color: var(--p-surface-900);
}

</style>