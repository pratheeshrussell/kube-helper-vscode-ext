<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import { kubeCmds } from '@src/constants/commands';
import { HelperUtils } from '@src/utils/helpers';
import PortForward from '../common/PortForward.vue';
import EditResource from '../common/EditResource.vue';

const route = useRoute();

const svcName = ref('');

const value = ref('0');
const isSvcName = ref(false);

const svcDescribeCommand = ref('');
const svcPortfwdCommand = ref('');
const svcEditCommand = ref('');

onMounted(() => {
    const svcname = route.params.svcname;

    if((svcname !== null ) && 
    (typeof svcname === 'string')){
        svcName.value = svcname;
        
        isSvcName.value = true;

        svcDescribeCommand.value = kubeCmds.describeNamespacedResource
        .replace("{{resType}}", 'svc')
        .replace("{{resName}}", svcname);;

        svcPortfwdCommand.value = HelperUtils.prepareCommand(
        kubeCmds.portfwdSvc.replace("{{svcname}}",svcname));

        svcEditCommand.value = kubeCmds.editNamespacedResource.replace("{{resType}}", 'service')
        .replace("{{resName}}", svcname);
        
        globalStore.breadcrumbItems = [
            ...globalStore.breadcrumbItems,
            {
                label: svcname, 
                navigateTo: 'svcoverview', 
                params:{svcname: svcname},
                index: globalStore.breadcrumbItems.length
            }
        ];
    }
})

</script>

<template>
    <div class="svc-over-view" v-if="!isSvcName">
        <div>Unable to load service details</div>
    </div>
    <div class="svc-over-view" v-if="isSvcName">
        <div class="d-flex flex-row-reverse p-2 svc-options">
            <PortForward :portfwdCommand="svcPortfwdCommand" />
            <EditResource  :editCommand="svcEditCommand"  buttonText="Edit Service" />
        </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="0">Describe</Tab>
                
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <DescribeViewer :describeCommand="svcDescribeCommand" />
                </TabPanel>
                
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.svc-options{
    background-color: var(--p-surface-900);
}

</style>