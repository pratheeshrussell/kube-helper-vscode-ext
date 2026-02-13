import * as vscode from 'vscode';
import { MessageTypes } from '../../common/messageTypes';
import { Utils } from '../support/utils';
import { runCommand, runCommandTerminal } from '../support/commandHandler';
import { EventWatcher } from '../support/eventWatcher';


export default class CreateClusterDetailsPanelUI {

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _params: {
            clusterName: string;
            contextName: string;
        }
    ) { }
    show(title = "Cluster Details") {
        const panel = vscode.window.createWebviewPanel(
            'KubeHelperClusterDetailsWindow', // Unique identifier for the panel
            `Cluster ${this._params.clusterName}`, // Title displayed in the panel
            vscode.ViewColumn.One, // The column in which to show the panel
            {
                enableScripts: true,
                enableForms: true,
                retainContextWhenHidden: true,
            }
        );

        panel.title = `${title}`;

        panel.iconPath = {
            light: vscode.Uri.joinPath(this._extensionUri, 'assets/images/kube-helper.png'),
            dark: vscode.Uri.joinPath(this._extensionUri, 'assets/images/kube-helper.png')
        };

        // Subscribe panel to event watcher for timeline
        const eventWatcher = EventWatcher.getInstance(this._params.contextName);
        eventWatcher.subscribe(panel);

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
                const { resourceType, resourceName, namespace, context } = data;
                runCommand(`kubectl describe ${resourceType} ${resourceName} -n ${namespace} --context=${context}`).then(result => {
                    panel.webview.postMessage({ type: MessageTypes.DESCRIBE_RESOURCE_RESULT, data: result });
                });
            } else if (data.type === MessageTypes.GET_TIMELINE_EVENTS) {
                // Return buffered timeline events
                const events = eventWatcher.getEvents();
                panel.webview.postMessage({
                    type: MessageTypes.TIMELINE_EVENTS_RESULT,
                    data: events
                });
            } else if (data.type === MessageTypes.CLEAR_TIMELINE) {
                // Clear all timeline events
                eventWatcher.clearEvents();
            } else if (data.type === MessageTypes.GET_CLUSTER_STATS) {
                const context = data.context;
                console.log('cluster stats going to fetch...')
                Promise.all([
                    runCommand(`kubectl get pods --all-namespaces -o json --context=${context}`),
                    runCommand(`kubectl get nodes -o json --context=${context}`),
                    runCommand(`kubectl get deployments --all-namespaces -o json --context=${context}`),
                    runCommand(`kubectl get services --all-namespaces -o json --context=${context}`)
                ]).then(([pods, nodes, deployments, services]) => {
                    const getOut = (res: any) => typeof res === 'string' ? res : (res.output || '');
                    const stats = {
                        pods: this.parsePodStats(getOut(pods)),
                        nodes: this.parseNodeStats(getOut(nodes)),
                        deployments: this.parseDeploymentStats(getOut(deployments)),
                        services: this.parseServiceStats(getOut(services))
                    };
                    console.log('cluster stats', stats)
                    panel.webview.postMessage({ type: MessageTypes.CLUSTER_STATS_RESULT, data: stats });
                }).catch(err => {
                    console.error('Failed to fetch cluster stats:', err);
                });
            }
        });
        // Set the HTML content in the webview panel
        panel.webview.html = this.getPanelTemplateHTML(panel.webview);
    }


    getPanelTemplateHTML(webview: vscode.Webview, requestData: string = '') {
        let themeKind: vscode.ColorThemeKind = vscode.window.activeColorTheme.kind;

        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "assets", "css", "reset.css")
        );
        const styleBootstrapUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "assets", "css", "bootstrap-grid.min.css")
        );
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "assets", "css", "vscode.css")
        );
        const styleprimeIcon = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "assets", "css", "primeicons.css")
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
            webview.postMessage({ type: "onThemeChange", value: themeKind });
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

    private parsePodStats(output: string) {
        if (!output) { return { total: 0, running: 0, failed: 0, pending: 0 }; }
        try {
            const data = JSON.parse(output);
            const items = data.items || [];
            let running = 0, failed = 0, pending = 0;
            const failedPods: any[] = [];

            items.forEach((item: any) => {
                const phase = item.status?.phase;
                if (phase === 'Running' || phase === 'Succeeded') { running++; }
                else if (phase === 'Pending') { pending++; }
                else {
                    failed++;
                    failedPods.push({
                        name: item.metadata.name,
                        namespace: item.metadata.namespace,
                        reason: item.status.reason,
                        message: item.status.message
                    });
                }
            });

            return {
                total: items.length, running, failed, pending, data: {
                    failed: failedPods
                }
            };
        } catch (e) {
            console.error('Error parsing pod stats:', e);
            return { total: 0, running: 0, failed: 0, pending: 0 };
        }
    }

    private parseNodeStats(output: string) {
        if (!output) { return { total: 0, ready: 0, notReady: 0 }; }
        try {
            const data = JSON.parse(output);
            const items = data.items || [];
            let ready = 0;

            items.forEach((item: any) => {
                const conditions = item.status?.conditions || [];
                const readyCondition = conditions.find((c: any) => c.type === 'Ready');
                if (readyCondition && readyCondition.status === 'True') { ready++; }
            });

            return { total: items.length, ready, notReady: items.length - ready };
        } catch (e) {
            return { total: 0, ready: 0, notReady: 0 };
        }
    }

    private parseDeploymentStats(output: string) {
        if (!output) { return { total: 0, ready: 0, failed: 0 }; }
        try {
            const data = JSON.parse(output);
            const items = data.items || [];
            let readyCount = 0;

            items.forEach((item: any) => {
                const readyReplicas = item.status?.readyReplicas || 0;
                const replicas = item.spec?.replicas || 0;
                if (readyReplicas === replicas && replicas > 0) { readyCount++; }
            });

            return { total: items.length, ready: readyCount, failed: items.length - readyCount };
        } catch (e) {
            return { total: 0, ready: 0, failed: 0 };
        }
    }

    private parseServiceStats(output: string) {
        if (!output) { return { total: 0 }; }
        try {
            const data = JSON.parse(output);
            const items = data.items || [];
            return { total: items.length };
        } catch (e) {
            return { total: 0 };
        }
    }
}