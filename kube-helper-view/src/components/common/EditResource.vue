<template>
    <div class="d-flex align-items-center mx-2">
        <Button icon="pi pi-pencil" :label="buttonText" size="small" 
        aria-label="Edit Resource" @click="sendEditCommand" />
    </div>
</template>

<script setup lang="ts">
import { MessageTypes } from '@common/messageTypes';
import { HelperUtils } from '@src/utils/helpers';

const editPrefix = 'KUBE_EDITOR="code --wait --new-window --reuse-window" ';
const inputprops = defineProps({
    editCommand: {
        type: String,
        required: true
    },
    buttonText: {
        type: String,
        default: 'Edit'
    }
});
const emit = defineEmits(['command-run']);

const sendEditCommand = () => {
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_TERMINAL,
        subType: 'runedit',
        command: editPrefix + HelperUtils.prepareCommand(inputprops.editCommand)
    });
};

window.addEventListener('message', (event) => {
    if (event.data.type == "runedit") {
        if (event.data.data) {
            emit('command-run');
        }
    }
});
</script>