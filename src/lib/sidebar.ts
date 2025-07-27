import * as vscode from "vscode";
import { MessageTypes } from "../../common/messageTypes";
import { Utils } from "../support/utils";
import { runCommand } from "../support/commandHandler";
import CreateClusterDetailsPanelUI from "./clusterDetailsPanel";


export class SidebarUIProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;

    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
            
        };

        
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        
        // Listen for messages from the Sidebar component and execute action
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case MessageTypes.VIEW_READY: {
                    vscode.window.showInformationMessage('Kube helper sidebar active');  
                    break;
                }  
                case MessageTypes.RUN_CMD_RESULT: {
                    runCommand(data.command).then((result) => {
                        webviewView.webview.postMessage({
                            type: data.subType,
                            data: result
                        });
                    });
                    
                    break;
                }  
                case MessageTypes.SHOW_DETAILS: {
                    const clusterName = data.clusterName;
                    const contextName = data.contextName;
                    if(clusterName){
                        const clusterParams = {
                            clusterName: clusterName,
                            contextName: contextName
                        };
                        const clusterDetailsPanel= new CreateClusterDetailsPanelUI(this._extensionUri, clusterParams);
                        clusterDetailsPanel.show('Cluster ' + clusterName);
                    }
                    break;
                }  
            }
        });

    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        let themeKind:vscode.ColorThemeKind = vscode.window.activeColorTheme.kind;
        
        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "assets","css", "reset.css")
        );
        const styleBootstrapUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "assets","css", "bootstrap-grid.min.css")
        );
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "assets","css", "vscode.css")
        );
        const styleprimeIcon = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "assets","css", "primeicons.css")
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this._extensionUri, "dist/view/view.bundle.js")
        );
        
        const styleMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "dist/view/view.css")
        );
        
        vscode.window.onDidChangeActiveColorTheme(() => {
            themeKind = vscode.window.activeColorTheme.kind;
            webview.postMessage({type: "onThemeChange", value: themeKind});
        });
        // Use a nonce to only allow a specific script to be run.
        const nonce = Utils.getNonce();

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource
            }; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleBootstrapUri}" rel="stylesheet">
                <link href="${styleprimeIcon}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">
                <script nonce="${nonce}">
                    const tsvscode = acquireVsCodeApi();
                </script>

			</head>
            <body class="sidebar" data-page="sidebar" data-theme="${themeKind}">
                <div id="kube-helper-app"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}