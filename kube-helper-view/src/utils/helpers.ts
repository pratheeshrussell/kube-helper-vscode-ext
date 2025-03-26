import { globalStore } from "../store/store";

export class HelperUtils {
    static prepareCommand(command: string) {
        let cmd = command;
        if(!globalStore.context){
            cmd = cmd.replace(/{{context}}/g, '');
        }else{
            cmd = cmd.replace(/{{context}}/g, `--context=${globalStore.context}`);
        }
        if(!globalStore.namespace){
            cmd = cmd.replace(/{{namespace}}/g, '--all-namespaces');
        }else{
            cmd = cmd.replace(/{{namespace}}/g, `--namespace=${globalStore.namespace}`);
        }
        console.log("running command", cmd);
        return cmd;
    }

    static escapeRegex(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}