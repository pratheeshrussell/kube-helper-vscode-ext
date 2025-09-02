<template>
    <Button label="Connect to Node" 
    @click="updateDialogState(true)" 
    class="mx-2" size="small" icon="pi pi-play"
    aria-label="debug node" />

    <Dialog v-model:visible="isDialogVisible" modal header="Run a Debug Pod" :style="{ width: '25rem' }">
        <div class="d-flex align-items-end justify-content-end gap-2 mb-3 m-2">
            <Checkbox inputId="debug-cmd-edit" v-model="isEditManually" binary />
            <label class="mx-1" for="debug-cmd-edit">Edit full command </label>
        </div>

        <template v-if="!isEditManually">
            <div class="d-flex align-items-center gap-2 mb-3 m-2">
                <label for="pod-name" class="fw-semibold flex-shrink-0 mx-1">Pod Name</label>
                <InputText v-model="podName" id="pod-name" class="flex-grow-1" autocomplete="off" />
            </div>
            <div class="d-flex align-items-center gap-2 mb-3 m-2">
                <label for="debug-image" class="fw-semibold flex-shrink-0 mx-1">Select Image</label>
                <Select id="debug-image" v-model="selectedImage" editable :options="ImageOptions" />
            </div>
        </template>

        <template v-else>
            <div class="d-flex align-items-center gap-2 mb-3 m-2">
                <label for="command" class="fw-semibold flex-shrink-0 mx-1">Command</label>
                <Textarea v-model="tmpPodCommand" autoResize rows="3" cols="50" id="command" class="flex-grow-1" />
            </div>
        </template>

        <div class="d-flex justify-content-end gap-2 m-2">
            <Button type="button" class="mx-2" label="Cancel" severity="secondary"
                @click="updateDialogState(false)"></Button>
            <Button type="button" class="mx-2" label="Create Pod" @click="acceptDialog"></Button>
        </div>
    </Dialog>

</template>

<script setup lang="ts">
import { MessageTypes } from '@common/messageTypes';
import { HelperUtils } from '@src/utils/helpers';
import { onMounted, ref, watch } from 'vue';

const inputprops = defineProps({
    execCommand: {
        type: String,
        required: true
    }
});

const isDialogVisible = ref(false);
const isEditManually = ref(false);


const selectedImage = ref('busybox:latest');
const ImageOptions = ref([
    'busybox:latest', 
    'alpine:latest',
    'ubuntu:latest',
    'nicolaka/netshoot:latest'
]);

const podName = ref('debug-node-pod');


const tmpPodCommand = ref('');

watch(selectedImage, () => {
    generateExecCommand();
});

onMounted(() => {
    generateExecCommand();
});


const updateDialogState = (newState: boolean) => {
    isDialogVisible.value = newState;
};

const acceptDialog = () => {
    isDialogVisible.value = false;
    sendExecCommand();
};

const generateExecCommand = () => {
    tmpPodCommand.value = HelperUtils.prepareCommand(
        inputprops.execCommand
            .replace('{{image}}', selectedImage.value)
            )
}

const sendExecCommand = () => {
    if (!tmpPodCommand.value || tmpPodCommand.value.trim() == '') {
        return;
    }

    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_TERMINAL,
        subType: 'runnodeexec',
        command: tmpPodCommand.value
    });
};
</script>