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
}