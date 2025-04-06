<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import { kubeCmds } from '@src/constants/commands';
import { HelperUtils } from '@src/utils/helpers';

const route = useRoute();

const rsName = ref('');

const value = ref('0');
const isRsName = ref(false);

const rsDescribeCommand = ref('');


onMounted(() => {
    const rsname = route.params.rsname;

    if((rsname !== null ) && 
    (typeof rsname === 'string')){
        rsName.value = rsname;
        
        isRsName.value = true;

        rsDescribeCommand.value = HelperUtils.prepareCommand(
        kubeCmds.getDescribeReplsetBind.replace("{{rsname}}",rsname));

        globalStore.breadcrumbItems = [
            ...globalStore.breadcrumbItems,
            {
                label: rsname, 
                navigateTo: 'replsetoverview', 
                params:{rsname: rsname},
                index: globalStore.breadcrumbItems.length
            }
        ];
    }
})

</script>

<template>
    <div class="rs-over-view" v-if="!isRsName">
        <div>Unable to load replicaset details</div>
    </div>
    <div class="rs-over-view" v-if="isRsName">
        <div class="d-flex flex-row-reverse p-2 rs-options">
        
        </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="0">Describe</Tab>
                
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <DescribeViewer :describeCommand="rsDescribeCommand" />
                </TabPanel>
                
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.rs-options{
    background-color: var(--p-surface-900);
}

</style>