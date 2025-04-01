import { Tooltip } from "primevue";
import type { App } from "vue";

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import InputIcon from 'primevue/inputicon';
import IconField from 'primevue/iconfield';
import Button from 'primevue/button';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import DataView from 'primevue/dataview';
import Dialog from 'primevue/dialog';
import RadioButton from 'primevue/radiobutton';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';


import RefreshData from "../components/common/RefreshData.vue";
import { VAceEditor } from 'vue3-ace-editor';
import 'ace-builds/src-noconflict/mode-text';
import 'ace-builds/src-noconflict/ext-searchbox';

import 'ace-builds/src-noconflict/theme-cloud_editor_dark';
import 'ace-builds/src-noconflict/theme-cloud_editor';



export const loadPrimeComponents = (app: App<Element>) => {
    app.directive('tooltip', Tooltip);

    const components = {
        DataTable, Column, InputText, InputIcon, Checkbox,
        IconField, Button,Tabs, TabList, Tab, InputNumber,
        TabPanels, TabPanel,DataView, Dialog,RadioButton,
        RefreshData,VAceEditor
    }
    
    Object.entries(components).forEach(([key, value]) => {
        app.component(key, value);
    })
    
    
}