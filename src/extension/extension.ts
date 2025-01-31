import * as vscode from 'vscode';
import axios, { AxiosError } from 'axios';
import { setApiKey } from '../settings';
import { sendChatMessage } from '../chat';

// Create an output channel for logging
const outputChannel = vscode.window.createOutputChannel('qBraid Extension');

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
        const response = await axios.get('https://api.qbraid.com/chat/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

// Function to fetch quantum devices
async function getQuantumDevices(apiKey: string) {
    try {
        const response = await axios.get('https://api.qbraid.com/devices', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        return response.data.devices; // Assuming the API returns an array of devices
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
            const deviceList = onlineDevices.map((device: any) => `- ${device.name}`).join('\n');
            outputChannel.appendLine(`Online quantum devices:\n${deviceList}`);
        } else {
            outputChannel.appendLine('No quantum devices are currently online.');
        }
    } catch (error) {
        outputChannel.appendLine(`Error: ${error.message}`);
    }
}

// Function to fetch the status of the most recent job
async function getJobStatus(apiKey: string) {
    try {
        const response = await axios.get('https://api.qbraid.com/jobs', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        const recentJob = response.data.jobs[0]; // Assuming the API returns jobs sorted by date
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

export function activate(context: vscode.ExtensionContext) {
    // Register the API Key setting command
    let disposable = vscode.commands.registerCommand('qbraid.setApiKey', setApiKey);

    // Register the streaming chat command
    let chatCommand = vscode.commands.registerCommand('qbraid.sendChatMessage', async () => {
        let apiKey = getApiKey();

        // Prompt for API key if it's not set or invalid
        if (!apiKey || !(await validateApiKey(apiKey))) {
            apiKey = await promptForApiKey();
            if (apiKey) {
                await vscode.workspace.getConfiguration('qbraid').update('apikey', apiKey, true);
            } else {
                vscode.window.showErrorMessage('API key is required to use the qBraid Chat extension.');
                return;
            }
        }

        // Prompt the user for a message
        const message = await vscode.window.showInputBox({
            prompt: 'Enter your message',
            placeHolder: 'Type your message here...',
            ignoreFocusOut: true,
        });

        if (message) {
            outputChannel.show(); // Show the output channel
            await handleUserInput(apiKey, message);
        }
    });

    // Register the command to show quantum device status
    const showDeviceStatusCommand = vscode.commands.registerCommand('qbraid.showDeviceStatus', async () => {
        const apiKey = getApiKey();
        if (apiKey) {
            outputChannel.show();
            await displayQuantumDevices(apiKey);
        } else {
            vscode.window.showErrorMessage('API key is required to fetch quantum devices.');
        }
    });

    // Register the command to show job status
    const showJobStatusCommand = vscode.commands.registerCommand('qbraid.showJobStatus', async () => {
        const apiKey = getApiKey();
        if (apiKey) {
            outputChannel.show();
            await displayJobStatus(apiKey);
        } else {
            vscode.window.showErrorMessage('API key is required to fetch job status.');
        }
    });

    // Register the showOutput command to open the output channel
    const showOutputCommand = vscode.commands.registerCommand('qbraid.showOutput', () => {
        outputChannel.show();
    });

    // Push commands to context subscriptions
    context.subscriptions.push(
        disposable,
        chatCommand,
        showDeviceStatusCommand,
        showJobStatusCommand,
        showOutputCommand
    );

    // Log activation message
    outputChannel.appendLine('qBraid Extension activated.');
}

export function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}
