<template>
    <Button label="Exec" @click="updateDialogState(true)" class="mx-2"
    size="small" icon="pi pi-play" aria-label="exec into resource" />


    <Dialog v-model:visible="isDialogVisible" modal header="Command to Run" :style="{ width: '25rem' }">
        <span class="text-muted d-block mb-3">Choose the command to run</span>
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
        <div class="d-flex align-items-center gap-2 mb-3 m-2" v-if="command === 'custom'">
            <label for="command" class="fw-semibold flex-shrink-0 mx-1">Command</label>
            <InputText v-model="commandText" id="command" class="flex-grow-1" autocomplete="off" />
        </div>
        <div class="d-flex justify-content-end gap-2 m-2">
            <Button type="button" class="mx-2" label="Cancel" severity="secondary" @click="updateDialogState(false)"></Button>
            <Button type="button" class="mx-2" label="Run" @click="acceptDialog"></Button>
        </div>
    </Dialog>

</template>

<script setup lang="ts">
import { MessageTypes } from '@common/messageTypes';
import { HelperUtils } from '@src/utils/helpers';
import { ref } from 'vue';

const inputprops = defineProps({
    execCommand: {
        type: String,
        required: true
    }
});

const isDialogVisible = ref(false);

const command = ref('bash');
const commandText = ref('');

const updateDialogState = (newState: boolean) => {
    isDialogVisible.value = newState;
};

const acceptDialog = () => {
    isDialogVisible.value = false;
    sendExecCommand();
};

const sendExecCommand = () => {
    let execCommandTorun = command.value;
    if (command.value === 'custom') {
        execCommandTorun = commandText.value;
    }
    if(!execCommandTorun || execCommandTorun.trim() == ''){
        return;
    }
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_TERMINAL,
        subType: 'runexec',
        command: HelperUtils.prepareCommand(inputprops.execCommand.replace('{{command}}', execCommandTorun))
    });
};
</script>