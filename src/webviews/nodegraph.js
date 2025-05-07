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
    } else if (message.type === 'importedData') {
        cy.json(message.data);
        cy.fit();
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
                    'font-size': function (ele) {
                        return 20 + ele.degree() * 2;
                    },
                    'text-valign': 'bottom',
                    'background-color': 'data(color)',
                    color: '#fff',
                    'border-width': 0,
                    shape: 'data(shape)',
                    'shape-polygon-points': function (ele) {
                        return ele.data('shapePolygonPoints') || 'none';
                    },
                    'text-outline-color': '#000000',
                    'text-outline-width': function (ele) {
                        return 2 + ele.degree() / 10;
                    },
                    width: function (ele) {
                        return 30 + ele.degree() * 2;
                    },
                    height: function (ele) {
                        return 30 + ele.degree() * 2;
                    },
                },
            },
            {
                selector: 'edge',
                style: {
                    width: 'data(width)',
                    'line-fill': 'linear-gradient',
                    'line-gradient-stop-colors': 'data(lineColors)',
                    'curve-style': 'bezier',
                    'source-arrow-shape': 'data(sourceArrowShape)',
                    'source-arrow-color': 'data(sourceColor)',
                    'source-arrow-fill': 'filled',
                    'target-arrow-shape': 'data(targetArrowShape)',
                    'target-arrow-color': 'data(targetColor)',
                    'target-arrow-fill': 'filled',
                    opacity: 'data(opacity)',
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
                    'border-width': '20%',
                },
            },
        ],
        layout: cylayout,
        zoom: 10,
        wheelSensitivity: 0.25,
    });

    cyContextMenuInstance = cy.contextMenus(contextMenusOptions);

    function resetNodesAndEdges(opacity = null) {
        cy.batch(() => {
            cy.elements().style('opacity', opacity);
            cy.nodes().style('border-width', null);
            cy.edges().style('line-gradient-stop-colors', null);
        });
    }

    cy.on('select', 'node', function (evt) {
        let selectedNode = evt.target;

        resetNodesAndEdges(0.25);

        const inboundNodes = selectedNode.incomers('node');
        const inboundEdges = selectedNode.incomers('edge');

        const outboundNodes = selectedNode.outgoers('node');
        const outboundEdges = selectedNode.outgoers('edge');

        cy.batch(() => {
            inboundNodes.style({
                opacity: 0.9,
                'border-width': 4,
                'border-color': 'orange',
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
                        'line-gradient-stop-colors': 'orange',
                    });
                }
            });

            outboundNodes.style({
                opacity: 0.9,
                'border-width': 4,
                'border-color': 'blue',
            });
            outboundEdges.forEach((edge) => {
                if (edge.data('type') === 'inheritance') {
                    edge.style({
                        opacity: 0.9,
                        'line-gradient-stop-colors': 'green',
                    });
                    edge.target().style({
                        'border-color': 'green',
                        'border-width': 4,
                    });
                } else {
                    edge.style({
                        opacity: 0.9,
                        'line-gradient-stop-colors': 'blue',
                    });
                }
            });

            selectedNode.style('border-color', '#FFD700');
            selectedNode.style('border-width', 4);
            selectedNode.style('opacity', 1);
        });
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
            cy.elements().style('opacity', null);
        } else {
            // Fade out all elements first.
            cy.elements().style('opacity', 0.25);
            // For nodes whose label includes the search query, restore full opacity.
            cy.nodes()
                .filter((node) => {
                    return node.data('label').toLowerCase().includes(query);
                })
                .style('opacity', null);
            // Optionally, you can also restore opacity for edges connected to matching nodes:
            cy.edges()
                .filter((edge) => {
                    const src = edge.source().data('label').toLowerCase();
                    const tgt = edge.target().data('label').toLowerCase();
                    return src.includes(query) || tgt.includes(query);
                })
                .style('opacity', null);
        }
    }

    function reshuffle() {
        cy.layout(cylayout).run();
    }

    function refresh() {
        vscode.postMessage({ type: 'refresh' });
    }

    function exportGraph() {
        let graphJson = cy.json();
        vscode.postMessage({ type: 'export', data: graphJson });
    }

    function importGraph() {
        vscode.postMessage({ type: 'import' });
    }

    // Setup search functionality:
    document.getElementById('search').addEventListener('input', searchNode);
    document.getElementById('search-button').addEventListener('click', searchNode);
    document.getElementById('reshuffle-button').addEventListener('click', reshuffle);
    document.getElementById('export-button').addEventListener('click', exportGraph);
    document.getElementById('import-button').addEventListener('click', importGraph);
    document.getElementById('refresh-button').addEventListener('click', refresh);
}
