import * as vscode from 'vscode';
import axios, { AxiosError } from 'axios';
import { setApiKey } from '../settings';
import { sendChatMessage } from '../chat';

// Create an output channel for logging
const outputChannel = vscode.window.createOutputChannel('qBraid Extension');

export function activate(context: vscode.ExtensionContext) {
    // Register the API Key setting command
    let disposable = vscode.commands.registerCommand('qbraid.setApiKey', setApiKey);

    // Register the streaming chat command
    let chatCommand = vscode.commands.registerCommand('qbraid.sendChatMessage', sendChatMessage);

    // Register the makeApiCall command
    const makeApiCallCommand = vscode.commands.registerCommand('qbraidExtension.makeApiCall', async () => {
        const apiUrl = 'https://api.example.com/data'; // Replace with actual API
        const params = { key: 'value' }; // Replace with actual parameters
        await makeApiCall(apiUrl, params);
    });

    // Register the showOutput command to open the output channel
    const showOutputCommand = vscode.commands.registerCommand('qbraidExtension.showOutput', () => {
        outputChannel.show();
    });

    // Push commands to context subscriptions
    context.subscriptions.push(disposable, chatCommand, makeApiCallCommand, showOutputCommand);

    // Log activation message
    outputChannel.appendLine('qBraid Extension activated.');
}

export async function makeApiCall(apiUrl: string, params: any) {
    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'qBraid API Request',
                cancellable: false,
            },
            async () => {
                const response = await axios.get(apiUrl, { params });
                outputChannel.appendLine(`[INFO]: API call successful: ${apiUrl}`);
                outputChannel.appendLine(`[INFO]: Response: ${JSON.stringify(response.data, null, 2)}`);
                vscode.window.showInformationMessage('API call successful! Check the output channel for details.');
                return response.data;
            }
        );
    } catch (error) {
        handleApiError(error, apiUrl);
    }
}

function handleApiError(error: unknown, apiUrl: string) {
    let errorMessage = 'An unknown error occurred.';
    if (axios.isAxiosError(error)) {
        if (error.response) {
            errorMessage = `API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown server error'}`;
        } else if (error.request) {
            errorMessage = 'API Error: No response received from the server.';
        } else {
            errorMessage = `API Error: ${error.message}`;
        }
    } else if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
    }

    outputChannel.appendLine(`[ERROR]: ${errorMessage}`);
    outputChannel.appendLine(`[DETAILS]: Failed API URL: ${apiUrl}`);
    vscode.window.showErrorMessage(errorMessage);
}

export function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}

