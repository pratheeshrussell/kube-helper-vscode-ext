import type { VueFlowNode, VueFlowEdge, K8sResourceList } from '../types/graph.type';

export function parseGraphData(resources: Record<string, K8sResourceList>): { nodes: VueFlowNode[], edges: VueFlowEdge[] } {
    const nodes: VueFlowNode[] = [];
    const edges: VueFlowEdge[] = [];
    const allItems: any[] = [];

    const ignoreResources = ['event', 'endpoints', 'endpointslices'];

    // First pass: Create all nodes and flatten the resource list
    Object.values(resources).forEach(list => {
        if (list && list.items) {
            list.items.forEach((item: any) => {
                const kind = item.kind.toLowerCase();
                if (ignoreResources.includes(kind)) {
                    return;
                }
                allItems.push(item);
                nodes.push({
                    id: `${item.kind}/${item.metadata.name}`,
                    data: {
                        resourceType: item.kind, // Keep original case for display
                        name: item.metadata.name,
                        status: item.status, // Pass status for visualization
                        spec: item.spec,
                    },
                    position: { x: 0, y: 0 }, // Let elkjs handle layout
                    type: 'custom',
                });
            });
        }
    });

    // Second pass: Create edges based on relationships
    allItems.forEach(item => {
        const fromId = `${item.kind}/${item.metadata.name}`;
        const kind = item.kind.toLowerCase();

        // 1. OwnerReferences (Child -> Parent)
        // This covers many standard relationships like Pod -> ReplicaSet, ReplicaSet -> Deployment, Job -> CronJob
        if (item.metadata.ownerReferences) {
            item.metadata.ownerReferences.forEach((owner: any) => {
                const toId = `${owner.kind}/${owner.name}`;
                // Check if owner node exists
                if (nodes.find(n => n.id === toId)) {
                    // Direction: Parent -> Child (Owner is source)
                    edges.push({
                        id: `${toId}-${fromId}`,
                        source: toId,
                        target: fromId,
                        animated: true,
                        markerEnd: 'arrowclosed',
                        type: 'smoothstep'
                    });
                }
            });
        }

        // 2. Label Selectors (Service -> Pod, Deployment -> Pod (if no owner ref), etc.)
        if (item.spec?.selector) {
            let selector = item.spec.selector;
            // Deployments/ReplicaSets use matchLabels
            if (item.spec.selector.matchLabels) {
                selector = item.spec.selector.matchLabels;
            }

            // Find all items that match this selector
            const matchingItems = allItems.filter(potentialMatch => {
                // Service -> Pod
                if (kind === 'service' && potentialMatch.kind.toLowerCase() !== 'pod') return false;

                // Deployment -> Pod (Avoid direct link, rely on RS)
                if (kind === 'deployment' && potentialMatch.kind.toLowerCase() === 'pod') return false;

                // Don't link to self
                if (potentialMatch.metadata.uid === item.metadata.uid) return false;

                if (potentialMatch.metadata?.labels) {
                    return Object.entries(selector).every(([key, value]) => potentialMatch.metadata.labels[key] === value);
                }
                return false;
            });

            matchingItems.forEach(match => {
                const toId = `${match.kind}/${match.metadata.name}`;
                // Avoid duplicate edges if ownerRef already covered it
                const edgeExists = edges.some(e => (e.source === fromId && e.target === toId) || (e.source === toId && e.target === fromId));
                if (!edgeExists) {
                    edges.push({
                        id: `${fromId}-${toId}`,
                        source: fromId,
                        target: toId,
                        animated: true,
                        markerEnd: 'arrowclosed',
                        style: { strokeDasharray: '5,5' } // Dashed line for selector-based links
                    });
                }
            });
        }

        // 3. Specific Resource Logic

        // Pod -> Volumes (ConfigMap, Secret, PVC)
        if (kind === 'pod' && item.spec.volumes) {
            item.spec.volumes.forEach((volume: any) => {
                if (volume.configMap) {
                    const targetId = `ConfigMap/${volume.configMap.name}`;
                    if (nodes.find(n => n.id === targetId)) {
                        edges.push({ id: `${fromId}-cm-${volume.configMap.name}`, source: fromId, target: targetId, animated: false, markerEnd: 'arrow' });
                    }
                }
                if (volume.secret) {
                    const targetId = `Secret/${volume.secret.secretName}`;
                    if (nodes.find(n => n.id === targetId)) {
                        edges.push({ id: `${fromId}-secret-${volume.secret.secretName}`, source: fromId, target: targetId, animated: false, markerEnd: 'arrow' });
                    }
                }
                if (volume.persistentVolumeClaim) {
                    const targetId = `PersistentVolumeClaim/${volume.persistentVolumeClaim.claimName}`;
                    if (nodes.find(n => n.id === targetId)) {
                        edges.push({ id: `${fromId}-pvc-${volume.persistentVolumeClaim.claimName}`, source: fromId, target: targetId, animated: false, markerEnd: 'arrow' });
                    }
                }
            });
        }

        // Pod -> ServiceAccount
        if (kind === 'pod' && item.spec.serviceAccountName) {
            const targetId = `ServiceAccount/${item.spec.serviceAccountName}`;
            if (nodes.find(n => n.id === targetId)) {
                edges.push({ id: `${fromId}-sa-${item.spec.serviceAccountName}`, source: fromId, target: targetId, animated: false, markerEnd: 'arrow' });
            }
        }

        // Pod -> Env Vars (ConfigMap, Secret)
        if (kind === 'pod' && (item.spec.containers || item.spec.initContainers)) {
            const processContainerEnv = (container: any) => {
                if (container.envFrom) {
                    container.envFrom.forEach((envFromSource: any) => {
                        if (envFromSource.configMapRef) {
                            const targetId = `ConfigMap/${envFromSource.configMapRef.name}`;
                            if (nodes.find(n => n.id === targetId)) {
                                edges.push({ id: `${fromId}-envFrom-cm-${envFromSource.configMapRef.name}`, source: fromId, target: targetId, animated: false, markerEnd: 'arrow' });
                            }
                        }
                        if (envFromSource.secretRef) {
                            const targetId = `Secret/${envFromSource.secretRef.name}`;
                            if (nodes.find(n => n.id === targetId)) {
                                edges.push({ id: `${fromId}-envFrom-secret-${envFromSource.secretRef.name}`, source: fromId, target: targetId, animated: false, markerEnd: 'arrow' });
                            }
                        }
                    });
                }
                if (container.env) {
                    container.env.forEach((envVar: any) => {
                        if (envVar.valueFrom) {
                            if (envVar.valueFrom.configMapKeyRef) {
                                const targetId = `ConfigMap/${envVar.valueFrom.configMapKeyRef.name}`;
                                if (nodes.find(n => n.id === targetId)) {
                                    edges.push({ id: `${fromId}-env-cm-${envVar.valueFrom.configMapKeyRef.name}`, source: fromId, target: targetId, animated: false, markerEnd: 'arrow' });
                                }
                            }
                            if (envVar.valueFrom.secretKeyRef) {
                                const targetId = `Secret/${envVar.valueFrom.secretKeyRef.name}`;
                                if (nodes.find(n => n.id === targetId)) {
                                    edges.push({ id: `${fromId}-env-secret-${envVar.valueFrom.secretKeyRef.name}`, source: fromId, target: targetId, animated: false, markerEnd: 'arrow' });
                                }
                            }
                        }
                    });
                }
            };

            if (item.spec.containers) item.spec.containers.forEach(processContainerEnv);
            if (item.spec.initContainers) item.spec.initContainers.forEach(processContainerEnv);
        }

        // Ingress -> Service
        if (kind === 'ingress' && item.spec.rules) {
            item.spec.rules.forEach((rule: any) => {
                rule.http?.paths?.forEach((path: any) => {
                    if (path.backend?.service?.name) {
                        const targetId = `Service/${path.backend.service.name}`;
                        if (nodes.find(n => n.id === targetId)) {
                            edges.push({ id: `${fromId}-svc-${path.backend.service.name}`, source: fromId, target: targetId, animated: true, markerEnd: 'arrow' });
                        }
                    }
                });
            });
        }
    });

    return { nodes, edges };
}

