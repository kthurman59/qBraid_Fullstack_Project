import * as vscode from 'vscode';

// Function to set the API key
export async function setApiKey(context: vscode.ExtensionContext) {
    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your qBraid API Key',
        placeHolder: 'API Key',
        ignoreFocusOut: true,
    });

    if (apiKey) {
        await context.secrets.store('qbraidApiKey', apiKey);
        vscode.window.showInformationMessage('API Key set successfully!');
    } else {
        vscode.window.showErrorMessage('API Key is required.');
    }
}

