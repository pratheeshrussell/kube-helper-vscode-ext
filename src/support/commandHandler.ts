import { exec } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { Utils } from './utils';


const execAsync = promisify(exec);
export const runCommand = async (command: string) => {
    try {
        const { stdout, stderr } = await execAsync(command);
        if (stderr) {
            return {
                output: stdout,
                error: true,
                errormessage: stderr
            };
        }
        return stdout.trim();
    } catch (error) {
        return {
            error: true,
            message: error
        };
    }
};

export const runCommandTerminal = async (command: string) => {
    try {
        const shell = vscode.workspace.getConfiguration('terminal').get<string>('integrated.defaultProfile.windows');
        const setEditorCmd = Utils.getKubeEditorCommand(shell);
        const terminal = vscode.window.createTerminal();
        terminal.sendText(setEditorCmd);
        terminal.show();
        terminal.sendText(command);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to execute command: ${error}`);
    }
};