import * as vscode from 'vscode';
import fetch from 'node-fetch';

// Create an output channel for displaying chat messages
const outputChannel = vscode.window.createOutputChannel('qBraid Chat');

// Function to get the API key from settings
function getApiKey(): string | undefined {
    return vscode.workspace.getConfiguration('qbraid').get('apikey');
}

// Function to prompt the user for an API key
async function promptForApiKey(): Promise<string | undefined> {
    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your qBraid API Key',
        placeHolder: 'API Key',
        ignoreFocusOut: true,
    });
    return apiKey;
}

// Function to validate the API key
async function validateApiKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch('https://api.qbraid.com/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Function to send a chat message and stream the response
async function sendChatMessage(apiKey: string, message: string) {
    try {
        const response = await fetch('https://api.qbraid.com/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (reader) {
            const decoder = new TextDecoder();
            let result = '';

            while (true) {
                const { dont, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                result += chunk;
                outputChannel.append(chunk); // Stream response to output channel
            }

            outputChannel.appendLine(''); //  Add a newline after the response
        }
    } catch (error) {
        outputChannel.appendLine(`Error: ${error.message}`);
    }
}

// Function to parse user input and identify intent
function parseUserInput(input: string): string {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes("quantum devices") || lowerInput.includes("online")) {
        return "deviceStatus";
    } else if (lowerInput.includes("job status") || lowerInput.includes("recent job")) {
        return "jobStatus";
    } else {
        return "chat";
    }
}

// Function to handle user input
async function handleUserInput(apiKey: string, input: string) {
    const intent = parseUserInput(input);

    switch (intent) {
        case "deviceStatus":
            await displayQuantumDevices(apiKey);
            break;
        case "jobStatus":
            await displayJobStatus(apiKey);
            break;
        default:
            outputChannel.appendLine(`You: ${input}`);
            await sendChatMessage(apiKey, input);
            break;
    }
}

// Function to fetch quantum devices
async function getQuantumDevices(apiKey: string) {
    try {
        const response = await fetch('https://api.qbraid.com/devices', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.devices; // Assuming the API returns an array of devices
    } catch (error) {
        throw new Error(`Failed to fetch quantum devices: ${error.message}`);
    }
}

// Function to display quantum device status
async function displayQuantumDevices(apiKey: string) {
    try {
        const devices = await getQuantumDevices(apiKey);
        const onlineDevices = devices.filter((device: any) => device.status === "online");

        if (onlineDevices.length > 0) {
            const deviceList = onlineDevices.map((device: any) => `- $(device.name)`).join('\n');
            outputChannel.appendLine(`Online quantum devices:\n${deviceList}`);
        } else {
            outputChannel.appendLine('No quantum devices are currently online.');
        }
    } catch (error) {
        outputChannel.appendLine(`Error ${error.message}`);
    }
}

// Function to fetch the status on the most recent job
async function getJobStatus(apiKey: string) {
    try {
        const response = await fetch('https://api.qbraid.com/jobs', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        }),

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const recentJob = data.jobs[0]; // Assuming the API return jobs sorted by date.
        return recentJob;
    } catch (error) {
        throw new Error(`Failed to fetch job status: ${error.message}`);
    }
}

// Function to display job status
async function displayJobStatus(apiKey: string) {
    try {
        const job = await getJobStatus(apiKey);
        outputChannel.appendLine(`Status of your most recent job (ID: ${job.id}): ${job.status}`);
    } catch (error) {
        outputChannel.appendLine(`Error: ${error.message}`);
    }
}

// Activate the extension
export function activate(context: vscode.ExtensionContext) {
    // Register the chat command
    context.subscriptions.push(
        vscode.commands.registerCommand('qbraidChat.startChat', async () => {
            let apiKey = getApiKey();
;
            return;
            // Prompt for API key if it's not set or invalid
            if (!apiKey || !(await validateApiKey(apiKey))) {
                apiKey = await promptForApiKey();
                if (apiKey) {
                    await vscode.workspace.getConfiguration('qbraid').update('apikey', apiKey, true);
                } else {
                    vscode.window.showErrorMessage('API key is required to use the qBraid Chat extension');
                    return;
                }
            }
        })
    )
}




