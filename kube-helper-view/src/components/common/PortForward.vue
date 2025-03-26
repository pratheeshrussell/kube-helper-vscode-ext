<template>
    <Button label="Port fwd" @click="updateDialogState(true)" class="mx-2"
    size="small" icon="pi pi-angle-double-right" aria-label="port forward a resource" />

    <Dialog v-model:visible="isDialogVisible" modal header="Specify the port to forward" :style="{ width: '25rem' }">
        <div class="d-flex align-items-center gap-2 mb-3 m-2">
            <label for="resource-port" class="fw-semibold flex-shrink-0 mx-1">Resource Port</label>
            <InputNumber v-model="resourcePort" id="resource-port" class="mx-2" fluid autocomplete="off" />
        </div>
        <div class="d-flex align-items-center gap-2 mb-3 m-2">
            <label for="host-port" class="fw-semibold flex-shrink-0 mx-1">Local Port</label>
            <InputNumber v-model="hostPort" id="host-port" class="mx-2" fluid autocomplete="off" />
        </div>
        <div class="d-flex justify-content-end gap-2 m-2">
            <Button type="button" class="mx-2" label="Cancel" severity="secondary" @click="updateDialogState(false)"></Button>
            <Button type="button" class="mx-2" label="Forward" @click="acceptDialog"></Button>
        </div>
    </Dialog>

</template>

<script setup lang="ts">
import { MessageTypes } from '@common/messageTypes';
import { HelperUtils } from '@src/utils/helpers';
import { ref } from 'vue';

const inputprops = defineProps({
    portfwdCommand: {
        type: String,
        required: true
    }
});

const isDialogVisible = ref(false);


const resourcePort = ref(80);
const hostPort = ref(8000);

const updateDialogState = (newState: boolean) => {
    isDialogVisible.value = newState;
};

const acceptDialog = () => {
    isDialogVisible.value = false;
    sendExecCommand();
};

const sendExecCommand = () => {
    let portMapping = `${hostPort.value}:${resourcePort.value}`;
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_TERMINAL,
        subType: 'runexec',
        command: HelperUtils.prepareCommand(inputprops.portfwdCommand.replace('{{portmapping}}', portMapping))
    });
};
</script>