import cytoscape from 'cytoscape';
import contextMenus from 'cytoscape-context-menus';
import fcose from 'cytoscape-fcose';

cytoscape.use(contextMenus);
cytoscape.use(fcose);

let cy = null;
let cyContextMenuInstance = null;

const cylayout = {
    name: 'fcose',
    animate: false,
    padding: 40, // adds padding around the entire graph
    spacingFactor: 4, // increases the distance between nodes
    componentSpacing: 4, // increases the distance between components
    gravity: 0.2, // pulls nodes towards the center
    idealEdgeLength: 4,
    nodeDimensionsIncludeLabels: true,
};

// Listen for messages from the extension
window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'graphData') {
        renderGraph(message.data);
    } else if (message.type === 'addGraphData') {
        updateOrAddNodes(message.data.nodes);
        cy.add(message.data.edges);
    } else if (message.type === 'refreshedData') {
        cy.json({ elements: message.data });
        cy.layout(cylayout).run();
    }
});

const vscode = acquireVsCodeApi();

function updateOrAddNodes(newNodes) {
    const addedNodes = [];
    newNodes.forEach((newNode) => {
        const existingNode = cy.getElementById(newNode.data.id);
        if (existingNode.nonempty()) {
            if (existingNode.data('unknown') === true) {
                existingNode.data({
                    ...existingNode.data(),
                    ...newNode.data,
                });
            }
        } else {
            addedNodes.push(...cy.add(newNode));
        }
    });
    cy.layout({ ...cylayout, animate: false, fit: false, eles: cy.collection(addedNodes) }).run();
}

const contextMenusOptions = {
    contextMenuClasses: ['context-menu'],
    menuItemClasses: ['context-menu-li'],
    menuItems: [
        {
            id: 'goToNode',
            content: 'Go to Definition',
            tooltipText: 'Navigate to the node in the source code',
            selector: 'node',
            onClickFunction: (event) => {
                const node = event.target;
                const nodeData = node.data();
                const message = {
                    type: 'goToNode',
                    data: nodeData,
                };
                vscode.postMessage(message, '*');
            },
        },
        {
            id: 'discoverNode',
            content: 'Discover Node',
            tooltipText: 'Discover the Node and its outgoing connections',
            selector: 'node',
            show: false,
            onClickFunction: (event) => {
                const node = event.target;
                const nodeData = node.data();
                if (nodeData.unknown) {
                    const message = {
                        type: 'discoverNode',
                        data: nodeData,
                    };
                    vscode.postMessage(message, '*');
                }
            },
        },
    ],
};

// Function to initialize and render the graph using Cytoscape
function renderGraph(graphData) {
    cy = cytoscape({
        container: document.getElementById('cy'),
        elements: [...graphData.nodes, ...graphData.edges],
        style: [
            {
                selector: 'node',
                style: {
                    label: 'data(label)',
                    'text-valign': 'center',
                    'background-color': 'data(color)',
                    color: '#fff',
                    'border-width': 0,
                    shape: 'data(shape)',
                },
            },
            {
                selector: 'edge',
                style: {
                    width: 'data(width)',
                    'line-fill': 'linear-gradient',
                    'line-gradient-stop-colors': 'data(color)',
                    'curve-style': 'bezier',
                    'source-arrow-shape': 'data(sourceArrowShape)',
                    'source-arrow-color': 'data(color)',
                    'source-arrow-fill': 'filled',
                    'target-arrow-shape': 'data(targetArrowShape)',
                    'target-arrow-color': 'data(color)',
                    'target-arrow-fill': 'filled',
                },
            },
            {
                selector: '.faded',
                style: {
                    opacity: 0.25,
                    'transition-property': 'opacity',
                    'transition-duration': '0.5s',
                },
            },
            {
                selector: 'node:selected',
                style: {
                    'border-color': '#FFD700',
                    'border-width': 4,
                },
            },
        ],
        layout: cylayout,
        zoom: 10,
        wheelSensitivity: 0.25,
    });

    cyContextMenuInstance = cy.contextMenus(contextMenusOptions);

    function resetNodesAndEdges(resetOpacity = true) {
        if (resetOpacity) {
            cy.elements().style('opacity', 1);
        }
        cy.nodes().style('border-width', null);
        cy.edges().style('line-gradient-stop-colors', null);
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
            },
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
            opacity: 0.9,
            'border-width': 4,
            'border-color': '#00FF00',
        });
        inboundEdges.forEach((edge) => {
            if (edge.data('type') === 'inheritance') {
                edge.style({
                    opacity: 0.9,
                    'line-gradient-stop-colors': 'red',
                });
                edge.source().style({
                    'border-color': 'red',
                    'border-width': 4,
                });
            } else {
                edge.style({
                    opacity: 0.9,
                    'line-gradient-stop-colors': '#00FF00',
                });
            }
        });

        outboundNodes.style({
            opacity: 0.9,
            'border-width': 4,
            'border-color': 'yellow',
        });
        outboundEdges.forEach((edge) => {
            if (edge.data('type') === 'inheritance') {
                edge.style({
                    opacity: 0.9,
                    'line-gradient-stop-colors': 'orange',
                });
                edge.target().style({
                    'border-color': 'orange',
                    'border-width': 4,
                });
            } else {
                edge.style({
                    opacity: 0.9,
                    'line-gradient-stop-colors': 'yellow',
                });
            }
        });

        selectedNode.style('border-color', '#FFD700');
        selectedNode.style('border-width', 4);
    });

    cy.on('unselect', 'node', function () {
        resetNodesAndEdges();
    });

    cy.on('zoom', function () {
        const zoom = cy.zoom();
        const newEdgeWidth = Math.max(2, 1.2 * zoom);
        cy.edges().style('width', newEdgeWidth);
    });

    cy.on('cxttap', 'node', function (event) {
        const unknown = event.target.data('unknown');
        if (unknown) {
            cyContextMenuInstance.showMenuItem('discoverNode');
        } else {
            cyContextMenuInstance.hideMenuItem('discoverNode');
        }
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
            cy.nodes()
                .filter((node) => {
                    return node.data('label').toLowerCase().includes(query);
                })
                .style('opacity', 1);
            // Optionally, you can also restore opacity for edges connected to matching nodes:
            cy.edges()
                .filter((edge) => {
                    const src = edge.source().data('label').toLowerCase();
                    const tgt = edge.target().data('label').toLowerCase();
                    return src.includes(query) || tgt.includes(query);
                })
                .style('opacity', 1);
        }
    }

    function reshuffle() {
        cy.layout(cylayout).run();
    }

    function refresh() {
        vscode.postMessage({ type: 'refresh' });
    }

    // Setup search functionality:
    document.getElementById('search').addEventListener('input', searchNode);
    document.getElementById('search-button').addEventListener('click', searchNode);
    document.getElementById('reshuffle-button').addEventListener('click', reshuffle);
    document.getElementById('refresh-button').addEventListener('click', refresh);
}
