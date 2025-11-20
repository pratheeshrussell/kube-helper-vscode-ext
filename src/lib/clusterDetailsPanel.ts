import * as vscode from 'vscode';
import { MessageTypes } from '../../common/messageTypes';
import { Utils } from '../support/utils';
import { runCommand, runCommandTerminal } from '../support/commandHandler';

export default class CreateClusterDetailsPanelUI {

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _params: {
            clusterName: string;
            contextName: string;
        }
    ) { }
    show(title ="Cluster Details") {
        const panel = vscode.window.createWebviewPanel(
            'KubeHelperClusterDetailsWindow', // Unique identifier for the panel
            `Cluster ${this._params.clusterName}`, // Title displayed in the panel
            vscode.ViewColumn.One, // The column in which to show the panel
            {
              enableScripts:true,
              enableForms: true,
              retainContextWhenHidden: true,
            }
          );
          
          panel.title = `${title}`;
          
          panel.iconPath = {
            light: vscode.Uri.joinPath(this._extensionUri, 'assets/images/kube-helper.png'),
            dark: vscode.Uri.joinPath(this._extensionUri, 'assets/images/kube-helper.png')
          };
          panel.webview.onDidReceiveMessage(async (data) => {
            if (data.type === MessageTypes.RUN_CMD_TERMINAL) {
                // open terminal and run command
                runCommandTerminal(data.command);
            } else if (data.type === MessageTypes.RUN_CMD_RESULT) {
              // Run command and return result
              runCommand(data.command).then((result) => {
                panel.webview.postMessage({
                    type: data.subType,
                    data: result
                });
            });
            } else if (data.type === MessageTypes.GET_GRAPH_RESOURCES) {
                const namespace = data.namespace;
                const context = data.context;
                // --context=${globalStore.context}
                runCommand(`kubectl api-resources --namespaced=true -o name --context=${context}`).then(apiResult => {
                    if (typeof apiResult !== 'string' || apiResult.includes('error')) {
                        panel.webview.postMessage({ type: MessageTypes.GRAPH_RESOURCES_RESULT, data: {} });
                        return;
                    }
                    const resourceTypes = apiResult.split(/\s+/).filter(Boolean);
                    const promises = resourceTypes.map(rt => runCommand(`kubectl get ${rt} -n ${namespace} --context=${context} -o json`));
                    Promise.all(promises).then(results => {
                        const resources: Record<string, any> = {};
                        results.forEach((result, index) => {
                            const resourceType = resourceTypes[index];
                            try {
                                if (typeof result === 'string' && !result.startsWith('error')) {
                                    resources[resourceType] = JSON.parse(result);
                                } else {
                                    resources[resourceType] = { items: [] };
                                }
                            } catch (e) {
                                resources[resourceType] = { items: [] };
                            }
                        });
                        panel.webview.postMessage({ type: MessageTypes.GRAPH_RESOURCES_RESULT, data: resources });
                    });
                });
            } else if (data.type === MessageTypes.DESCRIBE_RESOURCE) {
                const { resourceType, resourceName, namespace } = data;
                runCommand(`kubectl describe ${resourceType} ${resourceName} -n ${namespace}`).then(result => {
                    panel.webview.postMessage({ type: MessageTypes.DESCRIBE_RESOURCE_RESULT, data: result });
                });
            }
          });
          // Set the HTML content in the webview panel
          panel.webview.html = this.getPanelTemplateHTML(panel.webview);
    }


    getPanelTemplateHTML(webview: vscode.Webview, requestData: string = '') {
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
                <link href="${styleprimeIcon}" rel="stylesheet">
				<link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleBootstrapUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">
                <script nonce="${nonce}">
                    const tsvscode = acquireVsCodeApi();
                </script>

			</head>
            <body class="cluster-details" data-page="clusteroverview" data-theme="${themeKind}" 
            data-cluster-name="${this._params.clusterName}"
            data-context-name="${this._params.contextName}">
                <div id="kube-helper-app"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}