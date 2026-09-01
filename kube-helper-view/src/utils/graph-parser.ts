import type { 
    VueFlowNode, 
    VueFlowEdge, 
    K8sResourceList, 
    GraphParserOptions, 
    HealthInfo, 
    PodSummary, 
    PodGroupData,
    ServicePortInfo,
    NetworkPolicySummary
} from '../types/graph.type';

export interface ParseGraphResult {
    nodes: VueFlowNode[];
    edges: VueFlowEdge[];
    parentToChildren: Record<string, string[]>;
    childToParents: Record<string, string[]>;
}

const TRAFFIC_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#f97316'];

export function evaluateResourceHealth(item: any): HealthInfo {
    const kind = item.kind?.toLowerCase() || '';
    const status = item.status;
    if (!status) {
        return { status: 'unknown', reason: 'No status reported' };
    }

    // Pod health
    if (kind === 'pod') {
        const phase = status.phase;
        const containerStatuses = [
            ...(status.initContainerStatuses || []),
            ...(status.containerStatuses || [])
        ];

        for (const cs of containerStatuses) {
            if (cs.state?.waiting) {
                const reason = cs.state.waiting.reason || 'Waiting';
                const message = cs.state.waiting.message || '';
                if (['CrashLoopBackOff', 'ImagePullBackOff', 'ErrImagePull', 'CreateContainerConfigError', 'InvalidImageName', 'ContainerCannotRun'].includes(reason)) {
                    return { status: 'degraded', reason: `${cs.name}: ${reason}`, message };
                }
                return { status: 'progressing', reason: `${cs.name}: ${reason}`, message };
            }
            if (cs.state?.terminated) {
                if (cs.state.terminated.exitCode !== 0) {
                    return {
                        status: 'degraded',
                        reason: `${cs.name}: Terminated (exit code ${cs.state.terminated.exitCode})`,
                        message: cs.state.terminated.message || cs.state.terminated.reason
                    };
                }
            }
        }

        if (phase === 'Running') {
            const allReady = containerStatuses.length > 0 && containerStatuses.every((cs: any) => cs.ready);
            if (allReady) {
                return { status: 'healthy', reason: 'All containers ready' };
            }
            return { status: 'progressing', reason: 'Containers starting / not all ready' };
        }
        if (phase === 'Succeeded') return { status: 'healthy', reason: 'Completed' };
        if (phase === 'Failed') return { status: 'degraded', reason: status.reason || 'Failed', message: status.message };
        if (phase === 'Pending') return { status: 'progressing', reason: status.reason || 'Pending scheduling' };
    }

    // Workload replica controllers (Deployment, ReplicaSet, StatefulSet)
    if (['deployment', 'replicaset', 'statefulset'].includes(kind)) {
        if (status.conditions) {
            const replicaFailure = status.conditions.find((c: any) => c.type === 'ReplicaFailure' && c.status === 'True');
            if (replicaFailure) {
                return { status: 'degraded', reason: replicaFailure.reason || 'ReplicaFailure', message: replicaFailure.message };
            }
            const progressing = status.conditions.find((c: any) => c.type === 'Progressing');
            if (progressing && progressing.status === 'False') {
                return { status: 'degraded', reason: progressing.reason || 'Progressing False', message: progressing.message };
            }
        }

        const desired = item.spec?.replicas ?? 1;
        if (desired === 0) {
            return { status: 'suspended', reason: 'Scaled to 0 replicas' };
        }
        const ready = status.readyReplicas || 0;
        const unavailable = status.unavailableReplicas || 0;

        if (unavailable > 0) {
            return { status: 'degraded', reason: `${unavailable} replica(s) unavailable` };
        }
        if (ready >= desired && desired > 0) {
            return { status: 'healthy', reason: `${ready}/${desired} ready` };
        }
        return { status: 'progressing', reason: `${ready}/${desired} ready` };
    }

    // DaemonSet
    if (kind === 'daemonset') {
        const desired = status.desiredNumberScheduled || 0;
        const current = status.numberReady || 0;
        if (desired === 0) return { status: 'healthy', reason: '0 nodes targeted' };
        if (current >= desired) return { status: 'healthy', reason: `${current}/${desired} ready` };
        return { status: 'progressing', reason: `${current}/${desired} ready` };
    }

    // Jobs & CronJobs
    if (kind === 'job') {
        if (status.succeeded && status.succeeded > 0) return { status: 'healthy', reason: 'Job succeeded' };
        if (status.failed && status.failed > 0) return { status: 'degraded', reason: `Job failed (${status.failed} failure(s))` };
        if (status.active && status.active > 0) return { status: 'progressing', reason: 'Job is running' };
    }
    if (kind === 'cronjob') {
        if (item.spec?.suspend) return { status: 'suspended', reason: 'CronJob is suspended' };
        return { status: 'healthy', reason: 'CronJob active' };
    }

    // PersistentVolumeClaim
    if (kind === 'persistentvolumeclaim') {
        if (status.phase === 'Bound') return { status: 'healthy', reason: 'Bound' };
        if (status.phase === 'Pending') return { status: 'progressing', reason: 'Pending volume binding' };
        if (status.phase === 'Lost') return { status: 'degraded', reason: 'Volume lost' };
    }

    // CRDs & general condition-based resources (Certificates, SealedSecrets, etc.)
    if (status.conditions && Array.isArray(status.conditions)) {
        const readyCond = status.conditions.find((c: any) => c.type === 'Ready' || c.type === 'Synced' || c.type === 'Healthy' || c.type === 'Available');
        if (readyCond) {
            if (readyCond.status === 'True') return { status: 'healthy', reason: readyCond.reason || readyCond.type };
            if (readyCond.status === 'False') return { status: 'degraded', reason: readyCond.reason || `${readyCond.type} False`, message: readyCond.message };
            if (readyCond.status === 'Unknown') return { status: 'progressing', reason: readyCond.reason || 'Unknown', message: readyCond.message };
        }
    }

    return { status: 'healthy', reason: 'Active' };
}

