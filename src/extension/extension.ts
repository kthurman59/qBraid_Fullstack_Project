import * as vscode from 'vscode';
import { setApiKey } from './settings';
import { sendChatMessage, handleUserInput } from './chat';

// Create an output channel for logging
const outputChannel = vscode.window.createOutputChannel('qBraid Extension');

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

        const userInput = await vscode.window.showInputBox({ prompt: 'Enter your message to qBraid' });
        if (!userInput) return;

        outputChannel.show();
        await handleUserInput(apiKey, userInput, outputChannel);
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
