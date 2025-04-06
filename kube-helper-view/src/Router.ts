import { createMemoryHistory, createRouter, type RouteRecordRaw } from "vue-router";
import Sidebar from "./components/Sidebar.vue";
import ClusterView from "./components/ClusterView.vue";
import ClusterWideElements from "./components/clusterElements/ClusterWideElements.vue";
import NamespaceElements from "./components/clusterElements/NamespaceElements.vue";
import PodElement from "./components/clusterElements/PodElement.vue";
import ContainerElement from "./components/clusterElements/ContainerElement.vue";
import ServiceElement from "./components/clusterElements/ServiceElement.vue";
import ConfigMapElement from "./components/clusterElements/ConfigMapElement.vue";
import SecretElement from "./components/clusterElements/SecretElement.vue";
import IngressElement from "./components/clusterElements/IngressElement.vue";
import ClusterRoleElement from "./components/clusterElements/ClusterRoleElement.vue";
import ClusterRoleBindElement from "./components/clusterElements/ClusterRoleBindElement.vue";
import RoleElement from "./components/clusterElements/RoleElement.vue";
import RoleBindElement from "./components/clusterElements/RoleBindElement.vue";
import SAElement from "./components/clusterElements/SAElement.vue";
import ReplsetElement from "./components/clusterElements/ReplsetElement.vue";
const routes:Readonly<RouteRecordRaw[]> = [
    {path:'/sidebar', name:'sidebar', component: Sidebar},
    {path:'/clusterDetails', name:'clusterDetails', component: ClusterView,
        children: [
            {path: 'overview', name: 'clusteroverview', component: ClusterWideElements},
            {path: 'ns/:namespace', name: 'namespaceoverview', component: NamespaceElements},
            {path: 'pod/:podname', name: 'podoverview', component: PodElement},
            {path: 'pod/:podname/c/:container', name: 'containeroverview', component: ContainerElement},

            {path: 'svc/:svcname', name: 'svcoverview', component: ServiceElement},

            {path: 'configmap/:cmname', name: 'configmapoverview', component: ConfigMapElement},
            {path: 'secret/:secretname', name: 'secretoverview', component: SecretElement},
            {path: 'ingress/:ingressname', name: 'ingressoverview', component: IngressElement},

            {path: 'clusterrole/:crname', name: 'clusterRoleoverview', component: ClusterRoleElement},
            {path: 'clusterrolebind/:crbname', name: 'clusterRoleBindoverview', component: ClusterRoleBindElement},
            
            
            {path: 'role/:rolename', name: 'roleoverview', component: RoleElement},
            {path: 'rolebind/:rolebindname', name: 'rolebindoverview', component: RoleBindElement},
            {path: 'serviceaccount/:saname', name: 'saoverview', component: SAElement},

            {path: 'replset/:rsname', name: 'replsetoverview', component: ReplsetElement},
            

            {path: '', redirect: { name: 'clusteroverview' }},
        ]
    }
];

const router = createRouter({
    history: createMemoryHistory(),
    routes
})

export default router;