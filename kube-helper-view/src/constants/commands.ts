export const kubeCmds = {
    getClusters: "kubectl config view -o json",

    // CRDs
    getCRDs: "kubectl get crds -o json",
    getCRDByName: "kubectl get crd {{crdName}} -o json", // For fetching a single CRD by its full name
    describeCRDByName: "kubectl describe crd {{crdName}}", // For describing a single CRD by its full name

    // Namespaces
    getNamespaces: "kubectl get namespaces -o json",

    // Existing generic commands (might be useful for some CR operations if kind is known)
    getNonNamespacedResourceByType: "kubectl get {{resType}} {{context}} -o json", // e.g., resType can be 'crds'
    describeNonNamespacedResource: "kubectl describe {{resType}} {{resName}} {{context}}", // e.g., resType 'crd', resName 'my.crd.com'

    // Namespaced Resources (some CRs will be namespaced)
    getNamespacedResourceByType: "kubectl get {{resType}} {{namespace}} {{context}} -o json",
    getNamespacedResourceByName: "kubectl get {{resType}} {{resName}} {{namespace}} {{context}} -o json", // For specific named CR
    describeNamespacedResource: "kubectl describe {{resType}} {{resName}} {{namespace}} {{context}}", // For specific named CR

    getEventsPerResource: "kubectl get events --field-selector involvedObject.kind={{resType}},involvedObject.name={{resName}} {{namespace}} {{context}} -o json",
    getNamespacedResourceLogs: "kubectl logs {{resType}}/{{resName}} {{namespace}} {{context}}",
    getLogsContainer: "kubectl logs {{podname}} -c {{container}} {{namespace}} {{context}}",
    deleteNamespacedResource: "kubectl delete {{resType}} {{resName}} {{namespace}} {{context}}",
    editNamespacedResource: "kubectl edit {{resType}} {{resName}} {{namespace}} {{context}}",

    execPod: "kubectl exec -it {{podname}} {{namespace}} {{context}} -- {{command}}",
    execContainer: "kubectl exec -it {{podname}} -c {{container}} {{namespace}} {{context}} -- {{command}}",
    
    portfwdPod: "kubectl port-forward {{podname}} {{portmapping}} {{namespace}} {{context}}",
    portfwdSvc: "kubectl port-forward svc/{{svcname}} {{portmapping}} {{namespace}} {{context}}",
} as const;