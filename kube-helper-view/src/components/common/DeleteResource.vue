<template>
    <div class="d-flex align-items-center mx-2">
        <Button icon="pi pi-times" :label="buttonText" size="small" 
        aria-label="Del Resource" @click="sendRemoveCommand" />
    </div>
</template>

<script setup lang="ts">
import { MessageTypes } from '@common/messageTypes';
import { HelperUtils } from '@src/utils/helpers';


const inputprops = defineProps({
    deleteCommand: {
        type: String,
        required: true
    },
    buttonText: {
        type: String,
        default: 'Delete'
    }
});
const emit = defineEmits(['deleted']);

const sendRemoveCommand = () => {
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'rundelete',
        command: HelperUtils.prepareCommand(inputprops.deleteCommand)
    });
};

window.addEventListener('message', (event) => {
    if (event.data.type == "rundelete") {
        if (event.data.data) {
            emit('deleted');
        }
    }
});
</script>