export function calculateRestarts(item: any): number {
    if (item.kind?.toLowerCase() !== 'pod') return 0;
    const containerStatuses = item.status?.containerStatuses || [];
    return containerStatuses.reduce((acc: number, curr: any) => acc + (curr.restartCount || 0), 0);
}

export function extractImageTag(item: any): string | undefined {
    const containers = item.spec?.template?.spec?.containers || item.spec?.containers;
    if (containers && containers.length > 0 && containers[0]?.image) {
        const img = containers[0].image;
        const parts = img.split('/');
        return parts[parts.length - 1];
    }
    return undefined;
}

export function extractExternalUrl(item: any): string | undefined {
    const kind = item.kind?.toLowerCase();
    if (kind === 'ingress' && item.spec?.rules) {
        for (const rule of item.spec.rules) {
            if (rule.host) {
                const path = rule.http?.paths?.[0]?.path || '';
                return `http://${rule.host}${path}`;
            }
        }
    }
    if (kind === 'service' && item.spec?.type === 'LoadBalancer') {
        const ing = item.status?.loadBalancer?.ingress?.[0];
        if (ing?.hostname) return `http://${ing.hostname}`;
        if (ing?.ip) return `http://${ing.ip}`;
    }
    return undefined;
}

// ---------------------------------------------------------
// Dedicated Traffic Flow Topology Generator
// ---------------------------------------------------------
function parseTrafficFlowGraph(allItems: any[], options: GraphParserOptions): ParseGraphResult {
    const nodes: VueFlowNode[] = [];
    const edges: VueFlowEdge[] = [];
    const parentToChildren: Record<string, string[]> = {};
    const childToParents: Record<string, string[]> = {};

    const addHierarchyLink = (parent: string, child: string) => {
        if (!parentToChildren[parent]) parentToChildren[parent] = [];
        if (!parentToChildren[parent].includes(child)) parentToChildren[parent].push(child);

        if (!childToParents[child]) childToParents[child] = [];
        if (!childToParents[child].includes(parent)) childToParents[child].push(parent);
    };

    // 1. Analyze Network Policies (Native, Cilium, Calico)
    const policyItems = allItems.filter(item => {
        const k = item.kind.toLowerCase();
        return k.includes('networkpolicy') || k.includes('ciliumnetworkpolicy');
    });

    const podPolicyMap: Record<string, NetworkPolicySummary[]> = {};
    const pods = allItems.filter(item => item.kind.toLowerCase() === 'pod');

    policyItems.forEach(policy => {
        const rawSelector = policy.spec?.podSelector;
        const rawEndpointSelector = policy.spec?.endpointSelector;
        const matchLabels = rawSelector?.matchLabels || rawEndpointSelector?.matchLabels || 
                             (rawSelector && typeof rawSelector === 'object' && !rawSelector.matchLabels && !rawSelector.matchExpressions ? rawSelector : null);

        const hasSpecificLabels = matchLabels && Object.keys(matchLabels).length > 0;
        // In Kubernetes, an empty podSelector: {} (or no selector) applies to ALL pods in namespace
        const selectsAllPods = (!rawSelector && !rawEndpointSelector) ||
                               (rawSelector && Object.keys(rawSelector).length === 0) ||
                               (rawSelector?.matchLabels && Object.keys(rawSelector.matchLabels).length === 0);

        const ingressRulesCount = (policy.spec?.ingress || []).length;
        const egressRulesCount = (policy.spec?.egress || []).length;
        const policySummary: NetworkPolicySummary = {
            name: policy.metadata.name,
            kind: policy.kind,
            ingressRulesCount,
            egressRulesCount
        };

        pods.forEach(pod => {
            const podLabels = pod.metadata?.labels || {};
            let matches = false;
            if (selectsAllPods) {
                matches = true;
            } else if (hasSpecificLabels) {
                matches = Object.entries(matchLabels).every(([k, v]) => podLabels[k] === v);
            }
            if (matches) {
                const podKey = `Pod/${pod.metadata.name}`;
                if (!podPolicyMap[podKey]) podPolicyMap[podKey] = [];
                podPolicyMap[podKey].push(policySummary);
            }
        });
    });

    // 2. Identify Traffic Ingress Points (Ingress, Gateway, LoadBalancer Services)
    const ingresses = allItems.filter(item => ['ingress', 'gateway', 'httproute', 'virtualservice'].includes(item.kind.toLowerCase()));
    const services = allItems.filter(item => item.kind.toLowerCase() === 'service');

    const targetedServiceNames = new Set<string>();
    ingresses.forEach(ing => {
        (ing.spec?.rules || []).forEach((rule: any) => {
            (rule.http?.paths || []).forEach((p: any) => {
                const svcName = p.backend?.service?.name || p.backend?.serviceName;
                if (svcName) targetedServiceNames.add(svcName);
            });
        });
    });

    const hasExternalEntry = ingresses.length > 0 || services.some(s => s.spec?.type === 'LoadBalancer');
    const externalRootId = 'ExternalTraffic/internet';

    if (hasExternalEntry) {
        nodes.push({
            id: externalRootId,
            data: {
                resourceType: 'ExternalTraffic',
                name: 'Internet / External Traffic',
                health: { status: 'healthy', reason: 'Active Traffic Entry' },
                isPodGroup: false,
                isExternalTraffic: true,
                viewMode: 'traffic'
            },
            position: { x: 0, y: 0 },
            type: 'custom',
        });
    }

    // 2b. Internal In-Cluster Entry for non-ingress ClusterIP services
    const nonIngressServices = services.filter(s => 
        s.spec?.type !== 'LoadBalancer' && 
        !targetedServiceNames.has(s.metadata.name)
    );
    const hasInternalEntry = nonIngressServices.length > 0;
    const internalRootId = 'InternalTraffic/in-cluster';

    if (hasInternalEntry) {
        nodes.push({
            id: internalRootId,
            data: {
                resourceType: 'InternalTraffic',
                name: 'In-Cluster / Mesh Clients',
                health: { status: 'healthy', reason: 'Internal Service Traffic' },
                isPodGroup: false,
                isInternalTraffic: true,
                viewMode: 'traffic'
            },
            position: { x: 0, y: 0 },
            type: 'custom',
        });
    }

    // 3. Process Ingress & Gateway Layer
    ingresses.forEach((ing, i) => {
        const kind = ing.kind;
        const ingId = `${kind}/${ing.metadata.name}`;
        const trafficColor = TRAFFIC_COLORS[i % TRAFFIC_COLORS.length];
        const health = evaluateResourceHealth(ing);
        const externalUrl = extractExternalUrl(ing);

        const ingressHosts = (ing.spec?.rules || []).map((r: any) => r.host).filter(Boolean);
        const ingressPaths = (ing.spec?.rules || []).flatMap((r: any) => (r.http?.paths || []).map((p: any) => p.path)).filter(Boolean);

        nodes.push({
            id: ingId,
            data: {
                resourceType: kind,
                name: ing.metadata.name,
                metadata: ing.metadata,
                spec: ing.spec,
                status: ing.status,
                health,
                externalUrl,
                ingressHosts,
                ingressPaths,
                trafficColor,
                isPodGroup: false,
                viewMode: 'traffic'
            },
            position: { x: 0, y: 0 },
            type: 'custom',
        });

        // Edge: Internet ➔ Ingress
        if (hasExternalEntry) {
            const edgeStyle = { stroke: trafficColor, strokeWidth: 2 };
            edges.push({
                id: `${externalRootId}-${ingId}`,
                source: externalRootId,
                target: ingId,
                label: ingressHosts[0] || 'HTTP/S Traffic',
                animated: true,
                markerEnd: 'arrowclosed',
                type: 'smoothstep',
                style: edgeStyle,
                data: { originalStyle: edgeStyle, trafficColor, isNetworkFlow: true }
            });
            addHierarchyLink(externalRootId, ingId);
        }

        // Connect Ingress ➔ Target Services
        if (ing.spec?.rules) {
            ing.spec.rules.forEach((rule: any) => {
                (rule.http?.paths || []).forEach((p: any) => {
                    const svcName = p.backend?.service?.name || p.backend?.serviceName;
                    const svcPort = p.backend?.service?.port?.number || p.backend?.servicePort || '';
                    if (svcName) {
                        const targetSvcId = `Service/${svcName}`;
                        const edgeId = `${ingId}-${targetSvcId}-${p.path || '/'}`;
                        if (!edges.some(e => e.id === edgeId)) {
                            const edgeStyle = { stroke: trafficColor, strokeWidth: 2 };
                            edges.push({
                                id: edgeId,
                                source: ingId,
                                target: targetSvcId,
                                label: `${p.path || '/'} ➔ :${svcPort}`,
                                animated: true,
                                markerEnd: 'arrowclosed',
                                type: 'smoothstep',
                                style: edgeStyle,
                                data: { originalStyle: edgeStyle, trafficColor, isNetworkFlow: true }
                            });
                            addHierarchyLink(ingId, targetSvcId);
                        }
                    }
                });
            });
        }
    });

    // 4. Process Service Layer
    services.forEach(svc => {
        const svcId = `Service/${svc.metadata.name}`;
        const health = evaluateResourceHealth(svc);
        const externalUrl = extractExternalUrl(svc);
        const serviceType = svc.spec?.type || 'ClusterIP';
        const clusterIP = svc.spec?.clusterIP;
        const isExternalName = serviceType === 'ExternalName';
        const externalName = svc.spec?.externalName;
        const isHeadless = clusterIP === 'None';
        const servicePorts: ServicePortInfo[] = (svc.spec?.ports || []).map((p: any) => ({
            name: p.name,
            port: p.port,
            targetPort: p.targetPort || p.port,
            protocol: p.protocol || 'TCP',
            nodePort: p.nodePort
        }));

        nodes.push({
            id: svcId,
            data: {
                resourceType: 'Service',
                name: svc.metadata.name,
                metadata: svc.metadata,
                spec: svc.spec,
                status: svc.status,
                health,
                externalUrl,
                serviceType,
                clusterIP,
                isExternalName,
                externalName,
                isHeadless,
                servicePorts,
                isPodGroup: false,
                viewMode: 'traffic'
            },
            position: { x: 0, y: 0 },
            type: 'custom',
        });

        // If LoadBalancer service without Ingress, connect from Internet
        if (serviceType === 'LoadBalancer' && hasExternalEntry) {
            const edgeId = `${externalRootId}-${svcId}`;
            if (!edges.some(e => e.id === edgeId)) {
                const edgeStyle = { stroke: '#10b981', strokeWidth: 2 };
                edges.push({
                    id: edgeId,
                    source: externalRootId,
                    target: svcId,
                    label: externalUrl || 'LoadBalancer',
                    animated: true,
                    markerEnd: 'arrowclosed',
                    type: 'smoothstep',
                    style: edgeStyle,
                    data: { originalStyle: edgeStyle, trafficColor: '#10b981', isNetworkFlow: true }
                });
                addHierarchyLink(externalRootId, svcId);
            }
        } else if (!targetedServiceNames.has(svc.metadata.name) && hasInternalEntry) {
            // Internal ClusterIP service without Ingress: connect from In-Cluster root
            const edgeId = `${internalRootId}-${svcId}`;
            if (!edges.some(e => e.id === edgeId)) {
                const edgeStyle = { stroke: '#6366f1', strokeWidth: 2 };
                edges.push({
                    id: edgeId,
                    source: internalRootId,
                    target: svcId,
                    label: isExternalName ? `External: ${externalName}` : 'Cluster Traffic',
                    animated: true,
                    markerEnd: 'arrowclosed',
                    type: 'smoothstep',
                    style: edgeStyle,
                    data: { originalStyle: edgeStyle, trafficColor: '#6366f1', isNetworkFlow: true }
                });
                addHierarchyLink(internalRootId, svcId);
            }
        }
    });

    // 5. Connect Service ➔ Target Pods / PodGroups
    const shouldGroupPods = options.groupPods ?? true;
    const connectedPodUids = new Set<string>();

    services.forEach(svc => {
        const svcId = `Service/${svc.metadata.name}`;
        const selector = svc.spec?.selector;
        if (!selector || Object.keys(selector).length === 0) return;

        const matchingPods = pods.filter(pod => {
            const podLabels = pod.metadata?.labels || {};
            return Object.entries(selector).every(([k, v]) => podLabels[k] === v);
        });

        if (matchingPods.length === 0) return;

        const defaultPort = svc.spec?.ports?.[0];
        const portLabel = defaultPort ? `targetPort: ${defaultPort.targetPort || defaultPort.port}` : 'Traffic';

        if (shouldGroupPods) {
            // Group pods by parent controller
            const podSummaries: PodSummary[] = matchingPods.map(pod => {
                connectedPodUids.add(pod.metadata.uid || pod.metadata.name);
                const health = evaluateResourceHealth(pod);
                const restarts = calculateRestarts(pod);
                return {
                    name: pod.metadata.name,
                    phase: pod.status?.phase || 'Unknown',
                    health: health.status,
                    healthReason: health.reason,
                    restarts,
                    ready: health.status === 'healthy',
                    raw: pod
                };
            });

            const readyCount = podSummaries.filter(p => p.ready).length;
            const totalRestarts = podSummaries.reduce((sum, p) => sum + p.restarts, 0);
            const targetGroupId = `PodGroup/Traffic/${svc.metadata.name}`;

            // Check if any matching pod has NetworkPolicy
            const policiesForGroup = matchingPods.flatMap(p => podPolicyMap[`Pod/${p.metadata.name}`] || []);
            const hasNetPol = policiesForGroup.length > 0;

            let groupHealthStatus: HealthInfo = { status: 'healthy', reason: `${readyCount}/${matchingPods.length} Ready` };
            if (podSummaries.some(p => p.health === 'degraded')) {
                groupHealthStatus = { status: 'degraded', reason: 'Degraded pod in endpoint pool' };
            }

            if (!nodes.some(n => n.id === targetGroupId)) {
                nodes.push({
                    id: targetGroupId,
                    data: {
                        resourceType: 'PodGroup',
                        name: `${svc.metadata.name} Endpoints`,
                        health: groupHealthStatus,
                        restarts: totalRestarts,
                        isPodGroup: true,
                        hasNetworkPolicy: hasNetPol,
                        networkPolicies: policiesForGroup,
                        podGroup: {
                            parentKind: 'Service',
                            parentName: svc.metadata.name,
                            totalCount: matchingPods.length,
                            readyCount,
                            pods: podSummaries
                        },
                        viewMode: 'traffic'
                    },
                    position: { x: 0, y: 0 },
                    type: 'custom',
                });
            }

            const edgeId = `${svcId}-${targetGroupId}`;
            const edgeStyle = { stroke: '#8B5CF6', strokeWidth: 2 };
            edges.push({
                id: edgeId,
                source: svcId,
                target: targetGroupId,
                label: portLabel,
                animated: true,
                markerEnd: 'arrowclosed',
                type: 'smoothstep',
                style: edgeStyle,
                data: { originalStyle: edgeStyle, trafficColor: '#8B5CF6', isNetworkFlow: true }
            });
            addHierarchyLink(svcId, targetGroupId);
        } else {
            // Individual Pod targets
            matchingPods.forEach(pod => {
                const podId = `Pod/${pod.metadata.name}`;
                connectedPodUids.add(pod.metadata.uid || pod.metadata.name);
                const health = evaluateResourceHealth(pod);
                const restarts = calculateRestarts(pod);
                const policies = podPolicyMap[podId] || [];

                if (!nodes.some(n => n.id === podId)) {
                    nodes.push({
                        id: podId,
                        data: {
                            resourceType: 'Pod',
                            name: pod.metadata.name,
                            metadata: pod.metadata,
                            status: pod.status,
                            spec: pod.spec,
                            health,
                            restarts,
                            hasNetworkPolicy: policies.length > 0,
                            networkPolicies: policies,
                            isPodGroup: false,
                            viewMode: 'traffic'
                        },
                        position: { x: 0, y: 0 },
                        type: 'custom',
                    });
                }

                const edgeId = `${svcId}-${podId}`;
                const edgeStyle = { stroke: '#8B5CF6', strokeWidth: 2 };
                edges.push({
                    id: edgeId,
                    source: svcId,
                    target: podId,
                    label: portLabel,
                    animated: true,
                    markerEnd: 'arrowclosed',
                    type: 'smoothstep',
                    style: edgeStyle,
                    data: { originalStyle: edgeStyle, trafficColor: '#8B5CF6', isNetworkFlow: true }
                });
                addHierarchyLink(svcId, podId);
            });
        }
    });

    nodes.forEach(node => {
        const children = parentToChildren[node.id] || [];
        node.data.childCount = children.length;
    });

    return { nodes, edges, parentToChildren, childToParents };
}


