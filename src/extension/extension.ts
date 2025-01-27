import * as vscode from 'vscode';
import axios, { AxiosError } from 'axios';

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

