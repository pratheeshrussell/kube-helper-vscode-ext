import * as vscode from 'vscode';
import { SidebarUIProvider } from './lib/sidebar';
import { runCommand } from './support/commandHandler';
import { MessageTypes } from '../common/messageTypes';

export function activate(context: vscode.ExtensionContext) {
	
	const sideBarProvider = new SidebarUIProvider(context.extensionUri);

	vscode.commands.registerCommand('kube-helper.context-refresh', () => {
		if(sideBarProvider._view){
			const getContextCommand = {
				type: MessageTypes.RUN_CMD_RESULT,
				subType: 'clusterDetails',
				command: 'kubectl config view -o json'
			};
			runCommand(getContextCommand.command).then((result) => {
				sideBarProvider._view?.webview.postMessage({
					type: getContextCommand.subType,
					data: result
				});
			});
		}
	});
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'kube-helper-sidebar',
			sideBarProvider
		)
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
