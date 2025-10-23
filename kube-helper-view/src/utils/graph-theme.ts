import type { Options } from 'vis-network';

const commonOptions: Options = {
    interaction: {
        zoomView: true,
        navigationButtons: true,
        hover: true,
        tooltipDelay: 200,
    },
    physics: {
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
            gravitationalConstant: -50,
            centralGravity: 0.005,
            springLength: 230,
            springConstant: 0.18,
        },
        maxVelocity: 146,
        minVelocity: 0.1,
        stabilization: {
            iterations: 150,
        },
    },
    nodes: {
        borderWidth: 2,
        size: 100,
        font: {
            size: 14,
            face: 'monospace',
        },
    },
    edges: {
        width: 2,
        arrows: {
            to: {
                enabled: true,
                scaleFactor: 0.5,
            },
        },
    },
};

const darkThemeOptions: Options = {
    ...commonOptions,
    nodes: {
        ...commonOptions.nodes,
        color: {
            border: '#61dafb',
            background: '#282c34',
            highlight: {
                border: '#282c34',
                background: '#61dafb',
            },
            hover: {
                border: '#282c34',
                background: '#61dafb',
            },
        },
        font: {
            size: typeof commonOptions.nodes?.font === 'object' ? commonOptions.nodes.font.size : undefined,
            face: typeof commonOptions.nodes?.font === 'object' ? commonOptions.nodes.font.face : undefined,
            color: '#ffffff'
        },
    },
    edges: {
        ...commonOptions.edges,
        color: {
            color: '#ffffff',
            highlight: '#61dafb',
            hover: '#61dafb',
        },
    },
};

const lightThemeOptions: Options = {
    ...commonOptions,
    nodes: {
        ...commonOptions.nodes,
        color: {
            border: '#41b883',
            background: '#ffffff',
        },
        font: {
            size: typeof commonOptions.nodes?.font === 'object' ? commonOptions.nodes.font.size : undefined,
            face: typeof commonOptions.nodes?.font === 'object' ? commonOptions.nodes.font.face : undefined,
            color: '#000000',
        },
    },
    edges: {
        ...commonOptions.edges,
        color: {
            color: '#000000',
            highlight: '#41b883',
            hover: '#41b883',
        },
    },
};

export function getThemeOptions(theme: 'dark' | 'light'): Options {
    return theme === 'dark' ? darkThemeOptions : lightThemeOptions;
}
