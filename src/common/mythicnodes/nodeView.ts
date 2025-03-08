import * as vscode from 'vscode';

import { MythicNode, MythicNodeHandler, MythicNodeHandlerRegistry } from './MythicNode';
import { ctx } from '../../MythicScribe';

let openWebView: vscode.WebviewPanel | undefined = undefined;

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
    unknown?: boolean;
};
type EdgeAdditionalData = {
    color: string;
    width: number;
    sourceArrowShape: string;
    targetArrowShape: string;
    type: EdgeType;
};

const NodeTypeToAdditionalData: Record<keyof MythicNodeHandlerRegistry, NodeAdditionalData> = {
    mobs: { shape: 'rectangle', color: '#007acc' },
    items: { shape: 'triangle', color: '#00cc00' },
    metaskills: { shape: 'ellipse', color: '#ffcc00' },
    droptables: { shape: 'diamond', color: '#cc00cc' },
    stats: { shape: 'barrel', color: '#cc0000' },
};

const UnknownNodeData: NodeAdditionalData = { color: '#807e7a', unknown: true };

const EdgeTypeToAdditionalData: Record<EdgeType, EdgeAdditionalData> = {
    inheritance: {
        color: 'orange red',
        width: 6,
        sourceArrowShape: 'triangle-tee',
        targetArrowShape: 'tee',
        type: 'inheritance',
    },
    association: {
        color: '#ccc white',
        width: 3,
        sourceArrowShape: 'triangle',
        targetArrowShape: 'none',
        type: 'association',
    },
};

interface CytoscapeNode {
    data: {
        id: string;
        label?: string;
        shape?: Shape;
        registry: keyof MythicNodeHandlerRegistry;
        nodeName: string;
        unknown?: boolean;
    };
}

interface CytoscapeEdge {
    data: { id: string; source: string; target: string };
}

enum selectedElementsType {
    all,
    openDocuments,
    selectedDocument,
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
            { label: 'Selected Document', value: selectedElementsType.selectedDocument },
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

const PastFilters: selectedElementsFilter[] = [];
function buildCytoscapeElements(
    selectedElements: selectedElementsType = selectedElementsType.all,
    selectedFilters: selectedElementsFilter[] = [],
    startingNodes?: MythicNode[]
): {
    nodes: CytoscapeNode[];
    edges: CytoscapeEdge[];
} {
    const openUris: string[] = [];
    let iterableKeys = Object.keys(
        MythicNodeHandler.registry
    ) as (keyof MythicNodeHandlerRegistry)[];
    const cyNodesFoundNodes: Map<string, MythicNode> = new Map();
    const cyNodesUnknownNodes: Map<string, MythicNode> = new Map();
    const cyNodes: CytoscapeNode[] = [];
    const cyEdges: CytoscapeEdge[] = [];

    PastFilters.length = 0;
    PastFilters.push(...selectedFilters);
    if (selectedFilters.length > 0) {
        iterableKeys = iterableKeys.filter(
            (key) => !selectedFilters.includes(selectedElementsFilter[key])
        );
    }

    switch (selectedElements) {
        case selectedElementsType.selectedDocument:
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                return { nodes: [], edges: [] };
            }
            const activeDocument = activeEditor.document;
            const activeDocumentUri = activeDocument.uri.toString();
            openUris.push(activeDocumentUri);
            break;
        case selectedElementsType.openDocuments:
            vscode.window.tabGroups.all.forEach((group) => {
                group.tabs.forEach((tab) => {
                    if (tab.input instanceof vscode.TabInputText) {
                        const uri = tab.input.uri;
                        openUris.push(uri.toString());
                    }
                });
            });
            break;
    }

    let iterableNodes = startingNodes || [];
    if (!startingNodes) {
        for (const type of iterableKeys) {
            const nodes = MythicNodeHandler.registry[type].getNodeValues();
            iterableNodes.push(...nodes);
        }
    }
    if (selectedElements !== selectedElementsType.all) {
        iterableNodes = iterableNodes.filter((node) =>
            openUris.includes(node.document.uri.toString())
        );
    }

