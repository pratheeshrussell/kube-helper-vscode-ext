<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import { kubeCmds } from '@src/constants/commands';
import { HelperUtils } from '@src/utils/helpers';

const route = useRoute();

const rbName = ref('');

const value = ref('0');
const isRbName = ref(false);

const rbDescribeCommand = ref('');


onMounted(() => {
    const rbname = route.params.rolebindname;

    if((rbname !== null ) && 
    (typeof rbname === 'string')){
        rbName.value = rbname;
        
        isRbName.value = true;

        rbDescribeCommand.value = HelperUtils.prepareCommand(
        kubeCmds.getDescribeRoleBind.replace("{{rbname}}",rbname));

        globalStore.breadcrumbItems = [
        ...globalStore.breadcrumbItems,
            {
                label: rbname, 
                navigateTo: 'rolebindoverview', 
                params:{rolebindname: rbname},
                index: globalStore.breadcrumbItems.length
            }
        ];
    }
})

</script>

<template>
    <div class="rb-over-view" v-if="!isRbName">
        <div>Unable to load role bind details</div>
    </div>
    <div class="rb-over-view" v-if="isRbName">
        <div class="d-flex flex-row-reverse p-2 rb-options">
        
        </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="0">Describe</Tab>
                
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <DescribeViewer :describeCommand="rbDescribeCommand" />
                </TabPanel>
                
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.rb-options{
    background-color: var(--p-surface-900);
}

</style>