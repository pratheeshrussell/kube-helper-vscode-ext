import type { VueFlowNode, VueFlowEdge, K8sResourceList } from '../types/graph.type';

export function parseGraphData(resources: Record<string, K8sResourceList>): { nodes: VueFlowNode[], edges: VueFlowEdge[] } {
    const nodes: VueFlowNode[] = [];
    const edges: VueFlowEdge[] = [];
    const allItems: any[] = [];

    const ignoreResources = ['event'];

    // First pass: Create all nodes and flatten the resource list
    Object.values(resources).forEach(list => {
        if (list && list.items) {
            list.items.forEach((item: any) => {

                if (ignoreResources.includes(item.kind.toLowerCase())) {
                    return;
                }
                allItems.push(item);
                nodes.push({
                    id: `${item.kind}/${item.metadata.name}`,
                    data: {
                        resourceType: item.kind.toLowerCase(),
                        name: item.metadata.name,

                    },
                    position: { x: Math.random() * 400, y: Math.random() * 400 },
                    type: 'custom',
                });
            });
        }
    });

    // Second pass: Create edges based on relationships
    allItems.forEach(item => {
        const fromId = `${item.kind}/${item.metadata.name}`;

        // Generic Ownership: Connect child to parent via ownerReferences
        if (item.metadata.ownerReferences) {
            item.metadata.ownerReferences.forEach((owner: any) => {
                const toId = `${owner.kind}/${owner.name}`;
                // Check if owner node exists to avoid dangling edges
                if (nodes.find(n => n.id === toId)) {
                    edges.push({ id: `${fromId}-${toId}`, source: toId, target: fromId, animated: true, markerEnd: 'arrowclosed' });
                }
            });
        }

        // Generic Label Selection: Connect resources with selectors to matching resources
        if (item.spec?.selector) {
            const selector = item.spec.selector;

            // Find all items that match this selector
            const matchingItems = allItems.filter(potentialMatch => {
                // service should link with pod
                if(item.kind.toLowerCase() === 'service' ) {
                    if(potentialMatch.kind.toLowerCase() !== 'pod') {
                        return false;
                    }
                }

                
                if (potentialMatch.metadata?.labels) {
                    return Object.entries(selector).every(([key, value]) => potentialMatch.metadata.labels[key] === value);
                }
                return false;
            });
            matchingItems.forEach(match => {
                const toId = `${match.kind}/${match.metadata.name}`;
                edges.push({ id: `${fromId}-${toId}`, source: fromId, target: toId, animated: true, markerEnd: 'arrowclosed' });
            });
        }

        // Specific Name-Based References
        // Pod -> Volume (ConfigMap, Secret, PVC)
        if (item.kind === 'Pod' && item.spec.volumes) {
            item.spec.volumes.forEach((volume: any) => {
                if (volume.configMap) {
                    edges.push({ id: `${fromId}-cm-${volume.configMap.name}`, source: fromId, target: `ConfigMap/${volume.configMap.name}`, animated: true, markerEnd: 'arrow' });
                }
                if (volume.secret) {
                    edges.push({ id: `${fromId}-secret-${volume.secret.secretName}`, source: fromId, target: `Secret/${volume.secret.secretName}`, animated: true, markerEnd: 'arrow' });
                }
                if (volume.persistentVolumeClaim) {
                    edges.push({ id: `${fromId}-pvc-${volume.persistentVolumeClaim.claimName}`, source: fromId, target: `PersistentVolumeClaim/${volume.persistentVolumeClaim.claimName}`, animated: true, markerEnd: 'arrow' });
                }
            });
        }

        // Pod -> ServiceAccount
        if (item.kind === 'Pod' && item.spec.serviceAccountName) {
            edges.push({ id: `${fromId}-sa-${item.spec.serviceAccountName}`, source: fromId, target: `ServiceAccount/${item.spec.serviceAccountName}`, animated: true, markerEnd: 'arrow' });
        }

        // Pod -> Environment Variables (ConfigMap, Secret)
        if (item.kind === 'Pod' && (item.spec.containers || item.spec.initContainers)) {
            const processContainerEnv = (container: any) => {
                // envFrom
                if (container.envFrom) {
                    container.envFrom.forEach((envFromSource: any) => {
                        if (envFromSource.configMapRef) {
                            edges.push({ id: `${fromId}-envFrom-cm-${envFromSource.configMapRef.name}`, source: fromId, target: `ConfigMap/${envFromSource.configMapRef.name}`, animated: true, markerEnd: 'arrow' });
                        }
                        if (envFromSource.secretRef) {
                            edges.push({ id: `${fromId}-envFrom-secret-${envFromSource.secretRef.name}`, source: fromId, target: `Secret/${envFromSource.secretRef.name}`, animated: true, markerEnd: 'arrow' });
                        }
                    });
                }
                // env with valueFrom
                if (container.env) {
                    container.env.forEach((envVar: any) => {
                        if (envVar.valueFrom) {
                            if (envVar.valueFrom.configMapKeyRef) {
                                edges.push({ id: `${fromId}-env-cm-${envVar.valueFrom.configMapKeyRef.name}`, source: fromId, target: `ConfigMap/${envVar.valueFrom.configMapKeyRef.name}`, animated: true, markerEnd: 'arrow' });
                            }
                            if (envVar.valueFrom.secretKeyRef) {
                                edges.push({ id: `${fromId}-env-secret-${envVar.valueFrom.secretKeyRef.name}`, source: fromId, target: `Secret/${envVar.valueFrom.secretKeyRef.name}`, animated: true, markerEnd: 'arrow' });
                            }
                        }
                    });
                }
            };

            if (item.spec.containers) {
                item.spec.containers.forEach(processContainerEnv);
            }
            if (item.spec.initContainers) {
                item.spec.initContainers.forEach(processContainerEnv);
            }
        }

        // Ingress -> Service
        if (item.kind === 'Ingress' && item.spec.rules) {
            item.spec.rules.forEach((rule: any) => {
                rule.http?.paths.forEach((path: any) => {
                    if (path.backend?.service?.name) {
                        edges.push({ id: `${fromId}-svc-${path.backend.service.name}`, source: fromId, target: `Service/${path.backend.service.name}`, animated: true, markerEnd: 'arrow' });
                    }
                });
            });
        }
    });

    return { nodes, edges };
}

