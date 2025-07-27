<template>
    <Button label="Run Debug Pod" @click="updateDialogState(true)" class="mx-2" size="small"
        aria-label="create a debug pod" />

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
            <span class="text-muted d-block mb-3">Command to run</span>
            <div class="d-flex align-items-center gap-2 mb-3 m-2">
                <div class="d-flex flex-wrap gap-2 m-2">
                    <div class="d-flex align-items-center gap-2 mx-1">
                        <RadioButton v-model="command" inputId="command1" name="execcommand" value="bash" />
                        <label class="mx-1" for="command1">bash</label>
                    </div>
                    <div class="d-flex align-items-center gap-2 mx-1">
                        <RadioButton v-model="command" inputId="command2" name="execcommand" value="sh" />
                        <label class="mx-1" for="command2">sh</label>
                    </div>
                    <div class="d-flex align-items-center gap-2 mx-1">
                        <RadioButton v-model="command" inputId="command3" name="execcommand" value="custom" />
                        <label class="mx-1" for="command3">Custom</label>
                    </div>
                </div>
            </div>
            <div class="d-flex align-items-center gap-2 mb-3 m-2" v-if="command === 'custom'">
                <label for="command" class="fw-semibold flex-shrink-0 mx-1">Command</label>
                <InputText v-model="commandText" id="command" class="flex-grow-1" autocomplete="off" />
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
import { kubeCmds } from '@src/constants/commands';
import { HelperUtils } from '@src/utils/helpers';
import { onMounted, ref, watch } from 'vue';

// const inputprops = defineProps({
//     namespace: {
//         type: String,
//         required: true
//     }
// });

const isDialogVisible = ref(false);
const isEditManually = ref(false);


const selectedImage = ref('busybox:latest');
const ImageOptions = ref([
    'busybox:latest', 
    'postgres:latest',
    'alpine:latest',
    'ubuntu:latest',
    'edenhill/kcat:1.7.1',
    'praqma/network-multitool:latest',
    'nicolaka/netshoot:latest'
]);

const podName = ref('debug-pod');

const command = ref('sh');
const commandText = ref('');

const tmpPodCommand = ref('');

watch(command, () => {
    generateExecCommand();
});
watch(selectedImage, () => {
    generateExecCommand();
});
watch(commandText, () => {
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
    let execCommandTorun = command.value;
    if (command.value === 'custom') {
        execCommandTorun = commandText.value;
    }
    if (!execCommandTorun || execCommandTorun.trim() == '') {
        return;
    }
    tmpPodCommand.value = HelperUtils.prepareCommand(
        kubeCmds.runDebugPod
            .replace('{{podName}}', podName.value)
            .replace('{{image}}', selectedImage.value)
            .replace('{{command}}', execCommandTorun))
}

const sendExecCommand = () => {

    if (!tmpPodCommand.value || tmpPodCommand.value.trim() == '') {
        return;
    }

    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_TERMINAL,
        subType: 'runexec',
        command: tmpPodCommand.value
    });
};
</script>