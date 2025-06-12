import * as vscode from 'vscode';
import Log from '@common/utils/logger';
import { getNodeGraphConfig } from '@common/utils/configutils';

import { MockMythicNode, MythicNode, MythicNodeHandler } from './MythicNode';
import { extendedRegistryKey, registryKey } from '../objectInfos';
import { ctx } from '../../MythicScribe';

let openWebView: vscode.WebviewPanel | undefined = undefined;
const webViewDisposables: vscode.Disposable[] = [];

function disposeWebView() {
    if (openWebView) {
        openWebView.dispose();
        openWebView = undefined;
        webViewDisposables.forEach((disposable) => {
            disposable.dispose();
        });
        webViewDisposables.length = 0;
    }
}
function createWebView() {
    disposeWebView();
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
    openWebView.onDidDispose(
        () => {
            disposeWebView();
        },
        null,
        webViewDisposables
    );
}

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

interface NodeAdditionalData extends Partial<NodeCompulsoryData> {
    shape?: Shape;
    unknown?: boolean;
    image?: extendedRegistryKey;
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
    item: { shape: 'bottom-round-rectangle', color: '#00cc00', image: 'item' },
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
    reagent: { shape: 'round-heptagon', color: '#cc00cc', image: 'reagent' },
    menu: { shape: 'cut-rectangle', color: '#8fce00', image: 'menu' },
    achievement: { shape: 'star', color: '#ffd966', image: 'achievement' },
};

const NodeSpecialTypeToAdditionalData: Partial<
    Record<registryKey, (node: MythicNode) => NodeAdditionalData | undefined>
> = {
    item: (node: MythicNode) => {
        switch (node.getTemplatedMetadata<string>('type')) {
            case 'furniture':
                return { image: 'furniture' };
            case 'block':
                return { image: 'block' };
        }
        return undefined;
    },
    metaskill: (node: MythicNode) => {
        if (node.metadata.get('spell') === true) {
            return { image: 'spell' };
        }
        return undefined;
    },
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
    data: NodeData & {
        id: string;
        label: string;
        registry: registryKey;
    };
}

interface CytoscapeEdge {
    data: Partial<EdgeAdditionalData> & {
        id: string;
        source: string;
        target: string;
    };
}

enum selectedElementsType {
    all,
    openDocuments,
    selectedDocument,
    blank,
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
            { label: 'Blank Graph', value: selectedElementsType.blank },
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
        case selectedElementsType.blank:
            return [];
    }
    return openUris;
}

type CyNodesMap = Record<'found' | 'unknown' | 'outOfScope', Map<string, MythicNode>>;

function buildCytoscapeElements(
    selectedElements: selectedElementsType = selectedElementsType.all,
    selectedFilters: registryKey[] = [],
    startingNodes?: MythicNode[]
): {
    nodes: CytoscapeNode[];
    edges: CytoscapeEdge[];
} {
    if (selectedElements === selectedElementsType.blank) {
        return {
            nodes: [],
            edges: [],
        };
    }

    const openUris: string[] = [];
    let iterableKeys = Array.from(registryKey);
    const cyNodesMap: CyNodesMap = {
        found: new Map<string, MythicNode>(),
        unknown: new Map<string, MythicNode>(),
        outOfScope: new Map<string, MythicNode>(),
    };
    const cyNodes: CytoscapeNode[] = [];
    const cyEdges: CytoscapeEdge[] = [];

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

    buildCytoscapeElements_CollectElements(iterableKeys, iterableNodes, cyNodesMap, cyEdges);

    cycleNodes(cyNodes, cyNodesMap.found, cyNodesMap.unknown, { unknown: false });
    cycleNodes(cyNodes, cyNodesMap.unknown, cyNodesMap.outOfScope, UnknownNodeData);
    cycleNodes(cyNodes, cyNodesMap.outOfScope, new Map(), outOfScopeNodeData);

    return { nodes: cyNodes, edges: cyEdges };
}

/**
 * Populates Cytoscape node and edge collections based on the provided MythicNode data.
 *
 * Iterates over the given nodes and their relationships, updating the `cyNodesMap` with found,
 * unknown, and out-of-scope nodes, and appending corresponding edges to the `cyEdges` array.
 * Handles both template inheritance and subtype associations for each node.
 *
 * @param iterableKeys - An array of registry keys representing possible subtypes for association edges.
 * @param iterableNodes - An array of MythicNode instances to process and add to the Cytoscape graph.
 * @param cyNodesMap - A map object categorizing nodes as found, unknown, or out-of-scope.
 * @param cyEdges - An array to which new CytoscapeEdge objects will be appended, representing relationships.
 */
