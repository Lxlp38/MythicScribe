import * as vscode from 'vscode';

import { MythicNode, MythicNodeHandler, MythicNodeHandlerRegistry } from './MythicNode';

type Shape =
    | 'ellipse'
    | 'triangle'
    | 'round-triangle'
    | 'rectangle'
    | 'round-rectangle'
    | 'bottom-round-rectangle'
    | 'cut-rectangle'
    | 'barrel'
    | 'rhomboid'
    | 'right-rhomboid'
    | 'diamond'
    | 'round-diamond'
    | 'pentagon'
    | 'round-pentagon'
    | 'hexagon'
    | 'round-hexagon'
    | 'concave-hexagon'
    | 'heptagon'
    | 'round-heptagon'
    | 'octagon'
    | 'round-octagon'
    | 'star'
    | 'tag'
    | 'round-tag'
    | 'vee';

type EdgeType = 'inheritance' | 'association';

type NodeAdditionalData = {
    shape?: Shape;
    color: string;
};
type EdgeAdditionalData = {
    color: string;
    width: number;
};

const NodeTypeToAdditionalData: Record<keyof MythicNodeHandlerRegistry, NodeAdditionalData> = {
    mobs: { shape: 'rectangle', color: '#007acc' },
    items: { shape: 'triangle', color: '#00cc00' },
    metaskills: { shape: 'ellipse', color: '#ffcc00' },
    droptables: { shape: 'diamond', color: '#cc00cc' },
    stats: { shape: 'barrel', color: '#cc0000' },
    // metaskills: 'ellipse',
    // mobs: 'rectangle',
    // items: 'rectangle',
    // droptables: 'rectangle',
    // stats: 'rectangle',
};

const EdgeTypeToAdditionalData: Record<EdgeType, EdgeAdditionalData> = {
    inheritance: { color: '#FF0000', width: 6 },
    association: { color: '#ccc', width: 3 },
};

interface CytoscapeNode {
    data: { id: string; label?: string; shape?: Shape };
}

interface CytoscapeEdge {
    data: { id: string; source: string; target: string };
}

enum selectedElementsType {
    all,
    openDocuments,
}

enum selectedElementsFilter {
    mobs,
    items,
    metaskills,
    droptables,
    stats,
}

const GraphOptions = {
    selectedElements: {
        query: 'What elements do you want to see in the graph?',
        options: [
            { label: 'All', value: selectedElementsType.all },
            { label: 'Only Open Documents', value: selectedElementsType.openDocuments },
        ],
    },
    filters: {
        query: 'Select the elements to hide',
        options: [
            { label: 'Mobs', value: selectedElementsFilter.mobs },
            { label: 'Items', value: selectedElementsFilter.items },
            { label: 'Metaskills', value: selectedElementsFilter.metaskills },
            { label: 'Droptables', value: selectedElementsFilter.droptables },
            { label: 'Stats', value: selectedElementsFilter.stats },
        ],
    },
};

function getIdName(id: keyof MythicNodeHandlerRegistry | MythicNode, name?: string): string {
    if (typeof id === 'string') {
        return `${id}_${name}`;
    }
    return `${id.registry.type}_${id.name.text}`;
}

