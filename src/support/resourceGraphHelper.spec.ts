import { mapK8sStatus, handleGetResourceGraph } from './resourceGraphHelper'; // Assuming handleGetResourceGraph might be testable with mocks
import type { K8sResourceNodeData, K8sVueFlowNode, K8sVueFlowEdge, ResourceGraphData } from '../../common/messageTypes';
import { Utils } from './utils'; // To mock executeCommand
import type * as vscode from 'vscode'; // For WebviewView type if needed for handleGetResourceGraph

// Mock vscode and its components if they are used within the functions being tested
// For handleGetResourceGraph, it expects a webviewView.
const mockWebviewView = {
    webview: {
        postMessage: jest.fn(),
    },
} as unknown as vscode.WebviewView;

// Mock Utils.executeCommand
jest.mock('./utils', () => ({
    Utils: {
        executeCommand: jest.fn(),
        // Mock other Utils functions if your main functions use them
        getCurrentKubeContext: jest.fn().mockResolvedValue('test-context'),
    },
}));


describe('mapK8sStatus', () => {
    it('should map Pod statuses correctly', () => {
        const podRunning = { kind: 'Pod', spec: { containers: [{name: 'c1'}]}, status: { phase: 'Running', containerStatuses: [{ name: 'c1', ready: true }] } };
        expect(mapK8sStatus(podRunning)).toEqual({ status: 'Running', health: { ready: 1, desired: 1 }, labelDetails: '1/1 Ready' });

        const podPending = { kind: 'Pod', spec: { containers: [{name: 'c1'}]}, status: { phase: 'Pending' } };
        expect(mapK8sStatus(podPending)).toEqual({ status: 'Pending', health: { ready: 0, desired: 1 }, labelDetails: '0/1 Ready' });

        const podSucceeded = { kind: 'Pod', spec: { containers: [{name: 'c1'}]}, status: { phase: 'Succeeded' } };
        expect(mapK8sStatus(podSucceeded)).toEqual({ status: 'Succeeded', health: { ready: 0, desired: 1 }, labelDetails: '0/1 Ready' });

        const podFailed = { kind: 'Pod', spec: { containers: [{name: 'c1'}]}, status: { phase: 'Failed' } };
        expect(mapK8sStatus(podFailed)).toEqual({ status: 'Failed', health: { ready: 0, desired: 1 }, labelDetails: '0/1 Ready' });

        const podUnknown = { kind: 'Pod', spec: { containers: [{name: 'c1'}]}, status: { phase: 'Unknown' } };
        expect(mapK8sStatus(podUnknown)).toEqual({ status: 'Unknown', health: { ready: 0, desired: 1 }, labelDetails: '0/1 Ready' });
    });

    it('should map Deployment statuses correctly', () => {
        const deploymentRunning = {
            kind: 'Deployment',
            spec: { replicas: 2 },
            status: { availableReplicas: 2, conditions: [{ type: 'Available', status: 'True' }] }
        };
        expect(mapK8sStatus(deploymentRunning)).toEqual({ status: 'Running', health: { ready: 2, desired: 2 }, labelDetails: '2/2 Ready' });

        const deploymentProgressing = {
            kind: 'Deployment',
            spec: { replicas: 2 },
            status: { availableReplicas: 1, conditions: [{ type: 'Available', status: 'False' }, { type: 'Progressing', status: 'True', reason: 'NewReplicaSetAvailable' }] }
        };
        expect(mapK8sStatus(deploymentProgressing)).toEqual({ status: 'Pending', health: { ready: 1, desired: 2 }, labelDetails: '1/2 Ready' });

        const deploymentScaledDown = {
            kind: 'Deployment',
            spec: { replicas: 0 },
            status: { availableReplicas: 0 }
        };
        expect(mapK8sStatus(deploymentScaledDown)).toEqual({ status: 'ScaledDown', health: { ready: 0, desired: 0 }, labelDetails: '0/0 Ready' });
    });

    it('should map StatefulSet statuses correctly', () => {
        const sfsRunning = { kind: 'StatefulSet', spec: { replicas: 1 }, status: { readyReplicas: 1 } };
        expect(mapK8sStatus(sfsRunning)).toEqual({ status: 'Running', health: { ready: 1, desired: 1 }, labelDetails: '1/1 Ready' });

        const sfsPending = { kind: 'StatefulSet', spec: { replicas: 1 }, status: { readyReplicas: 0 } };
        expect(mapK8sStatus(sfsPending)).toEqual({ status: 'Pending', health: { ready: 0, desired: 1 }, labelDetails: '0/1 Ready' });
    });

    it('should map DaemonSet statuses correctly', () => {
        const dsRunning = { kind: 'DaemonSet', status: { numberReady: 3, desiredNumberScheduled: 3 } };
        expect(mapK8sStatus(dsRunning)).toEqual({ status: 'Running', health: { ready: 3, desired: 3 }, labelDetails: '3/3 Ready' });

        const dsPending = { kind: 'DaemonSet', status: { numberReady: 2, desiredNumberScheduled: 3 } };
        expect(mapK8sStatus(dsPending)).toEqual({ status: 'Pending', health: { ready: 2, desired: 3 }, labelDetails: '2/3 Ready' });
    });

    it('should map ReplicaSet statuses correctly', () => {
        const rsRunning = { kind: 'ReplicaSet', spec: { replicas: 1 }, status: { availableReplicas: 1 } };
        expect(mapK8sStatus(rsRunning)).toEqual({ status: 'Running', health: { ready: 1, desired: 1 }, labelDetails: '1/1 Ready' });

        const rsPending = { kind: 'ReplicaSet', spec: { replicas: 1 }, status: { availableReplicas: 0 } };
        expect(mapK8sStatus(rsPending)).toEqual({ status: 'Pending', health: { ready: 0, desired: 1 }, labelDetails: '0/1 Ready' });
    });

    it('should map Service statuses correctly', () => {
        const serviceClusterIP = { kind: 'Service', spec: { type: 'ClusterIP' } };
        expect(mapK8sStatus(serviceClusterIP)).toEqual({ status: 'ClusterIP', labelDetails: 'Type: ClusterIP' });
    });

    it('should map Ingress statuses correctly', () => {
        const ingress = { kind: 'Ingress', spec: {} }; // Ingress status is often external
        expect(mapK8sStatus(ingress)).toEqual({ status: 'Active' });
    });

    it('should return Unknown for unhandled kinds or missing status', () => {
        const unknownKind = { kind: 'CustomWeirdResource', status: { someStatus: 'ok' } };
        expect(mapK8sStatus(unknownKind)).toEqual({ status: 'Unknown' });
        const noStatus = { kind: 'Pod', spec: {} }; // No status field
        expect(mapK8sStatus(noStatus)).toEqual({ status: 'Unknown' });
    });
});

