import * as vscode from 'vscode';
import { setApiKey } from './settings';
import { sendChatMessage, handleUserInput } from './chat';

// Create an output channel for logging
const outputChannel = vscode.window.createOutputChannel('qBraid Extension');

// Function to create the webview chat interface
function createChatWebview(context: vscode.ExtensionContext): vscode.WebviewPanel {
    // Create the webview panel
    const panel = vscode.window.createWebviewPanel(
        'qbraidChat', // Unique identifier for the panel
        'qBraid Chat', // Title of the panel
        vscode.ViewColumn.One, // Open in the first editor column
        {
            enableScripts: true, // Enable JavaScript in the webview
            retainContextWhenHidden: true, // Retain state when the panel is hidden
        }
    );

    // Get the URI for the CSS file
    const stylesUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'src', 'webview', 'styles.css')
    );

    // Set the HTML content for the webview
    panel.webview.html = `
        <html>
            <head>
                <link rel="stylesheet" href="${stylesUri}">
            </head>
            <body>
                <h1>qBraid Chat</h1>
                <div id="chat"></div>
                <div id="typing-indicator" style="display: none; color: #0ea5e9; font-style: italic;">qBraid is typing...</div>
                <input id="input" type="text" placeholder="Type your message here..." />
                <button id="send">Send</button>
                <script>
                    const chat = document.getElementById('chat');
                    const input = document.getElementById('input');
                    const send = document.getElementById('send');
                    const typingIndicator = document.getElementById('typing-indicator');

                    // Show typing indicator
                    function showTypingIndicator() {
                        typingIndicator.style.display = 'block';
                    }

                    // Hide typing indicator
                    function hideTypingIndicator() {
                        typingIndicator.style.display = 'none';
                    }

                    // Send message to the extension
                    send.addEventListener('click', () => {
                        const message = input.value;
                        if (message) {
                            chat.innerHTML += \`<div class="message"><strong>You:</strong> \${message}</div>\`;
                            input.value = '';
                            vscode.postMessage({ command: 'sendMessage', text: message });
                            showTypingIndicator(); // Show typing indicator when sending a message
                        }
                    });

                    // Receive message from the extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.command === 'receiveMessage') {
                            chat.innerHTML += \`<div class="message"><strong>qBraid:</strong> \${message.text}</div>\`;
                            hideTypingIndicator(); // Hide typing indicator when the response is received
                        }
                    });
                </script>
            </body>
        </html>
    `;

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async (message) => {
            if (message.command === 'sendMessage') {
                const apiKey = vscode.workspace.getConfiguration('qbraid').get('apikey') as string;
                if (apiKey) {
                    await handleUserInput(apiKey, message.text, panel.webview);
                }
            }
        },
        undefined,
        context.subscriptions
    );

    return panel;
}

export function activate(context: vscode.ExtensionContext) {
    // Register the API Key setting command
    let disposable = vscode.commands.registerCommand('qbraid.setApiKey', setApiKey);

    // Register the streaming chat command
    let chatCommand = vscode.commands.registerCommand('qbraid.sendChatMessage', async () => {
        const apiKey = vscode.workspace.getConfiguration('qbraid').get('apikey') as string;

        if (!apiKey) {
            vscode.window.showErrorMessage('API Key not set. Run "Set qBraid API Key" first.');
            return;
        }

        // Create the chat webview
        const panel = createChatWebview(context);

        // Focus the input box when the webview is ready
        panel.webview.onDidReceiveMessage(
            () => {
                panel.webview.postMessage({ command: 'focusInput' });
            },
            undefined,
            context.subscriptions
        );
    });

    // Register the showOutput command to open the output channel
    const showOutputCommand = vscode.commands.registerCommand('qbraid.showOutput', () => {
        outputChannel.show();
    });

    // Push commands to context subscriptions
    context.subscriptions.push(disposable, chatCommand, showOutputCommand);

    // Log activation message
    outputChannel.appendLine('qBraid Extension activated.');
}

export function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}