function buildCytoscapeElements(
    selectedElements: selectedElementsType = selectedElementsType.all,
    selectedFilters: selectedElementsFilter[] = []
): {
    nodes: CytoscapeNode[];
    edges: CytoscapeEdge[];
} {
    const openUris: string[] = [];
    let iterableKeys = Object.keys(
        MythicNodeHandler.registry
    ) as (keyof MythicNodeHandlerRegistry)[];
    const cyNodesMythicNodes: Set<MythicNode> = new Set();
    const cyNodes: CytoscapeNode[] = [];
    const cyEdges: CytoscapeEdge[] = [];

    if (selectedFilters.length > 0) {
        iterableKeys = iterableKeys.filter(
            (key) => !selectedFilters.includes(selectedElementsFilter[key])
        );
    }

    if (selectedElements === selectedElementsType.openDocuments) {
        vscode.window.tabGroups.all.forEach((group) => {
            group.tabs.forEach((tab) => {
                // Check if the tab is a text editor tab
                if (tab.input instanceof vscode.TabInputText) {
                    const uri = tab.input.uri;
                    openUris.push(uri.toString());
                }
            });
        });
    }

    for (const type of iterableKeys) {
        let nodes = MythicNodeHandler.registry[type].getNodeValues();

        if (selectedElements === selectedElementsType.openDocuments) {
            nodes = nodes.filter((node) => openUris.includes(node.document.uri.toString()));
        }

        for (const node of nodes) {
            cyNodesMythicNodes.add(node);

            for (const template of node.templates) {
                const templateNode = MythicNodeHandler.registry[type].getNode(template);
                if (!templateNode) {
                    continue;
                }
                cyEdges.push({
                    data: {
                        id: `${getIdName(node)}_to_${getIdName(templateNode)}`,
                        source: getIdName(node),
                        target: getIdName(templateNode),
                        ...EdgeTypeToAdditionalData.inheritance,
                    },
                });
            }

            for (const subtype of iterableKeys) {
                // For every template this node inherits from, create an edge.
                for (const selectedOutEdge of node.outEdge[subtype]) {
                    const edgeNode = MythicNodeHandler.registry[subtype].getNode(selectedOutEdge);
                    if (!edgeNode) {
                        continue;
                    }
                    if (!cyNodesMythicNodes.has(edgeNode)) {
                        cyNodesMythicNodes.add(edgeNode);
                    }
                    cyEdges.push({
                        data: {
                            id: `${getIdName(node)}_to_${getIdName(edgeNode)}`,
                            source: getIdName(edgeNode),
                            target: getIdName(node),
                            ...EdgeTypeToAdditionalData.association,
                        },
                    });
                }
            }
        }
    }
    cyNodesMythicNodes.forEach((node) => {
        cyNodes.push({
            data: {
                id: getIdName(node),
                label: node.name.text,
                ...NodeTypeToAdditionalData[node.registry.type],
            },
        });
    });

    return { nodes: cyNodes, edges: cyEdges };
}

export async function showNodeGraph(): Promise<void> {
    const selectedElements = await vscode.window
        .showQuickPick(
            GraphOptions.selectedElements.options.map((option) => option.label),
            { title: GraphOptions.selectedElements.query }
        )
        .then((selected) => {
            if (!selected) {
                return;
            }
            const selectedOption = GraphOptions.selectedElements.options.find(
                (option) => option.label === selected
            );
            if (!selectedOption) {
                return;
            }
            return selectedOption.value;
        });

    const selectedFilters = await vscode.window
        .showQuickPick(
            GraphOptions.filters.options.map((option) => option.label),
            { title: GraphOptions.filters.query, canPickMany: true }
        )
        .then((selected) => {
            if (!selected) {
                return;
            }
            return selected.map((selected) => {
                const selectedOption = GraphOptions.filters.options.find(
                    (option) => option.label === selected
                );
                return selectedOption!.value;
            });
        });

    const panel = vscode.window.createWebviewPanel(
        'inheritanceGraph', // Identifies the type of the webview. Used internally
        'Inheritance Graph', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            enableFindWidget: true,
        }
    );

    // Set the webview's HTML content
    panel.webview.html = getWebviewContent();

    const data = buildCytoscapeElements(selectedElements, selectedFilters);
    panel.webview.postMessage({ type: 'graphData', data: data });
}

