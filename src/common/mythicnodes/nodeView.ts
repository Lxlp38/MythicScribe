import * as vscode from 'vscode';
import Log from '@common/utils/logger';

import { MockMythicNode, MythicNode, MythicNodeHandler } from './MythicNode';
import { registryKey } from '../objectInfos';
import { ctx } from '../../MythicScribe';

let openWebView: vscode.WebviewPanel | undefined = undefined;

const Shape = [
    'ellipse',
    'triangle',
    'round-triangle',
    'rectangle',
    'round-rectangle',
    'bottom-round-rectangle',
    'cut-rectangle',
    'barrel',
    'rhomboid',
    'right-rhomboid',
    'diamond',
    'round-diamond',
    'pentagon',
    'round-pentagon',
    'hexagon',
    'round-hexagon',
    'concave-hexagon',
    'heptagon',
    'round-heptagon',
    'octagon',
    'round-octagon',
    'star',
    'tag',
    'round-tag',
    'vee',
    'polygon',
] as const;

type Shape = (typeof Shape)[number];

type EdgeType = 'inheritance' | 'association';

interface NodeCompulsoryData {
    color: string;
}
interface NodeAdditionalData {
    shape?: Shape;
    color?: string;
    unknown?: boolean;
    image?: string;
}

type NodeData = NodeCompulsoryData & NodeAdditionalData;

type EdgeAdditionalData = {
    lineColors: string;
    sourceColor: string;
    targetColor: string;
    width: number;
    sourceArrowShape: string;
    targetArrowShape: string;
    type: EdgeType;
    opacity: number;
};

const NodeTypeToAdditionalData: Record<registryKey, NodeData> = {
    mob: {
        shape: 'rectangle',
        color: '#007acc',
        image: 'mob',
    },
    item: { shape: 'triangle', color: '#00cc00', image: 'item' },
    metaskill: { shape: 'ellipse', color: '#ffcc00', image: 'metaskill' },
    droptable: { shape: 'diamond', color: '#15c867', image: 'droptable' },
    stat: { shape: 'barrel', color: '#cc0000', image: 'stat' },
    pin: { shape: 'round-hexagon', color: '#d59b87', image: 'pin' },
    placeholder: { shape: 'rhomboid', color: '#cc6600', image: 'placeholder' },
    randomspawn: { shape: 'round-tag', color: '#00cccc', image: 'randomspawn' },
    archetype: {
        shape: 'concave-hexagon',
        color: '#0b5394',
        image: 'archetype',
    },
    reagent: { shape: 'vee', color: '#cc00cc', image: 'reagent' },
    menu: { shape: 'cut-rectangle', color: '#8fce00', image: 'menu' },
    achievement: { shape: 'star', color: '#ffd966', image: 'achievement' },
};

const UnknownNodeData: NodeData = { color: '#807e7a', unknown: true };
const outOfScopeNodeData: NodeData = { color: '#000000', unknown: false };

const EdgeTypeToAdditionalData: Record<EdgeType, EdgeAdditionalData> = {
    inheritance: {
        lineColors: 'green red',
        sourceColor: 'green',
        targetColor: 'red',
        width: 6,
        sourceArrowShape: 'triangle-tee',
        targetArrowShape: 'tee',
        type: 'inheritance',
        opacity: 0.85,
    },
    association: {
        lineColors: 'blue orange',
        sourceColor: 'blue',
        targetColor: 'orange',
        width: 3,
        sourceArrowShape: 'triangle',
        targetArrowShape: 'none',
        type: 'association',
        opacity: 0.65,
    },
};

interface CytoscapeNode {
    data: {
        id: string;
        label?: string;
        shape?: Shape;
        registry: registryKey;
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

const GraphOptionsFilters = Object.entries(NodeTypeToAdditionalData).map(([key]) => ({
    label: `Hide ${key.charAt(0).toUpperCase() + key.slice(1)}`,
    value: key as registryKey,
}));

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
        options: GraphOptionsFilters,
    },
};

function getIdName(id: registryKey | MythicNode, name?: string): string {
    if (typeof id === 'string') {
        return `${id}_${name}`;
    }
    return `${id.registry.type}_${id.name.text}`;
}

