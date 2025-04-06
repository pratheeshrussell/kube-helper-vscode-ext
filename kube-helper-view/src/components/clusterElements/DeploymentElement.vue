<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import { kubeCmds } from '@src/constants/commands';
import { HelperUtils } from '@src/utils/helpers';

const route = useRoute();

const depName = ref('');

const value = ref('0');
const isDepName = ref(false);

const depDescribeCommand = ref('');


onMounted(() => {
    const depname = route.params.depname;

    if((depname !== null ) && 
    (typeof depname === 'string')){
        depName.value = depname;
        
        isDepName.value = true;

        depDescribeCommand.value = HelperUtils.prepareCommand(
        kubeCmds.getDescribeDeployment.replace("{{depname}}",depname));

        globalStore.breadcrumbItems = [
            ...globalStore.breadcrumbItems,
            {
                label: depname, 
                navigateTo: 'deploymentoverview', 
                params:{depname: depname},
                index: globalStore.breadcrumbItems.length
            }
        ];
    }
})

</script>

<template>
    <div class="dep-over-view" v-if="!isDepName">
        <div>Unable to load deployment details</div>
    </div>
    <div class="dep-over-view" v-if="isDepName">
        <div class="d-flex flex-row-reverse p-2 dep-options">
        
        </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="0">Describe</Tab>
                
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <DescribeViewer :describeCommand="depDescribeCommand" />
                </TabPanel>
                
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.dep-options{
    background-color: var(--p-surface-900);
}

</style>