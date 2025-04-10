export const kubeCmds = {
    getClusters: "kubectl config view -o json",
    getNamespaces: "kubectl get namespaces {{context}} -o json",
    getScList: "kubectl get sc {{context}} -o json",
    getIngressClassList: "kubectl get ingressclass {{context}} -o json",

    getClusterNodes: "kubectl get nodes {{context}} -o json",
    getPodList: "kubectl get pods {{namespace}} {{context}} -o json",
    getPodByName: "kubectl get pod {{podname}} {{namespace}} {{context}} -o json",
    getServiceList: "kubectl get services {{namespace}} {{context}} -o json",
    getPvList: "kubectl get pv {{namespace}} {{context}} -o json",
    getPvcList: "kubectl get pvc {{namespace}} {{context}} -o json",

    getEvents: "kubectl get events {{namespace}} {{context}} -o json",
    getConfigMap: "kubectl get configmap {{namespace}} {{context}} -o json",
    getConfigMapByName: "kubectl get configmap {{cmname}} {{namespace}} {{context}} -o json",
    getSecretList: "kubectl get secret {{namespace}} {{context}} -o json",
    getSecretByName: "kubectl get secret {{secretname}} {{namespace}} {{context}} -o json",

    getIngressList: "kubectl get ingress {{namespace}} {{context}} -o json",
    getIngressByName: "kubectl get ingress {{ingress}} {{namespace}} {{context}} -o json",
    getEndpointList: "kubectl get endpoints {{namespace}} {{context}} -o json",

    getClusterRoleList: "kubectl get clusterroles {{context}} -o json",
    getClusterRoleBindingList: "kubectl get clusterrolebindings {{context}} -o json",

    getRoleList: "kubectl get roles {{namespace}} {{context}} -o json",
    getRoleBindingList: "kubectl get rolebindings {{namespace}} {{context}} -o json",
    getServiceAccountList: "kubectl get serviceaccounts {{namespace}} {{context}} -o json",

    getReplSetList: "kubectl get replicasets {{namespace}} {{context}} -o json",
    getDeploymentList: "kubectl get deployments {{namespace}} {{context}} -o json",

    getLogsPod: "kubectl logs {{podname}} {{namespace}} {{context}}",
    getLogsContainer: "kubectl logs {{podname}} -c {{container}} {{namespace}} {{context}}",
    

    getDescribePod: "kubectl describe pod {{podname}} {{namespace}} {{context}}",
    getDescribeSvc: "kubectl describe service {{svcname}} {{namespace}} {{context}}",
    getDescribeConfigMap: "kubectl describe configmap {{cmname}} {{namespace}} {{context}}",
    getDescribeSecret: "kubectl describe secret {{secretname}} {{namespace}} {{context}}",
    getDescribeIngress: "kubectl describe ingress {{ingressname}} {{namespace}} {{context}}",
    getDescribeClusterRole: "kubectl describe clusterrole {{crname}} {{context}}",
    getDescribeClusterRoleBind: "kubectl describe clusterrolebinding {{crbname}} {{context}}",
    getDescribeRole: "kubectl describe role {{rolename}} {{namespace}} {{context}}",
    getDescribeRoleBind: "kubectl describe rolebinding {{rbname}} {{namespace}} {{context}}",
    getDescribeSaBind: "kubectl describe sa {{saname}} {{namespace}} {{context}}",
    getDescribeReplsetBind: "kubectl describe replicaset {{rsname}} {{namespace}} {{context}}",
    getDescribeDeployment: "kubectl describe deployment {{depname}} {{namespace}} {{context}}",

    execPod: "kubectl exec -it {{podname}} {{namespace}} {{context}} -- {{command}}",
    execContainer: "kubectl exec -it {{podname}} -c {{container}} {{namespace}} {{context}} -- {{command}}",
    
    portfwdPod: "kubectl port-forward {{podname}} {{portmapping}} {{namespace}} {{context}}",
    portfwdSvc: "kubectl port-forward svc/{{svcname}} {{portmapping}} {{namespace}} {{context}}",

    deletePod: "kubectl delete pod {{podname}} {{namespace}} {{context}}",
    editPod: "kubectl edit pod {{podname}} {{namespace}} {{context}}",
    editSvc: "kubectl edit svc {{svcname}} {{namespace}} {{context}}",
    editSecret: "kubectl edit secret {{secretname}} {{namespace}} {{context}}",
    editConfigMap: "kubectl edit configmap {{cmname}} {{namespace}} {{context}}",
    editIngress: "kubectl edit ingress {{ingressname}} {{namespace}} {{context}}",
} as const;