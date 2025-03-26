import * as vscode from 'vscode';
import { SidebarUIProvider } from './lib/sidebar';

export function activate(context: vscode.ExtensionContext) {
	
	const sideBarProvider = new SidebarUIProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'kube-helper-sidebar',
			sideBarProvider
		)
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
