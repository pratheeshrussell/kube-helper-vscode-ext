<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import { kubeCmds } from '@src/constants/commands';
import EditResource from '../common/EditResource.vue';

const route = useRoute();

const ingressName = ref('');

const value = ref('0');
const isIngressName = ref(false);

const ingressDescribeCommand = ref('');
const ingressEditCommand = ref('');


onMounted(() => {
    const ingressname = route.params.ingressname;

    if((ingressname !== null ) && 
    (typeof ingressname === 'string')){
        ingressName.value = ingressname;
        
        isIngressName.value = true;

        ingressDescribeCommand.value = kubeCmds.describeNamespacedResource
        .replace("{{resType}}", 'ingress')
        .replace("{{resName}}", ingressname);

        ingressEditCommand.value = kubeCmds.editNamespacedResource.replace("{{resType}}", 'ingress')
        .replace("{{resName}}", ingressname);
        
        globalStore.breadcrumbItems = [
            ...globalStore.breadcrumbItems,
            {
                label: ingressname, 
                navigateTo: 'ingressoverview', 
                params:{ingressname: ingressname},
                index: globalStore.breadcrumbItems.length
            }
        ];
    }
})

</script>

<template>
    <div class="ing-over-view" v-if="!isIngressName">
        <div>Unable to load ingress details</div>
    </div>
    <div class="ing-over-view" v-if="isIngressName">
        <div class="d-flex flex-row-reverse p-2 ingress-options">
            <EditResource :editCommand="ingressEditCommand" buttonText="Edit Ingress" />
        </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="0">Describe</Tab>
                
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <DescribeViewer :describeCommand="ingressDescribeCommand" />
                </TabPanel>
                
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.ingress-options{
    background-color: var(--p-surface-900);
}

</style>