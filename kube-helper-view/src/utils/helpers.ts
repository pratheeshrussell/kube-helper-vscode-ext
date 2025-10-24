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
        console.log("preparing command", cmd);
        return cmd;
    }

    static escapeRegex(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static approximateTextWidth(title: string, content: string, titleFontSize = 16, contentFontSize = 14) {
        // Average proportional font width factor ≈ 0.6 * font size per character
        const approxTitleWidth =title.length * titleFontSize * 0.6;
        const approxContentWidth = content.length * contentFontSize * 0.6;
        return Math.max(approxTitleWidth, approxContentWidth);
      }
}

