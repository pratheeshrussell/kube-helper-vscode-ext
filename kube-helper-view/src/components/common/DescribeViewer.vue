<template>
    <div class="d-flex justify-content-between mb-2">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="searchTerm" placeholder="Find" />
            </IconField>

            <RefreshData :reloadFunction="getLogs" />
    </div>
    <Message v-if="describeErrorMessage" severity="error" :closable="false" class="mb-2">{{ describeErrorMessage }}</Message>
    <div v-if="!loading">
        <v-ace-editor v-if="!describeErrorMessage" v-model:value="logData" readonly @init="editorInit" lang="text" theme="cloud_editor_dark"
            style="height: 300px" />
        <div v-else class="p-3 border rounded bg-surface-100 text-muted" style="height: 300px; overflow-y: auto;">
            Error loading describe output. See message above.
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import Message from 'primevue/message'; // Import Message
import ace from 'ace-builds';
import { MessageTypes } from '@common/messageTypes';
import { HelperUtils } from '@src/utils/helpers';
import { VAceEditor } from 'vue3-ace-editor';

const inputprops = defineProps({
    describeCommand: {
        type: String,
        required: true
    }
});

const loading = ref(true);
const searchTerm = ref('');

const logData = ref('');
const describeErrorMessage = ref<string | null>(null);
const editor = ref<ace.Editor | null>(null);

const getLogs = () => { // Consider renaming to getDescribeData for clarity
    loading.value = true;
    describeErrorMessage.value = null;
    logData.value = ''; // Clear previous data
    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'getDescribe',
        command: HelperUtils.prepareCommand(inputprops.describeCommand)
    });
};

function editorInit(aceEditor: any) {
    aceEditor.commands.removeCommand('find');
    editor.value = aceEditor;
}

watch(searchTerm, () => {
    handleSearch(searchTerm.value);
});

function handleSearch(searchTerm: string) {
    if (!editor.value) return;

    const session = editor.value.getSession();

    // Deepseek wrote this
    try {
        session.clearAnnotations();
        session.highlight(new RegExp(''));

        if(searchTerm.trim() === '') {
            editor.value.gotoLine(1,1, true);
            editor.value.renderer.updateFull();

            return;
        }
        
        const re_search = new RegExp(HelperUtils.escapeRegex(searchTerm), 'gi');

        const matches: any = [];
        const lines = session.getDocument().getAllLines();

        lines.forEach((line, row) => {
            let match;
            while ((match = re_search.exec(line)) !== null) {
                matches.push({
                    row: row,
                    column: match.index,
                    text: match[0]
                });

                // Avoid infinite loop for zero-length matches
                if (match.index === re_search.lastIndex) {
                    re_search.lastIndex++;
                }
            }
        });

        // Highlight matches
        if (matches.length > 0) {
            session.highlight(re_search);

            // Scroll to first match
            editor.value.gotoLine(matches[0].row + 1, matches[0].column, true);

            // Add annotations for all matches
            session.setAnnotations(matches.map((match: any) => ({
                row: match.row,
                column: match.column,
                text: `Found "${match.text}"`,
                type: 'info' // can be 'error', 'warning', or 'info'
            })));
        } else {
            session.setAnnotations([{
                row: 0,
                column: 0,
                text: 'No matches found',
                type: 'warning'
            }]);
        }
    } catch (e) {
        //console.error('Invalid search pattern:', e);
        session.setAnnotations([{
            row: 0,
            column: 0,
            text: 'Invalid search pattern',
            type: 'error'
        }]);
    }
    // Force editor to update
  editor.value.renderer.updateFull();
}

window.addEventListener('message', (event) => {
    if (event.data.type == "getDescribe") {
        loading.value = false;
        describeErrorMessage.value = null;
        if (event.data.data) {
            if (event.data?.data?.error) {
                describeErrorMessage.value = `Failed to fetch describe output: ${event.data.data.errormessage || 'Unknown error'}. ${event.data.data.output || ''}`.trim();
                logData.value = ''; // Ensure editor is cleared
            } else {
                logData.value = event.data.data;
            }
        } else {
            describeErrorMessage.value = "Received empty data for describe output.";
            logData.value = '';
        }
    }
});

onMounted(() => {
    getLogs(); // This will also reset describeErrorMessage
});
</script>