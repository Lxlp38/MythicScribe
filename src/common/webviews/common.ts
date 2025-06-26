import { showInfoMessageWithOptions } from '@common/providers/loggerProvider';
import * as vscode from 'vscode';

// const disposables: Record<string, vscode.Disposable[]> = {};
// let uuid = 0;

export function externalToolWarning(link: string): void {
    showInfoMessageWithOptions('External tools are disabled in the configuration.', {
        'Open Settings': {
            target: 'workbench.action.openSettings',
            action: 'MythicScribe.allowExternalTools',
            type: 'command',
        },
        'Open in Browser': {
            target: link,
            type: 'external',
        },
    });
    return;
}

export type LinkParameters = Record<string, string>;
export function openToolExternally(
    link: string,
    parameters: LinkParameters = {},
    anchorParameters: LinkParameters = {}
): void {
    parameters['utm_source'] = 'MythicScribe';
    parameters['utm_medium'] = 'referral';
    parameters['utm_campaign'] = 'tool_integration';
    const par = parameters
        ? '?' +
          Object.entries(parameters)
              .map(([parameter, arg]) => `${parameter}=${arg}`)
              .join('&')
        : '';
    const anchor = anchorParameters
        ? `#?${Object.entries(anchorParameters)
              .map(([parameter, arg]) => `${parameter}=${arg}`)
              .join('&')}`
        : '';
    const ret = vscode.Uri.parse(encodeURI(link + par + anchor));
    vscode.env.openExternal(ret);
}

// export function openToolInternally(name: string, link: string): void {
//     showInfoMessageWithOptions(
//         `Opening an External Tool: ${name}.\n\n\nExternal Tools are not handled by MythicScribe, but by third parties.`,
//         {
//             'Open in Browser': {
//                 target: link,
//                 type: 'external',
//             },
//         }
//     );
//     openExternalWebview(name, link);
//     return;
// }

// export function openExternalWebview(
//     name: string,
//     link: string,
//     addons: string[] = [],
//     iframeListener: string = '',
//     listener: (message: unknown) => void = () => {}
// ): void {
//     uuid += 1;
//     const uuidStr = uuid.toString();
//     if (disposables[uuidStr]) {
//         disposables[uuidStr].forEach((d) => d.dispose());
//         disposables[uuidStr] = [];
//     } else {
//         disposables[uuidStr] = [];
//     }

//     const panel = vscode.window.createWebviewPanel('webview', name, vscode.ViewColumn.One, {
//         enableScripts: true,
//         retainContextWhenHidden: true,
//         localResourceRoots: [],
//     });

//     panel.webview.html = getWebviewContent(name, link, addons, iframeListener);
//     panel.onDidDispose(() => {
//         disposables[uuidStr].forEach((d) => d.dispose());
//         delete disposables[uuidStr];
//     });
//     disposables[uuidStr].push(panel);
//     createMessageListener(uuidStr, panel, listener);
// }

// function createMessageListener(
//     uuid: string,
//     panel: vscode.WebviewPanel,
//     listener: (message: unknown) => void
// ): vscode.Disposable {
//     const disposable = panel.webview.onDidReceiveMessage(listener, null, disposables[uuid]);

//     return disposable;
// }

// function getWebviewContent(
//     name: string,
//     url: string,
//     addons: string[],
//     messageHandler: string
// ): string {
//     return /*html*/ `<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>${name}</title>
//     <style>
//         body, html {
//             margin: 0;
//             padding: 0;
//             width: 100%;
//             height: 100%;
//             overflow: hidden;
//         }
//         iframe {
//             border: none;
//             width: 100%;
//             height: 100%;
//         }
//     </style>
// </head>
// <body>
//     <iframe src="${url}"></iframe>
//     ${addons.join('\n')}
//     <script>
//         const vscode = acquireVsCodeApi();
//         window.addEventListener('message', (event) => {
//             const message = event.data;
//             ${messageHandler}
//         });
// </body>
// </html>`;
// }