    for (const node of iterableNodes) {
        cyNodesFoundNodes.set(node.hash, node);

        const templateProvider = MythicNodeHandler.registry[node.registry.type];
        for (const template of node.templates) {
            const templateNode = templateProvider.getNode(template);
            if (!templateNode) {
                continue;
            }
            cyNodesUnknownNodes.set(templateNode.hash, templateNode);
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
            for (const selectedOutEdge of node.outEdge[subtype]) {
                const edgeNode = MythicNodeHandler.registry[subtype].getNode(selectedOutEdge);
                if (!edgeNode) {
                    continue;
                }
                cyNodesUnknownNodes.set(edgeNode.hash, edgeNode);
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

    cyNodesFoundNodes.forEach((node, identifier) => {
        cyNodesUnknownNodes.delete(identifier);
        cyNodes.push({
            data: {
                id: getIdName(node),
                label: node.name.text,
                registry: node.registry.type,
                nodeName: node.name.text,
                ...NodeTypeToAdditionalData[node.registry.type],
                unknown: false,
            },
        });
    });
    cyNodesUnknownNodes.forEach((node) => {
        cyNodes.push({
            data: {
                id: getIdName(node),
                label: node.name.text,
                registry: node.registry.type,
                nodeName: node.name.text,
                ...NodeTypeToAdditionalData[node.registry.type],
                ...UnknownNodeData,
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

    if (openWebView) {
        openWebView.dispose();
        openWebView = undefined;
    }

    openWebView = vscode.window.createWebviewPanel(
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
    openWebView.webview.html = getWebviewContent();

    const data = buildCytoscapeElements(selectedElements, selectedFilters);
    openWebView.webview.postMessage({ type: 'graphData', data: data });

    openWebView.webview.onDidReceiveMessage((message) => {
        switch (message.type) {
            case 'goToNode':
                const node = MythicNodeHandler.registry[
                    message.data.registry as keyof MythicNodeHandlerRegistry
                ].getNode(message.data.nodeName as string);
                if (!node) {
                    return;
                }
                vscode.window.showTextDocument(node.document, {
                    selection: new vscode.Range(node.name.range.start, node.name.range.start),
                });
                break;
            case 'discoverNode':
                const newNode = MythicNodeHandler.registry[
                    message.data.registry as keyof MythicNodeHandlerRegistry
                ].getNode(message.data.nodeName as string);
                if (!newNode) {
                    return;
                }
                const updatedData = buildCytoscapeElements(
                    selectedElementsType.all,
                    selectedFilters,
                    [newNode]
                );
                openWebView!.webview.postMessage({ type: 'addGraphData', data: updatedData });
                break;
            case 'refresh':
                const refreshedData = buildCytoscapeElements(selectedElements, selectedFilters);
                openWebView!.webview.postMessage({ type: 'refreshedData', data: refreshedData });
                break;
        }
    });
}

function getWebviewContent(): string {
    const scriptPathOnDisk = vscode.Uri.joinPath(
        ctx.extensionUri,
        'out',
        'webviews',
        'nodegraph.js'
    );
    const scriptUri = openWebView!.webview.asWebviewUri(scriptPathOnDisk);

    // Note: Added dagre and cytoscape-dagre script tags
    return /*html*/ `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <title>Inheritance Graph</title>
    <style>
        html,
        body,
        #cy {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
        }
        .context-menu {
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            font-family: 'Roboto', sans-serif;
            width: 150px;
            z-index: 10000;
            padding: 0;
            margin: 0;
        }

        .context-menu ul {
            list-style: none;
            margin: 0;
            padding: 0;
        }

        .context-menu-li {
            display: block;
            width: 100%;
            box-sizing: border-box;
            padding: 8px 12px;
            color: #252525;
            cursor: pointer;
            transition: background 0.2s ease;
            white-space: nowrap;
        }

        .context-menu-li:hover {
            background: #0056b3;
        }

        .context-menu-li.divider {
            border-bottom: 1px solid #eee;
            margin-bottom: 5px;
            padding-bottom: 5px;
        }

        .context-menu-li.disabled {
            color: #aaa;
            cursor: not-allowed;
        }

        .custom-context-menu-cls {
            width: 150px;
            font-family: 'Roboto', sans-serif;
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
        .search-input {
            border: none;
            padding: 10px 15px;
            outline: none;
            font-size: 1rem;
        }
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
        .separator {
          width: 1px;
          height: 30px;
          background-color: #ccc;
          margin: 0 5px;
        }
    </style>
</head>

<body>
    <div class="search-container">
        <input type="text" class="search-input" placeholder="Search..." id="search">
        <button class="search-button" id="search-button" title="Search for a node">🔎</button>
        <div class="separator"></div>
        <button class="search-button" id="reshuffle-button" title="Reshuffle the graph">🧩</button>
        <div class="separator"></div>
        <button class="search-button" id="refresh-button" title="Refresh the graph">🔄</button>
    </div>
    <div id="cy"></div>
    <script src="${scriptUri}"></script>
</body>
</html>
`;
}
