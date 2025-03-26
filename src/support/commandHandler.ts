import { exec } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';


const execAsync = promisify(exec);
export const runCommand = async (command: string) => {
    try {
        const { stdout, stderr } = await execAsync(command);
        if (stderr) {
            return {
                output: stdout,
                error: true,
                errormessage: stderr
            }
        }
        return stdout.trim();
    } catch (error) {
        return {
            error: true,
            message: error
        }
    }
}

export const runCommandTerminal = async (command: string) => {
    try {
        const terminal = vscode.window.createTerminal();
        terminal.show();
        terminal.sendText(command);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to execute command: ${error}`);
    }
}