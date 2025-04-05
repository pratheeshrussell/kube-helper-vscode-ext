export class Utils {
    public static getNonce() {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    public static getKubeEditorCommand(shell: string | undefined) {
        let setEditorCmd: string;
        if (shell?.toLowerCase().includes('powershell')) {
            setEditorCmd = '$env:KUBE_EDITOR = "code --wait --new-window --reuse-window"';
        } else if (shell?.toLowerCase().includes('cmd')) {
            setEditorCmd = 'set KUBE_EDITOR=code --wait --new-window --reuse-window';
        } else {
            setEditorCmd = 'export KUBE_EDITOR="code --wait --new-window --reuse-window"';
        }
        return setEditorCmd;
    }
}