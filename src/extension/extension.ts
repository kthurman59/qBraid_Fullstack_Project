import * as vscode from 'vscode';
import axios, { AxiosError } from 'axios';
import { setApiKey } from './settings';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('qbraid.setApiKey', setApiKey);
    context.subscriptions.push(disposable);
}


// Create an output channel for logging
const outputChannel = vscode.window.createOutputChannel('qBraid Extension');

export async function makeApiCall(apiUrl: string, params: any) {
    try {
        // Show a progress notification
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'qBraid API Request',
                cancellable: false,
            },
            async () => {
                // Make the API call using axios
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

// Centralized error handling function
function handleApiError(error: unknown, apiUrl: string) {
    let errorMessage = 'An unknown error occurred.';
    if (axios.isAxiosError(error)) {
        if (error.response) {
            // Server responded with a status outside 2xx
            errorMessage = `API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown server error'}`;
        } else if (error.request) {
            // No response received from the server
            errorMessage = 'API Error: No response received from the server.';
        } else {
            // Request setup failed
            errorMessage = `API Error: ${error.message}`;
        }
    } else if (error instanceof Error) {
        // Generic JavaScript error
        errorMessage = `Error: ${error.message}`;
    }

    // Log the error in the output channel
    outputChannel.appendLine(`[ERROR]: ${errorMessage}`);
    outputChannel.appendLine(`[DETAILS]: Failed API URL: ${apiUrl}`);

    // Show the error message in a popup
    vscode.window.showErrorMessage(errorMessage);
}

// Extension Activation
export function activate(context: vscode.ExtensionContext) {
    // Register the makeApiCall command
    const makeApiCallCommand = vscode.commands.registerCommand('qbraidExtension.makeApiCall', async () => {
        // Example API URL and parameters
        const apiUrl = 'https://api.example.com/data';
        const params = { key: 'value' }; // replace with actual parameters
        // Call the API
        await makeApiCall(apiUrl, params);
    });

    // Register the showOutput command to open the output channel
    const showOutputCommand = vscode.commands.registerCommand('qbraidExtension.showOutput', () = > {
        outputChannel.show();
    });

    // Push the commands to the context's subscriptions
    context.subscriptions.push(makeApiCallCommand, showOutputCommand);

    // Add a message to the output channel
    outputChannel.appendLine('qBraid Extension activated.');
}

export function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}