describe('handleGetResourceGraph - Node and Edge Creation', () => {
    beforeEach(() => {
        // Clear mock call history before each test
        (Utils.executeCommand as jest.Mock).mockClear();
        mockWebviewView.webview.postMessage.mockClear();
    });

    const mockDeployment = {
        apiVersion: 'apps/v1', kind: 'Deployment', metadata: { name: 'test-dep', namespace: 'test-ns', uid: 'dep-uid', labels: {'app': 'my-app'} },
        spec: { replicas: 1, selector: { matchLabels: { app: 'my-app' } } },
        status: { availableReplicas: 1 }
    };
    const mockReplicaSet = {
        apiVersion: 'apps/v1', kind: 'ReplicaSet', metadata: { name: 'test-rs', namespace: 'test-ns', uid: 'rs-uid', ownerReferences: [{ apiVersion: 'apps/v1', kind: 'Deployment', name: 'test-dep', uid: 'dep-uid' }], labels: {'app': 'my-app'} },
        spec: { replicas: 1 }, status: { availableReplicas: 1 }
    };
    const mockPod = {
        apiVersion: 'v1', kind: 'Pod', metadata: { name: 'test-pod', namespace: 'test-ns', uid: 'pod-uid', ownerReferences: [{ apiVersion: 'apps/v1', kind: 'ReplicaSet', name: 'test-rs', uid: 'rs-uid' }], labels: {'app': 'my-app'} },
        spec: { containers: [{name: 'c1'}] }, status: { phase: 'Running', containerStatuses: [{name: 'c1', ready: true}] }
    };
    const mockService = {
        apiVersion: 'v1', kind: 'Service', metadata: { name: 'test-svc', namespace: 'test-ns', uid: 'svc-uid' },
        spec: { selector: { app: 'my-app' }, type: 'ClusterIP', ports: [{port: 80}] }
    };
     const mockIngress = {
        apiVersion: 'networking.k8s.io/v1', kind: 'Ingress', metadata: { name: 'test-ing', namespace: 'test-ns', uid: 'ing-uid' },
        spec: { rules: [{ http: { paths: [{ backend: { service: { name: 'test-svc', port: { number: 80 } } } }] } }] }
    };


    it('should create correct nodes from K8s resources', async () => {
        (Utils.executeCommand as jest.Mock)
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [mockDeployment] }) }) // deployments
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) }) // statefulsets
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) }) // daemonsets
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) }) // replicasets
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [mockPod] }) })    // pods
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) }) // services
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) });// ingresses

        await handleGetResourceGraph(mockWebviewView, 'test-ns', 'test-context');

        expect(mockWebviewView.webview.postMessage).toHaveBeenCalledTimes(1);
        const result = mockWebviewView.webview.postMessage.mock.calls[0][0].data as ResourceGraphData;

        expect(result.nodes).toHaveLength(2);
        const depNode = result.nodes.find(n => n.data.kind === 'Deployment');
        const podNode = result.nodes.find(n => n.data.kind === 'Pod');

        expect(depNode).toBeDefined();
        expect(depNode?.data.name).toBe('test-dep');
        expect(depNode?.data.status).toBe('Running');
        expect(depNode?.id).toBe('deployment/test-ns/test-dep');
        expect(depNode?.type).toBe('k8sNode');

        expect(podNode).toBeDefined();
        expect(podNode?.data.name).toBe('test-pod');
        expect(podNode?.data.status).toBe('Running');
        expect(podNode?.id).toBe('pod/test-ns/test-pod');
    });

    it('should create OwnerReference edges', async () => {
        (Utils.executeCommand as jest.Mock)
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [mockDeployment] }) })
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) })
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) })
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [mockReplicaSet] }) })
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [mockPod] }) })
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) })
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) });

        await handleGetResourceGraph(mockWebviewView, 'test-ns', 'test-context');
        const result = mockWebviewView.webview.postMessage.mock.calls[0][0].data as ResourceGraphData;

        expect(result.edges).toHaveLength(2);
        const depToRsEdge = result.edges.find(e => e.source === 'deployment/test-ns/test-dep' && e.target === 'replicaset/test-ns/test-rs');
        expect(depToRsEdge).toBeDefined();
        const rsToPodEdge = result.edges.find(e => e.source === 'replicaset/test-ns/test-rs' && e.target === 'pod/test-ns/test-pod');
        expect(rsToPodEdge).toBeDefined();
    });

    it('should create Service-to-Pod edges based on selector', async () => {
        (Utils.executeCommand as jest.Mock)
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) }) // deployments
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) }) // statefulsets
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) }) // daemonsets
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) }) // replicasets
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [mockPod] }) })    // pods
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [mockService] }) }) // services
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) });// ingresses

        await handleGetResourceGraph(mockWebviewView, 'test-ns', 'test-context');
        const result = mockWebviewView.webview.postMessage.mock.calls[0][0].data as ResourceGraphData;

        expect(result.nodes.find(n => n.data.kind === 'Service')).toBeDefined();
        expect(result.nodes.find(n => n.data.kind === 'Pod')).toBeDefined();

        const serviceToPodEdge = result.edges.find(e => e.source === 'service/test-ns/test-svc' && e.target === 'pod/test-ns/test-pod');
        expect(serviceToPodEdge).toBeDefined();
    });

    it('should create Ingress-to-Service edges', async () => {
         (Utils.executeCommand as jest.Mock)
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) })
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) })
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) })
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) })
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) })
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [mockService] }) })
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [mockIngress] }) });

        await handleGetResourceGraph(mockWebviewView, 'test-ns', 'test-context');
        const result = mockWebviewView.webview.postMessage.mock.calls[0][0].data as ResourceGraphData;

        const ingressToServiceEdge = result.edges.find(e => e.source === 'ingress/test-ns/test-ing' && e.target === 'service/test-ns/test-svc');
        expect(ingressToServiceEdge).toBeDefined();
    });

    it('should handle errors from kubectl commands gracefully', async () => {
        (Utils.executeCommand as jest.Mock)
            .mockResolvedValueOnce({ stdout: '', stderr: 'Error fetching deployments' }) // deployments fail
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [mockPod] }) })    // pods succeed
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) })
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) })
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) })
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) })
            .mockResolvedValueOnce({ stdout: JSON.stringify({ items: [] }) });

        await handleGetResourceGraph(mockWebviewView, 'test-ns', 'test-context');
        const result = mockWebviewView.webview.postMessage.mock.calls[0][0].data as ResourceGraphData;

        expect(result.nodes.find(n => n.data.kind === 'Pod')).toBeDefined();
        expect(result.nodes.find(n => n.data.kind === 'Deployment')).toBeUndefined();
        expect(result.error).toBeUndefined(); // Top-level error not set for partial failures, but logged.
    });

     it('should post an error message if all kubectl commands fail or a major error occurs', async () => {
        (Utils.executeCommand as jest.Mock).mockRejectedValue(new Error("Major kubectl failure"));

        await handleGetResourceGraph(mockWebviewView, 'test-ns', 'test-context');

        expect(mockWebviewView.webview.postMessage).toHaveBeenCalledTimes(1);
        const result = mockWebviewView.webview.postMessage.mock.calls[0][0].data as ResourceGraphData;
        expect(result.error).toBe("Major kubectl failure");
        expect(result.nodes).toEqual([]);
        expect(result.edges).toEqual([]);
    });

});
