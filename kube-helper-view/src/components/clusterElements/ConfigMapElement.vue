<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import { kubeCmds } from '@src/constants/commands';
import ConfigMapData from './elementList/ConfigMapData.vue';
import EditResource from '../common/EditResource.vue';

const route = useRoute();

const cmName = ref('');

const value = ref('0');
const isCmName = ref(false);

const cmDescribeCommand = ref('');
const cmEditCommand = ref('');

onMounted(() => {
    const cmname = route.params.cmname;

    if((cmname !== null ) &&
    (typeof cmname === 'string')){
        cmName.value = cmname;
        
        isCmName.value = true;

        cmDescribeCommand.value = kubeCmds.describeNamespacedResource.replace("{{resType}}", 'configmap')
            .replace("{{resName}}", cmname);

        cmEditCommand.value = kubeCmds.editNamespacedResource.replace("{{resType}}", 'configmap')
            .replace("{{resName}}", cmname);

        globalStore.breadcrumbItems = [
            ...globalStore.breadcrumbItems,
            {
                label: cmname,
                navigateTo: 'configmapoverview',
                params:{cmname: cmname},
                index: globalStore.breadcrumbItems.length
            }
        ];
    }
})

</script>

<template>
    <div class="svc-over-view" v-if="!isCmName">
        <div>Unable to load conf map details</div>
    </div>
    <div class="svc-over-view" v-if="isCmName">
        <div class="d-flex flex-row-reverse p-2 confmap-options">
            <EditResource :editCommand="cmEditCommand" buttonText="Edit ConfigMap" />
        </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="0">Data</Tab>
                <Tab value="1">Describe</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <ConfigMapData />
                </TabPanel>
                <TabPanel value="1">
                    <DescribeViewer :describeCommand="cmDescribeCommand" />
                </TabPanel>

            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.confmap-options{
    background-color: var(--p-surface-900);
}

</style>