function getWebviewContent(): string {
    // Note: Added dagre and cytoscape-dagre script tags
    return /*html*/ `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <title>Inheritance Graph</title>
    <script src="https://unpkg.com/cytoscape/dist/cytoscape.min.js"></script>
    <script src="https://unpkg.com/dagre@0.8.5/dist/dagre.min.js"></script>
    <script src="https://unpkg.com/cytoscape-dagre@2.4.0/cytoscape-dagre.js"></script>
    <style>
        html,
        body,
        #cy {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
        }
        .search-container {
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            border-radius: 25px;
            overflow: hidden;
            z-index: 2;
        }
        /* The search input styling */
        .search-input {
            border: none;
            padding: 10px 15px;
            outline: none;
            font-size: 1rem;
        }
        /* The search button styling */
        .search-button {
            border: none;
            padding: 10px 15px;
            background-color: #007BFF;
            color: white;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        .search-button:hover {
            background-color: #0056b3;
        }

    </style>
</head>

<body>
    <div class="search-container">
        <input type="text" class="search-input" placeholder="Search..." id="search">
        <button class="search-button" id="search-button">Search</button>
    </div>
    <div id="cy"></div>
    <script>
        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'graphData') {
                renderGraph(message.data);
            }
        });

        // Function to initialize and render the graph using Cytoscape
        function renderGraph(graphData) {
            const cy = cytoscape({
                container: document.getElementById('cy'),
                elements: [
                    ...graphData.nodes,
                    ...graphData.edges
                ],
                style: [
                    {
                        selector: 'node',
                        style: {
                            'label': 'data(label)',
                            'text-valign': 'center',
                            'background-color': 'data(color)',
                            'color': '#fff',
                            'border-width': 0,
                            'shape': 'data(shape)',
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 'data(width)',
                            'line-color': 'data(color)',
                            'curve-style': 'bezier',
                            'source-arrow-shape': 'triangle',
                            'source-arrow-color': 'data(color)',
                            'source-arrow-fill': 'filled'
                        }
                    },
                    {
                        selector: '.faded',
                        style: {
                            'opacity': 0.25,
                            'transition-property': 'opacity',
                            'transition-duration': '0.5s'
                        }
                    },
                    {
                        selector: 'node:selected',
                        style: {
                            'border-color': '#FFD700',
                            'border-width': 4
                        }
                    },
                ],
                layout: {
                    name: 'cose',
                    animate: false,
                    rankDir: 'BT',
                    padding: 100, // adds padding around the entire graph
                    spacingFactor: 40, // increases the distance between nodes
                    componentSpacing: 100, // increases the distance between components
                    gravity: 0.2, // pulls nodes towards the center
                    idealEdgeLength: 80,
                    nodeDimensionsIncludeLabels: true,
                },
                zoom: 10,
                wheelSensitivity: 0.25,
            });

            function resetNodesAndEdges(resetOpacity = true) {
                if (resetOpacity) {
                    cy.elements().style('opacity', 1);
                }
                cy.nodes().style('border-width', null);
                cy.edges().style('line-color', null);
            }

            cy.on('select', 'node', function (evt) {
                let selectedNode = evt.target;

                resetNodesAndEdges(false);
                cy.elements().style('opacity', 0.25);

                cy.elements().bfs({
                    root: selectedNode,
                    directed: true,
                    visit: function (node, edge, parent, i, depth) {
                        const opacity = Math.max(1 - Math.min(0.05 * depth, 0.9), 0.45);
                        const newOpacity = opacity;
                        node.style('opacity', newOpacity);
                        if (edge) {
                            edge.style('opacity', newOpacity);
                        }
                    }
                });

                // Get inbound nodes and edges:
                const inboundNodes = selectedNode.incomers('node');
                const inboundEdges = selectedNode.incomers('edge');

                // Get outbound nodes and edges:
                const outboundNodes = selectedNode.outgoers('node');
                const outboundEdges = selectedNode.outgoers('edge');

                // Apply different styles:
                // For inbound nodes, for example, use a red border.
                inboundNodes.style({
                    'opacity': 0.8,
                    'border-width': 4,
                    'border-color': '#FF0000'
                });
                inboundEdges.style({
                    'opacity': 0.8,
                    'line-color': '#FF0000'
                });

                // For outbound nodes, for example, use a green border.
                outboundNodes.style({
                    'opacity': 0.9,
                    'border-width': 4,
                    'border-color': '#00FF00'
                });
                outboundEdges.style({
                    'opacity': 0.9,
                    'line-color': '#00FF00'
                });

                selectedNode.style('border-color', '#FFD700');
                selectedNode.style('border-width', 4);

            });

            cy.on('unselect', 'node', function (evt) {
                resetNodesAndEdges();
            });

            cy.on('zoom', function () {
                const zoom = cy.zoom();
                const newEdgeWidth = Math.max(2, 1.2 * zoom);
                cy.edges().style('width', newEdgeWidth);
            });

            function searchNode() {
                const query = document.getElementById('search').value.trim().toLowerCase();
                if (query === '') {
                    // Reset all elements to full opacity when no search is active.
                    cy.elements().style('opacity', 1);
                } else {
                    // Fade out all elements first.
                    cy.elements().style('opacity', 0.25);
                    // For nodes whose label includes the search query, restore full opacity.
                    cy.nodes().filter(node => {
                    return node.data('label').toLowerCase().includes(query);
                    }).style('opacity', 1);
                    // Optionally, you can also restore opacity for edges connected to matching nodes:
                    cy.edges().filter(edge => {
                    const src = edge.source().data('label').toLowerCase();
                    const tgt = edge.target().data('label').toLowerCase();
                    return src.includes(query) || tgt.includes(query);
                    }).style('opacity', 1);
                }
            }

            // Setup search functionality:
            document.getElementById('search').addEventListener('input', searchNode);
            document.getElementById('search-button').addEventListener('click', searchNode);
    }
    </script>
</body>

</html>
`;
}
