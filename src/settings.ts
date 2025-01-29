import * as vscode from 'vscode';

export async function setApiKey(){
    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your qBraid API Key',
        ignoreFocusOut: true,
        password: true
    });

    if (apiKey) {
        await vscode.workspace.getConfiguration().update('qbraid.apiKey', apiKey, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('qBraid API Key saved!');
    }
}
