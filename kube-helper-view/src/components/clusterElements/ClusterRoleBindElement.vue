<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import { kubeCmds } from '@src/constants/commands';
import { HelperUtils } from '@src/utils/helpers';

const route = useRoute();

const crbName = ref('');

const value = ref('0');
const isCrbName = ref(false);

const crbDescribeCommand = ref('');


onMounted(() => {
    const crbname = route.params.crbname;

    if((crbname !== null ) && 
    (typeof crbname === 'string')){
        crbName.value = crbname;
        
        isCrbName.value = true;

        crbDescribeCommand.value = HelperUtils.prepareCommand(
        kubeCmds.getDescribeClusterRoleBind.replace("{{crbname}}",crbname));

        globalStore.breadcrumbItems = [
            {
                label: crbname, 
                navigateTo: 'clusterRoleBindoverview', 
                params:{crbname: crbname},
                index: globalStore.breadcrumbItems.length
            }
        ];
    }
})

</script>

<template>
    <div class="crb-over-view" v-if="!isCrbName">
        <div>Unable to load cluster role bind details</div>
    </div>
    <div class="crb-over-view" v-if="isCrbName">
        <div class="d-flex flex-row-reverse p-2 secret-options">
        
        </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="0">Describe</Tab>
                
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <DescribeViewer :describeCommand="crbDescribeCommand" />
                </TabPanel>
                
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.crb-options{
    background-color: var(--p-surface-900);
}

</style>