import * as vscode from 'vscode';
import { K8sResourceNodeData, K8sVueFlowNode, K8sVueFlowEdge, MessageTypes, ResourceGraphData } from '../../common/messageTypes';
import { Utils } from './utils'; // Assuming Utils.executeCommand exists
import { HelperUtils } from './commandHandler'; // Assuming HelperUtils.prepareCommand exists and is suitable for backend

const k8sResourceKinds = [
    'deployments',
    'statefulsets',
    'daemonsets',
    'replicasets',
    'pods',
    'services',
    'ingresses'
];

function mapK8sStatus(resource: any): { status: string, health?: any, labelDetails?: string } {
    const kind = resource.kind;
    const statusObj = resource.status;

    if (!statusObj) return { status: 'Unknown' };

    switch (kind) {
        case 'Pod':
            let readyContainers = 0;
            let totalContainers = resource.spec?.containers?.length || 0;
            if (statusObj.containerStatuses) {
                statusObj.containerStatuses.forEach((cs: any) => {
                    if (cs.ready) {
                        readyContainers++;
                    }
                });
            }
            return {
                status: statusObj.phase || 'Unknown',
                health: { ready: readyContainers, desired: totalContainers },
                labelDetails: `${readyContainers}/${totalContainers} Ready`
            };
        case 'Deployment':
            const availableReplicas = statusObj.availableReplicas || 0;
            const desiredReplicas = resource.spec?.replicas || 0;
            let depStatus = 'Progressing';
            if (statusObj.conditions) {
                const availableCondition = statusObj.conditions.find((c: any) => c.type === 'Available' && c.status === 'True');
                const progressingCondition = statusObj.conditions.find((c: any) => c.type === 'Progressing' && c.status === 'True' && c.reason === 'NewReplicaSetAvailable');
                if (availableCondition && availableReplicas >= desiredReplicas) {
                    depStatus = 'Running';
                    if (progressingCondition) { // Still progressing but available
                        depStatus = 'Running'; // Or 'Updating'
                    }
                } else if (!availableCondition && desiredReplicas > 0) {
                    depStatus = 'Pending'; // Or check other conditions
                }
            }
             if (availableReplicas < desiredReplicas && desiredReplicas > 0) {
                depStatus = 'Pending';
            } else if (desiredReplicas === 0 && availableReplicas === 0) {
                depStatus = 'ScaledDown';
            }


            return {
                status: depStatus,
                health: { ready: availableReplicas, desired: desiredReplicas },
                labelDetails: `${availableReplicas}/${desiredReplicas} Ready`
            };
        case 'StatefulSet':
            const readyReplicasSfs = statusObj.readyReplicas || 0;
            const desiredReplicasSfs = resource.spec?.replicas || 0;
            let sfsStatus = 'Progressing';
            if (readyReplicasSfs >= desiredReplicasSfs && desiredReplicasSfs > 0) {
                sfsStatus = 'Running';
            } else if (desiredReplicasSfs > 0) {
                sfsStatus = 'Pending';
            } else if (desiredReplicasSfs === 0) {
                sfsStatus = 'ScaledDown';
            }
            return {
                status: sfsStatus,
                health: { ready: readyReplicasSfs, desired: desiredReplicasSfs },
                labelDetails: `${readyReplicasSfs}/${desiredReplicasSfs} Ready`
            };
        case 'DaemonSet':
            const numberReadyDs = statusObj.numberReady || 0;
            const desiredNumberScheduledDs = statusObj.desiredNumberScheduled || 0;
            return {
                status: (numberReadyDs >= desiredNumberScheduledDs && desiredNumberScheduledDs > 0) ? 'Running' : (desiredNumberScheduledDs > 0 ? 'Pending' : 'Idle'),
                health: { ready: numberReadyDs, desired: desiredNumberScheduledDs },
                labelDetails: `${numberReadyDs}/${desiredNumberScheduledDs} Ready`
            };
        case 'ReplicaSet':
            const availableReplicasRs = statusObj.availableReplicas || 0;
            const desiredReplicasRs = resource.spec?.replicas || 0;
            let rsStatus = 'Progressing';
             if (availableReplicasRs >= desiredReplicasRs && desiredReplicasRs > 0) {
                rsStatus = 'Running';
            } else if (desiredReplicasRs > 0) {
                rsStatus = 'Pending';
            } else if (desiredReplicasRs === 0) {
                 rsStatus = 'ScaledDown';
            }
            return {
                status: rsStatus,
                health: { ready: availableReplicasRs, desired: desiredReplicasRs },
                labelDetails: `${availableReplicasRs}/${desiredReplicasRs} Ready`
            };
        case 'Service':
            return {
                status: resource.spec?.type || 'Unknown',
                labelDetails: `Type: ${resource.spec?.type}`
            };
        case 'Ingress':
            // Ingress status is often external, or via annotations. For now, just 'Active'.
            return {
                status: 'Active'
            };
        default:
            return { status: 'Unknown' };
    }
}