function fetchSelectedElements(selectedElements: selectedElementsType) {
    const openUris: string[] = [];
    switch (selectedElements) {
        case selectedElementsType.selectedDocument:
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                return [];
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
    return openUris;
}

const PastFilters: registryKey[] = [];
function buildCytoscapeElements(
    selectedElements: selectedElementsType = selectedElementsType.all,
    selectedFilters: registryKey[] = [],
    startingNodes?: MythicNode[]
): {
    nodes: CytoscapeNode[];
    edges: CytoscapeEdge[];
} {
    const openUris: string[] = [];
    let iterableKeys = Array.from(registryKey);
    const cyNodesFoundNodes: Map<string, MythicNode> = new Map();
    const cyNodesUnknownNodes: Map<string, MythicNode> = new Map();
    const cyNodesOutOfScopeNodes: Map<string, MythicNode> = new Map();
    const cyNodes: CytoscapeNode[] = [];
    const cyEdges: CytoscapeEdge[] = [];

    PastFilters.length = 0;
    PastFilters.push(...selectedFilters);
    if (selectedFilters.length > 0) {
        iterableKeys = iterableKeys.filter((key) => !selectedFilters.includes(key));
    }

    let iterableNodes = startingNodes || [];
    if (!startingNodes) {
        for (const type of iterableKeys) {
            const nodes = MythicNodeHandler.registry[type].getNodeValues();
            iterableNodes.push(...nodes);
        }
    }

    if (selectedElements !== selectedElementsType.all) {
        openUris.push(...fetchSelectedElements(selectedElements));
        if (openUris.length === 0) {
            return {
                nodes: [],
                edges: [],
            };
        }
        iterableNodes = iterableNodes.filter((node) =>
            openUris.includes(node.document.uri.toString())
        );
    }

    for (const node of iterableNodes) {
        cyNodesFoundNodes.set(node.hash, node);

        const templateProvider = MythicNodeHandler.registry[node.registry.type];
        for (const template of node.templates) {
            let templateNode = templateProvider.getNode(template);
            if (templateNode) {
                cyNodesUnknownNodes.set(templateNode.hash, templateNode);
            } else {
                templateNode = new MockMythicNode(node.registry, template, node);
                cyNodesOutOfScopeNodes.set(templateNode.hash, templateNode);
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

    /**
     * Cycles through nodes in the source map, transferring their data to a target array
     * while removing corresponding entries from the deprecation target map.
     *
     * @param source - A map containing MythicNode objects, keyed by their identifiers.
     * @param deprecationTarget - A map from which nodes with matching identifiers will be removed.
     * @param data - Additional data to be merged into each node's data during processing.
     */
    function cycleNodes(
        source: Map<string, MythicNode>,
        deprecationTarget: Map<string, MythicNode>,
        data: NodeAdditionalData
    ) {
        source.forEach((node, identifier) => {
            deprecationTarget.delete(identifier);
            cyNodes.push({
                data: {
                    id: getIdName(node),
                    label: node.name.text,
                    registry: node.registry.type,
                    nodeName: node.name.text,
                    ...NodeTypeToAdditionalData[node.registry.type],
                    ...data,
                },
            });
        });
    }
    cycleNodes(cyNodesFoundNodes, cyNodesUnknownNodes, { unknown: false });
    cycleNodes(cyNodesUnknownNodes, cyNodesOutOfScopeNodes, UnknownNodeData);
    cycleNodes(cyNodesOutOfScopeNodes, new Map(), outOfScopeNodeData);

    return { nodes: cyNodes, edges: cyEdges };
}

export async function showNodeGraph(): Promise<void> {
    const cancellationToken = new vscode.CancellationTokenSource();
    const selectedElements = await vscode.window
        .showQuickPick(
            GraphOptions.selectedElements.options.map((option) => option.label),
            { title: GraphOptions.selectedElements.query },
            cancellationToken.token
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
    if (cancellationToken.token.isCancellationRequested) {
        return;
    }
    const selectedFilters = await vscode.window
        .showQuickPick(
            GraphOptions.filters.options.map((option) => option.label),
            { title: GraphOptions.filters.query, canPickMany: true },
            cancellationToken.token
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
    if (cancellationToken.token.isCancellationRequested) {
        return;
    }

    if (openWebView) {
        openWebView.dispose();
        openWebView = undefined;
    }

    openWebView = vscode.window.createWebviewPanel(
        'mythicNodeGraph', // Identifies the type of the webview. Used internally
        'Mythic Node Graph', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            enableFindWidget: true,
        }
    );

    openWebView.webview.html = getWebviewContent();

    const data = buildCytoscapeElements(selectedElements, selectedFilters);
    openWebView.webview.postMessage({ type: 'graphData', data: data });
    processMessage(selectedElements, selectedFilters);
}

function processMessage(
    selectedElements: selectedElementsType | undefined,
    selectedFilters: registryKey[] | undefined
) {
    openWebView!.webview.onDidReceiveMessage((message) => {
        switch (message.type) {
            case 'goToNode':
                const node = MythicNodeHandler.registry[
                    message.data.registry as registryKey
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
                    message.data.registry as registryKey
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
            case 'export':
                const messageData = message.data;
                vscode.window
                    .showSaveDialog({ saveLabel: 'Export Graph', filters: { json: ['json'] } })
                    .then((uri) => {
                        if (!uri) {
                            return;
                        }
                        vscode.workspace.fs.writeFile(
                            uri,
                            Buffer.from(JSON.stringify(messageData, null, 2))
                        );
                        return;
                    });
                break;
            case 'import':
                vscode.window
                    .showOpenDialog({ canSelectMany: false, openLabel: 'Import Graph' })
                    .then(async (uri) => {
                        if (!uri) {
                            return;
                        }
                        const file = await vscode.workspace.fs.readFile(uri[0]);
                        openWebView!.webview.postMessage({
                            type: 'importedData',
                            data: JSON.parse(file.toString()),
                        });
                        return;
                    });
                break;
        }
    });
}

function processWebViewImageUri(webviewPanel: vscode.WebviewPanel, target: string) {
    const imagePathOnDisk = vscode.Uri.joinPath(ctx.extensionUri, 'assets', 'nodegraph', target);
    return webviewPanel.webview.asWebviewUri(imagePathOnDisk);
}

function getWebviewContent(): string {
    if (!openWebView) {
        Log.error('Webview is not declared! Something has gone very wrong!');
        return '';
    }
    const scriptPathOnDisk = vscode.Uri.joinPath(
        ctx.extensionUri,
        'out',
        'webviews',
        'nodegraph.js'
    );
    const scriptUri = openWebView.webview.asWebviewUri(scriptPathOnDisk);

    const imageUriMap: Record<registryKey, vscode.Uri> = {
        mob: processWebViewImageUri(openWebView, 'mob.svg'),
        metaskill: processWebViewImageUri(openWebView, 'metaskill.svg'),
        item: processWebViewImageUri(openWebView, 'item.svg'),
        droptable: processWebViewImageUri(openWebView, 'droptable.svg'),
        placeholder: processWebViewImageUri(openWebView, 'placeholder.svg'),
        randomspawn: processWebViewImageUri(openWebView, 'randomspawn.svg'),
        stat: processWebViewImageUri(openWebView, 'stat.svg'),
        pin: processWebViewImageUri(openWebView, 'pin.svg'),
        archetype: processWebViewImageUri(openWebView, 'archetype.svg'),
        reagent: processWebViewImageUri(openWebView, 'reagent.svg'),
        menu: processWebViewImageUri(openWebView, 'menu.svg'),
        achievement: processWebViewImageUri(openWebView, 'achievement.svg'),
    };

    // Note: Added dagre and cytoscape-dagre script tags
    return /*html*/ `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <title>Mythic Node Graph</title>
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
            background-color: #ffda8f;
            color: white;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        .search-button:hover {
            background-color: #dd9c47;
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
        <button id="search-button" class="search-button" title="Search for a node">🔎</button>
        <div class="separator"></div>
        <button id="reshuffle-button" class="search-button" title="Reshuffle the graph">🧩</button>
        <div class="separator"></div>
        <button id="export-button" class="search-button" title="Export the graph">⏬</button>
        <div class="separator"></div>
        <button id="import-button" class="search-button" title="Import a graph">⏫</button>
        <div class="separator"></div>
        <button id="refresh-button" class="search-button" title="Refresh the graph">🔄</button>
    </div>
    <div id="cy"></div>
    

    <input type="hidden" id="mobSvgUri" value="${imageUriMap.mob}">
    <input type="hidden" id="metaskillSvgUri" value="${imageUriMap.metaskill}">
    <input type="hidden" id="itemSvgUri" value="${imageUriMap.item}">
    <input type="hidden" id="droptableSvgUri" value="${imageUriMap.droptable}">
    <input type="hidden" id="placeholderSvgUri" value="${imageUriMap.placeholder}">
    <input type="hidden" id="randomspawnSvgUri" value="${imageUriMap.randomspawn}">
    <input type="hidden" id="statSvgUri" value="${imageUriMap.stat}">
    <input type="hidden" id="pinSvgUri" value="${imageUriMap.pin}">
    <input type="hidden" id="archetypeSvgUri" value="${imageUriMap.archetype}">
    <input type="hidden" id="reagentSvgUri" value="${imageUriMap.reagent}">
    <input type="hidden" id="menuSvgUri" value="${imageUriMap.menu}">
    <input type="hidden" id="achievementSvgUri" value="${imageUriMap.achievement}">
    <script src="${scriptUri}"></script>
</body>
</html>
`;
}
