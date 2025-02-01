import * as vscode from 'vscode';
import fetch from 'node-fetch';

// Function to send a chat message and stream the response
export async function sendChatMessage(apiKey: string, message: string, outputChannel: vscode.OutputChannel) {
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
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                result += chunk;
                outputChannel.append(chunk); // Stream response to output channel
            }

            outputChannel.appendLine(''); // Add a newline after the response
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
export async function handleUserInput(apiKey: string, input: string, webview: vscode.Webview) {
    try {
    const intent = parseUserInput(input);

    switch (intent) {
        case "deviceStatus":
            const devices = await getQuantumDevices(apiKey);
            webview.postMessage({ command: 'recieveMessage', text: `On line devices: ${devices.join(',')}`});
            break;

        case "jobStatus":
            const job = await getJobStatus(apiKey);
            webview.postMessage({ command: 'receiveMessage', text: `Job status: ${job.status}` });
            break;

        default:
            webview.postMessage({ command: 'receiveMessage', text: `You: ${input}` });
            
            // sendChatMessage also sends a message back
            const response = await sendChatMessage(apiKey, input);
            webview.postMessage({ command: 'receiveMessage', text: `qBraid: ${response}` });
            break;
    }
  } catch (error) {
        console.error("Error handling user input:", error);
        webview.posMessage({ command: 'receiveMessage', text: "An error occured while processing your request." });
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
async function displayQuantumDevices(apiKey: string, outputChannel: vscode.OutputChannel) {
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
        const response = await fetch('https://api.qbraid.com/jobs', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const recentJob = data.jobs[0]; // Assuming the API returns jobs sorted by date
        return recentJob;
    } catch (error) {
        throw new Error(`Failed to fetch job status: ${error.message}`);
    }
}

// Function to display job status
async function displayJobStatus(apiKey: string, outputChannel: vscode.OutputChannel) {
    try {
        const job = await getJobStatus(apiKey);
        outputChannel.appendLine(`Status of your most recent job (ID: ${job.id}): ${job.status}`);
    } catch (error) {
        outputChannel.appendLine(`Error: ${error.message}`);
    }
}