// ---------------------------------------------------------
// Main Parser Entry Point
// ---------------------------------------------------------
export function parseGraphData(
    resources: Record<string, K8sResourceList>,
    options: GraphParserOptions = { groupPods: true, viewMode: 'workload' }
): ParseGraphResult {
    const allItems: any[] = [];
    const ignoreResources = ['event', 'endpoints', 'endpointslices'];

    // Collect all raw resources
    Object.values(resources).forEach(list => {
        if (list && list.items) {
            list.items.forEach((item: any) => {
                const kind = item.kind?.toLowerCase();
                if (!kind || ignoreResources.includes(kind)) {
                    return;
                }
                allItems.push(item);
            });
        }
    });

    // If Traffic Flow mode requested, delegate to dedicated traffic pipeline
    if (options.viewMode === 'traffic') {
        return parseTrafficFlowGraph(allItems, options);
    }

    // Default: Workload Hierarchy Graph
    const nodes: VueFlowNode[] = [];
    const edges: VueFlowEdge[] = [];
    const parentToChildren: Record<string, string[]> = {};
    const childToParents: Record<string, string[]> = {};

    const addHierarchyLink = (parent: string, child: string) => {
        if (!parentToChildren[parent]) parentToChildren[parent] = [];
        if (!parentToChildren[parent].includes(child)) parentToChildren[parent].push(child);

        if (!childToParents[child]) childToParents[child] = [];
        if (!childToParents[child].includes(parent)) childToParents[child].push(parent);
    };

    const shouldGroupPods = options.groupPods ?? true;

    // Separate pods and non-pod items
    const podItems: any[] = [];
    const nonPodItems: any[] = [];
    const podsByParentOwner: Record<string, any[]> = {};

    allItems.forEach(item => {
        if (item.kind.toLowerCase() === 'pod') {
            podItems.push(item);
            if (shouldGroupPods && item.metadata.ownerReferences && item.metadata.ownerReferences.length > 0) {
                const owner = item.metadata.ownerReferences[0];
                const ownerKey = `${owner.kind}/${owner.name}`;
                if (!podsByParentOwner[ownerKey]) {
                    podsByParentOwner[ownerKey] = [];
                }
                podsByParentOwner[ownerKey].push(item);
            }
        } else {
            nonPodItems.push(item);
        }
    });

    // 1. Create standard nodes for all non-pod items
    nonPodItems.forEach(item => {
        const health = evaluateResourceHealth(item);
        const externalUrl = extractExternalUrl(item);
        const imageTag = extractImageTag(item);

        nodes.push({
            id: `${item.kind}/${item.metadata.name}`,
            data: {
                resourceType: item.kind,
                name: item.metadata.name,
                metadata: item.metadata,
                status: item.status,
                spec: item.spec,
                health,
                externalUrl,
                imageTag,
                age: item.metadata.creationTimestamp,
                isPodGroup: false,
                viewMode: 'workload'
            },
            position: { x: 0, y: 0 },
            type: 'custom',
        });
    });

    // 2. Process pods: either as grouped PodGroup nodes or individual Pod nodes
    const groupedPodUids = new Set<string>();

    if (shouldGroupPods) {
        Object.entries(podsByParentOwner).forEach(([ownerKey, pods]) => {
            if (pods.length > 0) {
                const [parentKind, parentName] = ownerKey.split('/');
                const podSummaries: PodSummary[] = pods.map(pod => {
                    groupedPodUids.add(pod.metadata.uid || pod.metadata.name);
                    const health = evaluateResourceHealth(pod);
                    const restarts = calculateRestarts(pod);
                    const isReady = health.status === 'healthy';
                    return {
                        name: pod.metadata.name,
                        phase: pod.status?.phase || 'Unknown',
                        health: health.status,
                        healthReason: health.reason,
                        restarts,
                        ready: isReady,
                        raw: pod
                    };
                });

                const readyCount = podSummaries.filter(p => p.ready).length;
                const totalRestarts = podSummaries.reduce((sum, p) => sum + p.restarts, 0);

                let groupHealthStatus: HealthInfo = { status: 'healthy', reason: `${readyCount}/${pods.length} Ready` };
                if (podSummaries.some(p => p.health === 'degraded')) {
                    const degradedPod = podSummaries.find(p => p.health === 'degraded');
                    groupHealthStatus = { status: 'degraded', reason: degradedPod?.healthReason || 'Degraded pod in group' };
                } else if (podSummaries.some(p => p.health === 'progressing')) {
                    const progPod = podSummaries.find(p => p.health === 'progressing');
                    groupHealthStatus = { status: 'progressing', reason: progPod?.healthReason || 'Pod starting' };
                }

                const podGroupId = `PodGroup/${parentKind}/${parentName}`;
                const podGroupData: PodGroupData = {
                    parentKind,
                    parentName,
                    totalCount: pods.length,
                    readyCount,
                    pods: podSummaries,
                };

                nodes.push({
                    id: podGroupId,
                    data: {
                        resourceType: 'PodGroup',
                        name: `${parentName} Pods`,
                        health: groupHealthStatus,
                        restarts: totalRestarts,
                        isPodGroup: true,
                        podGroup: podGroupData,
                        spec: pods[0]?.spec,
                        metadata: pods[0]?.metadata,
                        viewMode: 'workload'
                    },
                    position: { x: 0, y: 0 },
                    type: 'custom',
                });

                // Edge from parent controller -> PodGroup
                const parentNodeId = `${parentKind}/${parentName}`;
                const edgeStyle = { stroke: '#64748b', strokeWidth: 1.5 };
                edges.push({
                    id: `${parentNodeId}-${podGroupId}`,
                    source: parentNodeId,
                    target: podGroupId,
                    animated: true,
                    markerEnd: 'arrowclosed',
                    type: 'smoothstep',
                    style: edgeStyle,
                    data: { originalStyle: edgeStyle }
                });
                addHierarchyLink(parentNodeId, podGroupId);
            }
        });
    }

    // Create individual Pod nodes for pods that were not grouped
    podItems.forEach(pod => {
        const podUid = pod.metadata.uid || pod.metadata.name;
        if (!groupedPodUids.has(podUid)) {
            const health = evaluateResourceHealth(pod);
            const restarts = calculateRestarts(pod);
            const imageTag = extractImageTag(pod);

            nodes.push({
                id: `${pod.kind}/${pod.metadata.name}`,
                data: {
                    resourceType: pod.kind,
                    name: pod.metadata.name,
                    metadata: pod.metadata,
                    status: pod.status,
                    spec: pod.spec,
                    health,
                    restarts,
                    imageTag,
                    age: pod.metadata.creationTimestamp,
                    isPodGroup: false,
                    viewMode: 'workload'
                },
                position: { x: 0, y: 0 },
                type: 'custom',
            });
        }
    });

    // 3. Second pass: Create edges based on relationships
    allItems.forEach(item => {
        const fromId = `${item.kind}/${item.metadata.name}`;
        const kind = item.kind.toLowerCase();

        // 1. OwnerReferences (Parent -> Child)
        if (item.metadata.ownerReferences) {
            item.metadata.ownerReferences.forEach((owner: any) => {
                const toId = `${owner.kind}/${owner.name}`;
                const isGroupedPod = kind === 'pod' && groupedPodUids.has(item.metadata.uid || item.metadata.name);
                if (!isGroupedPod && nodes.find(n => n.id === toId) && nodes.find(n => n.id === fromId)) {
                    const edgeStyle = { stroke: '#64748b', strokeWidth: 1.5 };
                    edges.push({
                        id: `${toId}-${fromId}`,
                        source: toId,
                        target: fromId,
                        animated: true,
                        markerEnd: 'arrowclosed',
                        type: 'smoothstep',
                        style: edgeStyle,
                        data: { originalStyle: edgeStyle }
                    });
                    addHierarchyLink(toId, fromId);
                }
            });
        }

        // 2. Label Selectors (Service -> Pod / PodGroup, etc.)
        if (item.spec?.selector) {
            let selector = item.spec.selector;
            if (item.spec.selector.matchLabels) {
                selector = item.spec.selector.matchLabels;
            }

            const matchingItems = allItems.filter(potentialMatch => {
                if (kind === 'service' && potentialMatch.kind.toLowerCase() !== 'pod') return false;
                if (kind === 'deployment' && potentialMatch.kind.toLowerCase() === 'pod') return false;
                if (potentialMatch.metadata?.uid === item.metadata?.uid) return false;

                if (potentialMatch.metadata?.labels) {
                    return Object.entries(selector).every(([key, value]) => potentialMatch.metadata.labels[key] === value);
                }
                return false;
            });

            matchingItems.forEach(match => {
                let targetNodeId = `${match.kind}/${match.metadata.name}`;
                if (match.kind.toLowerCase() === 'pod' && groupedPodUids.has(match.metadata.uid || match.metadata.name)) {
                    const owner = match.metadata.ownerReferences?.[0];
                    if (owner) {
                        targetNodeId = `PodGroup/${owner.kind}/${owner.name}`;
                    }
                }

                if (nodes.find(n => n.id === targetNodeId)) {
                    const edgeExists = edges.some(e => (e.source === fromId && e.target === targetNodeId) || (e.source === targetNodeId && e.target === fromId));
                    if (!edgeExists) {
                        const edgeStyle = { stroke: '#64748b', strokeWidth: 1.5, strokeDasharray: '5,5' };
                        edges.push({
                            id: `${fromId}-${targetNodeId}`,
                            source: fromId,
                            target: targetNodeId,
                            animated: true,
                            markerEnd: 'arrowclosed',
                            style: edgeStyle,
                            data: { originalStyle: edgeStyle }
                        });
                        addHierarchyLink(fromId, targetNodeId);
                    }
                }
            });
        }

        // 3. Volume and Config References
        const processVolumeEdges = (podItem: any, sourceNodeId: string) => {
            if (podItem.spec?.volumes) {
                podItem.spec.volumes.forEach((volume: any) => {
                    if (volume.configMap) {
                        const targetId = `ConfigMap/${volume.configMap.name}`;
                        if (nodes.find(n => n.id === targetId)) {
                            const edgeId = `${sourceNodeId}-cm-${volume.configMap.name}`;
                            if (!edges.some(e => e.id === edgeId)) {
                                const edgeStyle = { stroke: '#94a3b8', strokeWidth: 1.2, strokeDasharray: '3,3' };
                                edges.push({ 
                                    id: edgeId, 
                                    source: sourceNodeId, 
                                    target: targetId, 
                                    animated: false, 
                                    markerEnd: 'arrow',
                                    style: edgeStyle,
                                    data: { originalStyle: edgeStyle }
                                });
                                addHierarchyLink(sourceNodeId, targetId);
                            }
                        }
                    }
                    if (volume.secret) {
                        const targetId = `Secret/${volume.secret.secretName}`;
                        if (nodes.find(n => n.id === targetId)) {
                            const edgeId = `${sourceNodeId}-secret-${volume.secret.secretName}`;
                            if (!edges.some(e => e.id === edgeId)) {
                                const edgeStyle = { stroke: '#94a3b8', strokeWidth: 1.2, strokeDasharray: '3,3' };
                                edges.push({ 
                                    id: edgeId, 
                                    source: sourceNodeId, 
                                    target: targetId, 
                                    animated: false, 
                                    markerEnd: 'arrow',
                                    style: edgeStyle,
                                    data: { originalStyle: edgeStyle }
                                });
                                addHierarchyLink(sourceNodeId, targetId);
                            }
                        }
                    }
                    if (volume.persistentVolumeClaim) {
                        const targetId = `PersistentVolumeClaim/${volume.persistentVolumeClaim.claimName}`;
                        if (nodes.find(n => n.id === targetId)) {
                            const edgeId = `${sourceNodeId}-pvc-${volume.persistentVolumeClaim.claimName}`;
                            if (!edges.some(e => e.id === edgeId)) {
                                const edgeStyle = { stroke: '#94a3b8', strokeWidth: 1.2, strokeDasharray: '3,3' };
                                edges.push({ 
                                    id: edgeId, 
                                    source: sourceNodeId, 
                                    target: targetId, 
                                    animated: false, 
                                    markerEnd: 'arrow',
                                    style: edgeStyle,
                                    data: { originalStyle: edgeStyle }
                                });
                                addHierarchyLink(sourceNodeId, targetId);
                            }
                        }
                    }
                });
            }
        };

        if (kind === 'pod') {
            const isGrouped = groupedPodUids.has(item.metadata.uid || item.metadata.name);
            if (isGrouped) {
                const owner = item.metadata.ownerReferences?.[0];
                if (owner) {
                    processVolumeEdges(item, `PodGroup/${owner.kind}/${owner.name}`);
                }
            } else {
                processVolumeEdges(item, fromId);
            }
        }

        // Ingress -> Service
        if (kind === 'ingress' && item.spec?.rules) {
            item.spec.rules.forEach((rule: any) => {
                rule.http?.paths?.forEach((path: any) => {
                    if (path.backend?.service?.name) {
                        const targetId = `Service/${path.backend.service.name}`;
                        if (nodes.find(n => n.id === targetId)) {
                            const edgeId = `${fromId}-svc-${path.backend.service.name}`;
                            if (!edges.some(e => e.id === edgeId)) {
                                edges.push({ id: edgeId, source: fromId, target: targetId, animated: true, markerEnd: 'arrow' });
                                addHierarchyLink(fromId, targetId);
                            }
                        }
                    }
                });
            });
        }
    });

    nodes.forEach(node => {
        const children = parentToChildren[node.id] || [];
        node.data.childCount = children.length;
    });

    return { nodes, edges, parentToChildren, childToParents };
}