function buildCytoscapeElements_CollectElements(
    iterableKeys: registryKey[],
    iterableNodes: MythicNode[],
    cyNodesMap: CyNodesMap,
    cyEdges: CytoscapeEdge[]
) {
    for (const node of iterableNodes) {
        cyNodesMap.found.set(node.hash, node);

        const templateProvider = MythicNodeHandler.registry[node.registry.type];
        for (const [template] of node.templates) {
            let templateNode = templateProvider.getNode(template);
            if (templateNode) {
                cyNodesMap.unknown.set(templateNode.hash, templateNode);
            } else {
                templateNode = new MockMythicNode(node.registry, template, node);
                cyNodesMap.outOfScope.set(templateNode.hash, templateNode);
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
            if (!node.outEdge[subtype]) {
                continue;
            }
            for (const [selectedOutEdge] of node.outEdge[subtype]) {
                const edgeNode = MythicNodeHandler.registry[subtype].getNode(selectedOutEdge);
                if (!edgeNode) {
                    continue;
                }
                cyNodesMap.unknown.set(edgeNode.hash, edgeNode);
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

/**
 * Iterates over the nodes in the `source` map, removes each node from the `deprecationTarget` map,
 * and adds a corresponding Cytoscape node object to the `cyNodes` array.
 *
 * Each Cytoscape node object is constructed with data properties including:
 * - `id`: The unique identifier for the node, generated by `getIdName(node)`.
 * - `label`: The display name of the node.
 * - `registry`: The type of the node's registry.
 * - Additional properties from `NodeTypeToAdditionalData` and, if available,
 *   from `NodeSpecialTypeToAdditionalData` based on the node's registry type.
 * - Any extra properties provided in the `data` parameter.
 *
 * @param cyNodes - The array to which new Cytoscape node objects will be pushed.
 * @param source - A map of node identifiers to `MythicNode` objects to process.
 * @param deprecationTarget - A map from which processed node identifiers will be removed.
 * @param data - Additional data to merge into each Cytoscape node's data object.
 */
function cycleNodes(
    cyNodes: CytoscapeNode[],
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
                ...NodeTypeToAdditionalData[node.registry.type],
                ...NodeSpecialTypeToAdditionalData[node.registry.type]?.(node),
                ...data,
            },
        });
    });
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
            return selected
                .map((selected) => {
                    const selectedOption = GraphOptions.filters.options.find(
                        (option) => option.label === selected
                    );
                    if (!selectedOption) {
                        return undefined;
                    }
                    return selectedOption.value;
                })
                .filter((value) => value !== undefined);
        });

    createWebView();

    openWebView!.webview.html = getWebviewContent();

    const data = buildCytoscapeElements(selectedElements, selectedFilters);
    openWebView!.webview.postMessage({ type: 'graphData', data: data });
    processMessage(selectedElements, selectedFilters);
}

function processMessage(
    selectedElements: selectedElementsType | undefined,
    selectedFilters: registryKey[] | undefined
) {
    openWebView!.webview.onDidReceiveMessage(
        (message) => {
            switch (message.type) {
                case 'goToNode':
                    const node = MythicNodeHandler.registry[
                        message.data.registry as registryKey
                    ].getNode(message.data.label as string);
                    if (!node) {
                        return;
                    }
                    vscode.window.showTextDocument(node.document, {
                        selection: new vscode.Range(node.name.range.start, node.name.range.start),
                    });
                    break;
                case 'goToEdge':
                    function getData(type: 'source' | 'target') {
                        const data = (message.data[type] as string).split('_');
                        const registry = data.shift() as registryKey;
                        const name = data.join('_');
                        return {
                            registry,
                            name,
                        };
                    }
                    const type = message.data.type as EdgeType;
                    const source = getData('source');
                    const target = getData('target');

                    if (type === 'inheritance') {
                        const sourceNode = MythicNodeHandler.registry[source.registry].getNode(
                            source.name
                        );
                        if (!sourceNode) {
                            return;
                        }
                        const edge = sourceNode.templates.get(target.name);
                        if (edge) {
                            vscode.window.showTextDocument(sourceNode.document, {
                                selection: Array.isArray(edge) ? edge[0] : edge,
                            });
                            return;
                        }
                        return;
                    }

                    const targetNode = MythicNodeHandler.registry[target.registry].getNode(
                        target.name
                    );
                    if (!targetNode) {
                        return;
                    }
                    const edge = targetNode.outEdge[source.registry]?.get(source.name);
                    if (edge) {
                        vscode.window.showTextDocument(targetNode.document, {
                            selection: Array.isArray(edge) ? edge[0] : edge,
                        });
                    }
                    break;
                case 'discoverNode':
                    const newNode = MythicNodeHandler.registry[
                        message.data.registry as registryKey
                    ].getNode(message.data.label as string);
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
                    openWebView!.webview.postMessage({
                        type: 'refreshedData',
                        data: refreshedData,
                    });
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
        },
        undefined,
        webViewDisposables
    );
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

    const imageUriMap: Record<extendedRegistryKey, vscode.Uri> = extendedRegistryKey.reduce(
        (acc, key) => {
            acc[key] = processWebViewImageUri(openWebView!, `${key}.svg`);
            return acc;
        },
        {} as Record<extendedRegistryKey, vscode.Uri>
    );
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
    
    ${extendedRegistryKey
        .map(
            (key) => `
        <input type="hidden" id="${key}SvgUri" value="${imageUriMap[key]}">`
        )
        .join('\n')}
    <input type="hidden" id="wheelSensitivity" value="${getNodeGraphConfig('wheelSensitivity') || 2}">

    <script src="${scriptUri}"></script>
</body>
</html>
`;
}
