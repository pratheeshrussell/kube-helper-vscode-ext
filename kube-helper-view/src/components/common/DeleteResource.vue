<template>
    <div class="d-flex align-items-center mx-2">
        <Button icon="pi pi-times" :label="buttonText" size="small" 
        aria-label="Del Resource" @click="sendRemoveCommand" />
    </div>
</template>

<script setup lang="ts">
import { MessageTypes } from '@common/messageTypes';
import { HelperUtils } from '@src/utils/helpers';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

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
    if (event.data.type === "rundelete" && event.data.command === HelperUtils.prepareCommand(inputprops.deleteCommand)) {
        const messageData = event.data.data;
        if (messageData && !messageData.error) {
            toast.add({ severity: 'success', summary: 'Success', detail: messageData.output || 'Resource deleted successfully.', life: 3000 });
            emit('deleted');
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: `Failed to delete resource: ${messageData?.errormessage || messageData?.output || 'Unknown error'}`, life: 5000 });
            // Optionally emit a 'delete-failed' event if parent components need to react
        }
    }
});
</script>