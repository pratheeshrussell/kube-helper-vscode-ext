import { exec } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { Utils } from './utils';


const execAsync = promisify(exec);
export const runCommand = async (command: string) => {
    try {
        // Execute the command. Note that execAsync throws if the command exits with a non-zero code.
        const { stdout, stderr } = await execAsync(command);
        return {
            success: true,
            stdout: stdout.trim(),
            stderr: stderr.trim()
        };
    } catch (error: any) {
        // error from execAsync usually has stdout and stderr properties if the command ran but failed
        return {
            success: false,
            error: error.message || 'Command execution failed',
            stdout: error.stdout ? error.stdout.trim() : '',
            stderr: error.stderr ? error.stderr.trim() : ''
        };
    }
};

// runCommandTerminal remains unchanged, assuming it's used for different purposes (like kubectl edit)
export const runCommandTerminal = async (command: string) => {
    try {
        const terminal = vscode.window.createTerminal({
            env:{
                "KUBE_EDITOR": "code --wait --new-window --reuse-window"
            },
            isTransient: false
        });
        terminal.show();
        terminal.sendText(command, true);
    } catch (error: any) { // Added :any type for error
        vscode.window.showErrorMessage(`Failed to execute command: ${error.message || error}`);
    }
};