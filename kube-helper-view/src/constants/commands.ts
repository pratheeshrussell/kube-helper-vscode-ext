export const kubeCmds = {
    getClusters: "kubectl config view -o json",
    getNamespaces: "kubectl get namespaces {{context}} -o json",
    getClusterNodes: "kubectl get nodes {{context}} -o json",
    getPodList: "kubectl get pods {{namespace}} {{context}} -o json",
    getPodByName: "kubectl get pod {{podname}} {{namespace}} {{context}} -o json",
    getServiceList: "kubectl get services {{namespace}} {{context}} -o json",

    getLogsPod: "kubectl logs {{podname}} {{namespace}} {{context}}",
    getLogsContainer: "kubectl logs {{podname}} -c {{container}} {{namespace}} {{context}}",

    getDescribePod: "kubectl describe pod {{podname}} {{namespace}} {{context}}",

    execPod: "kubectl exec -it {{podname}} {{namespace}} {{context}} -- {{command}}",
    execContainer: "kubectl exec -it {{podname}} -c {{container}} {{namespace}} {{context}} -- {{command}}",
    
    portfwdPod: "kubectl port-forward {{podname}} {{portmapping}} {{namespace}} {{context}}",

    deletePod: "kubectl delete pod {{podname}} {{namespace}} {{context}}",
} as const;