export function mapArgoHealth(status?: string): HealthInfo['status'] {
    switch (status) {
        case 'Healthy': return 'healthy';
        case 'Progressing': return 'progressing';
        case 'Degraded': return 'degraded';
        case 'Suspended': return 'suspended';
        case 'Missing': return 'degraded';
        default: return 'unknown';
    }
}

export function parseArgoAppTree(app: any): ParseGraphResult {
    const nodes: VueFlowNode[] = [];
    const edges: VueFlowEdge[] = [];
    const parentToChildren: Record<string, string[]> = {};
    const childToParents: Record<string, string[]> = {};

    const addHierarchyLink = (parent: string, child: string) => {
        if (!parentToChildren[parent]) parentToChildren[parent] = [];
        if (!parentToChildren[parent].includes(child)) parentToChildren[parent].push(child);

        if (!childToParents[child]) childToParents[child] = [];
        if (!childToParents[child].includes(parent)) childToParents[child].push(parent);
    };

    if (!app || !app.metadata) {
        return { nodes: [], edges: [], parentToChildren: {}, childToParents: {} };
    }

    const appName = app.metadata.name;
    const rootId = `Application/${appName}`;

    nodes.push({
        id: rootId,
        data: {
            resourceType: 'Application',
            name: appName,
            metadata: app.metadata,
            spec: app.spec,
            status: app.status,
            health: {
                status: mapArgoHealth(app.status?.health?.status),
                reason: app.status?.health?.message || app.status?.sync?.status || 'Argo Application'
            },
            syncStatus: app.status?.sync?.status || 'Unknown',
            age: app.metadata.creationTimestamp,
            isPodGroup: false,
        },
        position: { x: 0, y: 0 },
        type: 'custom',
    });

    const resources: any[] = app.status?.resources || [];

    resources.forEach((res: any) => {
        const nodeId = `${res.kind}/${res.name}`;
        const healthStatus = mapArgoHealth(res.health?.status);
        const healthReason = res.health?.message || res.status || '';

        nodes.push({
            id: nodeId,
            data: {
                resourceType: res.kind,
                name: res.name,
                metadata: {
                    name: res.name,
                    namespace: res.namespace,
                },
                health: {
                    status: healthStatus,
                    reason: healthReason
                },
                syncStatus: res.status || 'Synced',
                requiresPruning: res.requiresPruning,
                isPodGroup: false,
            },
            position: { x: 0, y: 0 },
            type: 'custom',
        });

        const edgeId = `${rootId}-${nodeId}`;
        edges.push({
            id: edgeId,
            source: rootId,
            target: nodeId,
            animated: true,
            markerEnd: 'arrowclosed',
            type: 'smoothstep'
        });
        addHierarchyLink(rootId, nodeId);
    });

    nodes.forEach(node => {
        const children = parentToChildren[node.id] || [];
        node.data.childCount = children.length;
    });

    return { nodes, edges, parentToChildren, childToParents };
}
