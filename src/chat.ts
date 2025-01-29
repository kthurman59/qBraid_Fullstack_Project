import * as vscode from 'vscode';
import fetch from 'node-fetch';

export async function sendChatMessage() {
     const apiKey = vscode.workspace.getConfiguration().get('qbraid.apikey') as string;
    if (!apiKey) {
        vscode.window.showErrorMessage('API Key not set.  Run "Set qBraid API Key" first.');
        return;
    }

    const userInput = await vscode.window.showInputBox({ prompt: 'Enter your message to qBraid' });
    if (!userInput) return;

    const response = await fetch('https://api.qbraid.com/chat', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userInput })
    });

    if (!response.ok) {
        vscode.window.showErrorMessage(`Error: ${response.statusText}`);
        return;
    }

    const data = await response.json();
    vscode.window.showInformationMessage(`qBraid: ${data.response}`);

}