export async function handleGetResourceGraph(
    webviewView: vscode.WebviewView,
    namespace: string,
    context: string | null | undefined
): Promise<void> {
    const nodes: K8sVueFlowNode[] = [];
    const edges: K8sVueFlowEdge[] = [];
    const nodeMapByUid = new Map<string, K8sVueFlowNode>();
    const allResources: any[] = [];

    try {
        for (const kind of k8sResourceKinds) {
            // Assuming HelperUtils.prepareCommand can take context. If not, adjust.
            // And assuming it correctly forms namespaced commands.
            let cmd = `kubectl get ${kind} -n ${namespace} -o json`;
            if (context) { // Assuming prepareCommand doesn't auto-inject context or we want to be sure
                cmd = HelperUtils.prepareCommand(cmd.replace('{{namespace}}', namespace).replace('{{context}}', `--context=${context}`));
            } else {
                 cmd = HelperUtils.prepareCommand(cmd.replace('{{namespace}}', namespace).replace('{{context}}', ''));
            }


            const result = await Utils.executeCommand(cmd);
            if (result.stderr && !result.stdout) { // Some commands might output to stderr for warnings but still succeed
                // Only treat as error if stdout is empty
                console.warn(`Warning/Error fetching ${kind} in ${namespace}: ${result.stderr}`);
                // Continue to next resource kind
            }
            if (result.stdout) {
                const list = JSON.parse(result.stdout);
                if (list && list.items) {
                    allResources.push(...list.items);
                }
            }
        }

        // First pass: Create all nodes
        allResources.forEach(res => {
            if (!res.metadata || !res.metadata.uid || !res.kind || !res.metadata.name) {
                console.warn('Skipping resource due to missing essential metadata:', res);
                return;
            }

            const { status, health, labelDetails } = mapK8sStatus(res);
            const resourceId = `${res.kind.toLowerCase()}/${res.metadata.namespace || 'cluster'}/${res.metadata.name}`;

            const nodeData: K8sResourceNodeData = {
                id: resourceId,
                kind: res.kind,
                name: res.metadata.name,
                namespace: res.metadata.namespace,
                uid: res.metadata.uid,
                apiVersion: res.apiVersion,
                labels: res.metadata.labels, // Added labels
                status: status,
                health: health,
                labelDetails: labelDetails,
            };

            const node: K8sVueFlowNode = {
                id: resourceId, // Vue Flow node ID, use unique resourceId
                type: 'k8sNode',
                label: res.metadata.name, // Or kind:name
                position: { x: 0, y: 0 }, // Dagre will set this
                data: nodeData,
            };
            nodes.push(node);
            nodeMapByUid.set(res.metadata.uid, node);
        });

        // Second pass: Create edges
        allResources.forEach(res => {
            const childNode = nodeMapByUid.get(res.metadata.uid);
            if (!childNode) return;

            // OwnerReferences
            if (res.metadata.ownerReferences) {
                res.metadata.ownerReferences.forEach((ownerRef: any) => {
                    const parentNode = nodeMapByUid.get(ownerRef.uid);
                    if (parentNode) {
                        edges.push({
                            id: `e-${parentNode.data.id}-${childNode.data.id}`,
                            source: parentNode.id, // Use Vue Flow node ID
                            target: childNode.id, // Use Vue Flow node ID
                            animated: true,
                        });
                    }
                });
            }

            // Service to Pods
            if (res.kind === 'Service' && res.spec && res.spec.selector) {
                const serviceSelector = res.spec.selector;
                // Iterate over all processed resources to find matching pods (or other workloads)
                allResources.forEach(potentialTargetRes => {
                    if (potentialTargetRes.metadata?.namespace === res.metadata.namespace &&
                        potentialTargetRes.metadata?.labels) {
                        // Check if this resource's labels match the service selector
                        let match = true;
                        for (const key in serviceSelector) {
                            if (potentialTargetRes.metadata.labels[key] !== serviceSelector[key]) {
                                match = false;
                                break;
                            }
                        }
                        if (match) {
                            const targetNode = nodeMapByUid.get(potentialTargetRes.metadata.uid);
                            if (targetNode) {
                                edges.push({
                                    id: `e-${childNode.id}-${targetNode.id}`, // Service to matching Pod/Workload
                                    source: childNode.id,
                                    target: targetNode.id,
                                });
                            }
                        }
                    }
                });
            }

            // Ingress to Service
            if (res.kind === 'Ingress' && res.spec) {
                const ingressNs = res.metadata.namespace;
                const rules = res.spec.rules || [];
                const defaultBackend = res.spec.defaultBackend;
                const targetServices: string[] = [];

                if (defaultBackend && defaultBackend.service) {
                    targetServices.push(defaultBackend.service.name);
                }
                rules.forEach((rule: any) => {
                    if (rule.http && rule.http.paths) {
                        rule.http.paths.forEach((path: any) => {
                            if (path.backend && path.backend.service) {
                                targetServices.push(path.backend.service.name);
                            }
                        });
                    }
                });

                targetServices.forEach(serviceName => {
                    const serviceNodeId = `service/${ingressNs}/${serviceName}`; // Construct potential service ID
                    const serviceNode = nodes.find(n => n.id === serviceNodeId); // Check if this service node exists
                    if (serviceNode) {
                         edges.push({
                            id: `e-${childNode.data.id}-${serviceNode.id}`, // Ingress to Service
                            source: childNode.id,
                            target: serviceNode.id,
                        });
                    }
                });
            }
        });

        webviewView.webview.postMessage({
            type: MessageTypes.GET_RESOURCE_GRAPH,
            subType: 'namespaceGraphData',
            data: { nodes, edges } as ResourceGraphData
        });

    } catch (error: any) {
        console.error('Failed to get resource graph:', error);
        webviewView.webview.postMessage({
            type: MessageTypes.GET_RESOURCE_GRAPH,
            subType: 'namespaceGraphData',
            data: { nodes: [], edges: [], error: error.message || 'Unknown error occurred' } as ResourceGraphData,
            error: error.message || 'Unknown error occurred' // also send top level error for frontend
        });
    }
}
