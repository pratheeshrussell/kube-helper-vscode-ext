<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import { kubeCmds } from '@src/constants/commands';
import { HelperUtils } from '@src/utils/helpers';

const route = useRoute();

const saName = ref('');

const value = ref('0');
const isSaName = ref(false);

const saDescribeCommand = ref('');


onMounted(() => {
    const saname = route.params.saname;

    if((saname !== null ) && 
    (typeof saname === 'string')){
        saName.value = saname;
        
        isSaName.value = true;

        saDescribeCommand.value = kubeCmds.describeNamespacedResource
        .replace("{{resType}}", 'serviceaccounts')
        .replace("{{resName}}", saname);
        

        globalStore.breadcrumbItems = [
            ...globalStore.breadcrumbItems,
            {
                label: saname, 
                navigateTo: 'saoverview', 
                params:{saname: saname},
                index: globalStore.breadcrumbItems.length
            }
        ];
    }
})

</script>

<template>
    <div class="sa-over-view" v-if="!isSaName">
        <div>Unable to load service account details</div>
    </div>
    <div class="sa-over-view" v-if="isSaName">
        <div class="d-flex flex-row-reverse p-2 sa-options">
        
        </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="0">Describe</Tab>
                
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <DescribeViewer :describeCommand="saDescribeCommand" />
                </TabPanel>
                
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.sa-options{
    background-color: var(--p-surface-900);
}

</style>