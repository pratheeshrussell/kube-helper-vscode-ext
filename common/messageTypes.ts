export enum MessageTypes {

    VIEW_READY = 'VIEW_READY',
    RUN_CMD_TERMINAL = 'RUN_CMD_TERMINAL',
    RUN_CMD_RESULT = 'RUN_CMD_RESULT',
    SHOW_DETAILS = 'OPEN_DETAILS',


    GET_GRAPH_RESOURCES = 'getGraphResources',
    GRAPH_RESOURCES_RESULT = 'graphResourcesResult',
    DESCRIBE_RESOURCE = 'describeResource',
    DESCRIBE_RESOURCE_RESULT = 'describeResourceResult',

    // Timeline events
    GET_TIMELINE_EVENTS = 'getTimelineEvents',
    TIMELINE_EVENTS_RESULT = 'timelineEventsResult',
    TIMELINE_EVENT_NEW = 'timelineEventNew',
    CLEAR_TIMELINE = 'clearTimeline',

    // Cluster Stats
    GET_CLUSTER_STATS = 'getClusterStats',
    CLUSTER_STATS_RESULT = 'clusterStatsResult',

    // ArgoCD
    CHECK_ARGOCD_STATUS = 'checkArgoCDStatus',
    ARGOCD_STATUS_RESULT = 'argoCDStatusResult',

    // ArgoCD namespace detection (for admin secret)
    GET_ARGOCD_NAMESPACE = 'getArgoCDNamespace',
    ARGOCD_NAMESPACE_RESULT = 'argoCDNamespaceResult',
}