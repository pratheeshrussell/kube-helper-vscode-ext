<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { globalStore } from '../../store/store';
import { useRoute } from 'vue-router';
import DescribeViewer from '../common/DescribeViewer.vue';
import { kubeCmds } from '@src/constants/commands';
import { HelperUtils } from '@src/utils/helpers';
import SecretData from './elementList/SecretData.vue';
import EditResource from '../common/EditResource.vue';

const route = useRoute();

const secretName = ref('');

const value = ref('0');
const isSecretName = ref(false);

const secretDescribeCommand = ref('');
const secretEditCommand = ref('');


onMounted(() => {
    const secretname = route.params.secretname;

    if((secretname !== null ) && 
    (typeof secretname === 'string')){
        secretName.value = secretname;
        
        isSecretName.value = true;

        secretDescribeCommand.value = HelperUtils.prepareCommand(
        kubeCmds.getDescribeSecret.replace("{{secretname}}",secretname));

        secretEditCommand.value = kubeCmds.editSecret.replace('{{secretname}}', secretname);
        
        globalStore.breadcrumbItems = [
            ...globalStore.breadcrumbItems,
            {
                label: secretname, 
                navigateTo: 'secretoverview', 
                params:{secretname: secretname},
                index: globalStore.breadcrumbItems.length
            }
        ];
    }
})

</script>

<template>
    <div class="svc-over-view" v-if="!isSecretName">
        <div>Unable to load secret details</div>
    </div>
    <div class="svc-over-view" v-if="isSecretName">
        <div class="d-flex flex-row-reverse p-2 secret-options">
            <EditResource :editCommand="secretEditCommand" buttonText="Edit Secret" />
        </div>
        <Tabs v-model:value="value" scrollable>
            <TabList>
                <Tab value="0">Data</Tab>
                <Tab value="1">Describe</Tab>
                
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <SecretData />
                </TabPanel>
                <TabPanel value="1">
                    <DescribeViewer :describeCommand="secretDescribeCommand" />
                </TabPanel>
                
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.secret-options{
    background-color: var(--p-surface-900);
}

</style>