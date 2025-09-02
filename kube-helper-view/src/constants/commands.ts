export const kubeCmds = {
    getClusters: "kubectl config view -o json",
    getNonNamespacedResourceByType: "kubectl get {{resType}} {{context}} -o json",
    describeNonNamespacedResource: "kubectl describe {{resType}} {{resName}} {{context}}",
    // namespaced Resources
    getNamespacedResourceByType: "kubectl get {{resType}} {{namespace}} {{context}} -o json",
    getNamespacedResourceByName: "kubectl get {{resType}} {{resName}} {{namespace}} {{context}} -o json",
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

    runDebugPod: "kubectl run -i --tty --rm {{podName}} --image={{image}} --restart=Never {{namespace}} {{context}} --command -- {{command}}",

    nodeDebugPod: "kubectl debug node/{{nodename}} -it --image={{image}} {{context}}",
} as const;