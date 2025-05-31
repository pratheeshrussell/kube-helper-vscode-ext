export const kubeCmds = {
    getClusters: "kubectl config view -o json",
    getNonNamespacedResourceByType: "kubectl get {{resType}} {{context}} -o json",
    describeNonNamespacedResource: "kubectl describe {{resType}} {{resName}} {{context}}",
    // namespaced Resources
    getNamespacedResourceByType: "kubectl get {{resType}} {{namespace}} {{context}} -o json",
    getNamespacedResourceByName: "kubectl get {{resType}} {{resName}} {{namespace}} {{context}} -o json",
    getNamespacedResourceByNameOutput: "kubectl get {{resType}} {{resName}} {{namespace}} {{context}} -o yaml", // Added
    getEventsPerResource: "kubectl get events --field-selector involvedObject.kind={{resType}},involvedObject.name={{resName}} {{namespace}} {{context}} -o json",
    //
    getNamespacedResourceLogs: "kubectl logs {{resType}}/{{resName}} {{namespace}} {{context}}",
    getLogsContainer: "kubectl logs {{podname}} -c {{container}} {{namespace}} {{context}}",
    describeNamespacedResource: "kubectl describe {{resType}} {{resName}} {{namespace}} {{context}}",
    deleteNamespacedResource: "kubectl delete {{resType}} {{resName}} {{namespace}} {{context}}",
    editNamespacedResource: "kubectl edit {{resType}} {{resName}} {{namespace}} {{context}}",
    //
    execPod: "kubectl exec -it {{podname}} {{namespace}} {{context}} -- {{command}}",
    execContainer: "kubectl exec -it {{podname}} -c {{container}} {{namespace}} {{context}} -- {{command}}",
    
    portfwdPod: "kubectl port-forward {{podname}} {{portmapping}} {{namespace}} {{context}}",
    portfwdSvc: "kubectl port-forward svc/{{svcname}} {{portmapping}} {{namespace}} {{context}}",
} as const;