import * as vscode from 'vscode';

// Function to set the API key
export async function setApiKey() {
    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your qBraid API Key',
        placeHolder: 'API Key',
        ignoreFocusOut: true,
    });

    if (apiKey) {
        await vscode.workspace.getConfiguration('qbraid').update('apikey', apiKey, true);
        vscode.window.showInformationMessage('API Key set successfully!');
    } else {
        vscode.window.showErrorMessage('API Key is required.');
    }
}
