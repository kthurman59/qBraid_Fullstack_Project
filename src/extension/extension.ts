import * as vscode from 'vscode';
import * as path from 'path';
import { setApiKey } from '../settings';
import { handleUserInput } from '../chat';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('qBraid Extension');
    outputChannel.appendLine('qBraid Extension Activated');

    const disposable = vscode.commands.registerCommand('qbraid.setApiKey', setApiKey);

    const chatCommand = vscode.commands.registerCommand('qbraid.sendChatMessage', async () => {
        outputChannel.appendLine('qBraid Chat Command Triggered');

        const apiKey = vscode.workspace.getConfiguration('qbraid').get('apikey') as string;

        if (!apiKey) {
            vscode.window.showErrorMessage('API Key not set. Run "Set qBraid API Key" first.');
            return;
        }

        const isValid = await validateApiKey(apiKey);
        if (!isValid) {
            vscode.window.showErrorMessage('Invalid API Key. Please set a valid API Key.');
            return;
        }

        const panel = createChatWebview(context);
        outputChannel.appendLine('Webview Created');

        panel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.command === 'sendMessage') {
                    await handleUserInput(apiKey, message.text, panel.webview);
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable, chatCommand);

    const showOutputCommand = vscode.commands.registerCommand('qbraid.showOutput', () => {
        outputChannel.show();
    });

    context.subscriptions.push(showOutputCommand);

    outputChannel.appendLine('qBraid Extension activated.');
}

export function deactivate() {
    // Clean up resources if necessary
}

async function validateApiKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch('https://api.qbraid.com/chat/models', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

function createChatWebview(context: vscode.ExtensionContext): vscode.WebviewPanel {
    const panel = vscode.window.createWebviewPanel(
        'qbraidChat', // The webview identifier
        'qBraid Chat', // Title for the webview
        vscode.ViewColumn.One, // Open in the first column
        {
            enableScripts: true, // Enable JavaScript execution in the webview
            retainContextWhenHidden: true, // Retain the state when hidden
        }
    );

    // Get the path to the styles.css file and convert it to a webview-compatible URI
    const stylesPath = vscode.Uri.file(
        path.join(context.extensionPath, 'src', 'webview', 'styles.css')
    );
    const stylesUri = panel.webview.asWebviewUri(stylesPath);

    // Set the HTML content for the webview
    panel.webview.html = getWebviewContent(stylesUri);

    // Send initial message (optional)
    panel.webview.postMessage({ command: 'init', text: 'Hello from VSCode!' });

    return panel;
}

function getWebviewContent(stylesUri: vscode.Uri): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="${stylesUri}">
            <title>qBraid Chat</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 10px; }
                #chat { border: 1px solid #ccc; padding: 10px; height: 300px; overflow-y: auto; }
                #typingIndicator { font-style: italic; color: gray; display: none; }
                #input { width: 80%; padding: 5px; }
                #send { padding: 5px; }
            </style>
        </head>
        <body>
            <h1>qBraid Chat</h1>
            <div id="chat"></div>
            <p id="typingIndicator">qBraid is typing...</p>
            <input id="input" type="text" placeholder="Type your message here..." />
            <button id="send">Send</button>
            <script>
                const vscode = acquireVsCodeApi();
                const chat = document.getElementById('chat');
                const input = document.getElementById('input');
                const send = document.getElementById('send');
                const typingIndicator = document.getElementById('typingIndicator');

                send.addEventListener('click', () => {
                    const message = input.value;
                    if (message) {
                        chat.innerHTML += \`<div><strong>You:</strong> \${message}</div>\`;
                        input.value = '';
                        vscode.postMessage({ command: 'sendMessage', text: message });
                    }
                });

                window.addEventListener('message', event => {
                    const message = event.data;

                    if (message.command === 'receiveMessage') {
                        typingIndicator.style.display = 'none';
                        chat.innerHTML += \`<div><strong>qBraid:</strong> \${message.text}</div>\`;
                    }

                    if (message.command === 'init') {
                        chat.innerHTML += \`<div><strong>System:</strong> \${message.text}</div>\`;
                    }
                });
            </script>
        </body>
        </html>
    `;
}

