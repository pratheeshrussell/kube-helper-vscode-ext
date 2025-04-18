<template>
    <div class="d-flex justify-content-between mb-2">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="searchTerm" placeholder="Find" />
            </IconField>
            <div class="d-flex align-items-center">
                <span class="d-flex me-2" v-if="allowPrevious">
                    <Checkbox  v-model="addPrevOption" 
                    inputId="log-prev" binary />
                    <label for="log-prev" class="mx-1"> Previous </label>
                </span>
                <Button label="Follow Log" size="small" class="mx-1"
                    aria-label="Follow log Data" @click="followLogData" />
                <RefreshData :reloadFunction="getLogData" />
            </div>
            
    </div>
    <div v-if="!loading">
        <v-ace-editor v-model:value="logData" readonly @init="editorInit" lang="text" theme="cloud_editor_dark"
            style="height: 300px" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import ace from 'ace-builds';
import { MessageTypes } from '@common/messageTypes';
import { HelperUtils } from '@src/utils/helpers';
import { VAceEditor } from 'vue3-ace-editor';

const inputprops = defineProps({
    logCommand: {
        type: String,
        required: true
    },
    allowPrevious: {
        type: Boolean,
        default: false
    }
});

const loading = ref(true);
const searchTerm = ref('');

const logData = ref('');
const editor = ref<ace.Editor | null>(null);
const addPrevOption = ref(false);

const getLogData = () => {
    loading.value = true;
    let cmd = inputprops.logCommand;
    if(addPrevOption.value) {
        cmd = cmd + ' --previous';
    }

    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_RESULT,
        subType: 'getLog',
        command: HelperUtils.prepareCommand(cmd)
    });
};

const followLogData = () => {
    let cmd = inputprops.logCommand;
    if(addPrevOption.value) {
        cmd = cmd + ' --previous';
    }
    cmd = cmd + ' -f';

    tsvscode?.postMessage({
        type: MessageTypes.RUN_CMD_TERMINAL,
        subType: 'followLog',
        command: HelperUtils.prepareCommand(cmd)
    });
};

watch(addPrevOption, () => {
    getLogData();
});

function editorInit(aceEditor: any) {
    aceEditor.commands.removeCommand('find');
    editor.value = aceEditor;
}

watch(searchTerm, () => {
    handleSearch(searchTerm.value);
});

const handleSearch = (searchTerm: string) => {
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
    if (event.data.type == "getLog") {
        if (event.data.data) {
            if (event.data?.data?.error) {
                logData.value = event.data?.data?.errormessage +
                    '\n' + event.data?.data?.output;
            } else {
                logData.value = event.data.data;
            }
        }
    }
    loading.value = false;
});

onMounted(() => {
    getLogData();
});
</script>