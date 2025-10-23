import { DataSet } from 'vis-network/standalone';
import type { VisNode, VisEdge, K8sResourceList } from '../types/graph.type';

export function parseGraphData(resources: Record<string, K8sResourceList>): { nodes: VisNode[], edges: VisEdge[] } {
    const nodes = new DataSet<VisNode>();
    const edges = new DataSet<VisEdge>();
    const allItems: any[] = [];

    const ignoreResources = ['event'];

    // First pass: Create all nodes and flatten the resource list
    Object.values(resources).forEach(list => {
        if (list && list.items) {
            list.items.forEach((item: any) => {

                if(ignoreResources.includes(item.kind.toLowerCase())){
                    return;
                }
                allItems.push(item);
                nodes.add({
                    id: `${item.kind}/${item.metadata.name}`,
                    label: `${item.metadata.name}\n${item.kind}`,
                    shape: 'box',
                    resourceType: item.kind.toLowerCase(),
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
                if (nodes.get(toId)) {
                    edges.add({ from: toId, to: fromId, arrows: 'to' });
                }
            });
        }

        // Generic Label Selection: Connect resources with selectors to matching resources
        if (item.spec?.selector) {
            const selector = item.spec.selector;
            // Find all items that match this selector
            const matchingItems = allItems.filter(potentialMatch => {
                if (potentialMatch.metadata?.labels) {
                    return Object.entries(selector).every(([key, value]) => potentialMatch.metadata.labels[key] === value);
                }
                return false;
            });
            matchingItems.forEach(match => {
                const toId = `${match.kind}/${match.metadata.name}`;
                edges.add({ from: fromId, to: toId, arrows: 'to' });
            });
        }

        // Specific Name-Based References
        // Pod -> Volume (ConfigMap, Secret, PVC)
        if (item.kind === 'Pod' && item.spec.volumes) {
            item.spec.volumes.forEach((volume: any) => {
                if (volume.configMap) {
                    edges.add({ from: fromId, to: `ConfigMap/${volume.configMap.name}`, arrows: 'to' });
                }
                if (volume.secret) {
                    edges.add({ from: fromId, to: `Secret/${volume.secret.secretName}`, arrows: 'to' });
                }
                if (volume.persistentVolumeClaim) {
                    edges.add({ from: fromId, to: `PersistentVolumeClaim/${volume.persistentVolumeClaim.claimName}`, arrows: 'to' });
                }
            });
        }

        // Pod -> ServiceAccount
        if (item.kind === 'Pod' && item.spec.serviceAccountName) {
            edges.add({ from: fromId, to: `ServiceAccount/${item.spec.serviceAccountName}`, arrows: 'to' });
        }

        // Ingress -> Service
        if (item.kind === 'Ingress' && item.spec.rules) {
            item.spec.rules.forEach((rule: any) => {
                rule.http?.paths.forEach((path: any) => {
                    if (path.backend?.service?.name) {
                        edges.add({ from: fromId, to: `Service/${path.backend.service.name}`, arrows: 'to' });
                    }
                });
            });
        }
    });

    return { nodes: nodes.get(), edges: edges.get() };
}
