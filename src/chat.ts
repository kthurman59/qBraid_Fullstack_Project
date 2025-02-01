import * as vscode from 'vscode';
import fetch from 'node-fetch';

// Create an output channel for logging
const outputChannel = vscode.window.createOutputChannel('qBraid Chat');

// Function to send a chat message and stream the response
export async function sendChatMessage(apiKey: string, message: string, webview: vscode.Webview) {
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

        if (!response.body) {
            throw new Error('Response body is null');
        }

        const reader = (response.body as unknown as ReadableStream<Uint8Array>).getReader();
        const decoder = new TextDecoder();
        let result = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            result += chunk;
            webview.postMessage({ command: 'receiveMessage', text: chunk });
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            webview.postMessage({ command: 'receiveMessage', text: `Error: ${error.message}` });
        } else {
            webview.postMessage({ command: 'receiveMessage', text: 'Unknown error occurred' });
        }
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
    const intent = parseUserInput(input);

    switch (intent) {
        case "deviceStatus":
            await displayQuantumDevices(apiKey, webview);
            break;
        case "jobStatus":
            await displayJobStatus(apiKey, webview);
            break;
        default:
            webview.postMessage({ command: 'receiveMessage', text: `You: ${input}` });
            await sendChatMessage(apiKey, input, webview);
            break;
    }
}

interface Device {
    // Define the properties of a device if known
    id: string;
    name: string;
    // Add other properties of the device as necessary
}

interface Data {
    devices: Device[]; // Assuming devices is an array of Device objects
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
        return (data as Data).devices; // Assuming the API returns an array of devices
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(`Failed to fetch quantum devices: ${error.message}`);
        } else {
            throw new Error('Unknown error occurred while fetching quantum devices');
        }
    }
}

// Function to display quantum device status
async function displayQuantumDevices(apiKey: string, webview: vscode.Webview) {
    try {
        const devices = await getQuantumDevices(apiKey);
        const onlineDevices = devices.filter((device: any) => device.status === "online");

        if (onlineDevices.length > 0) {
            const deviceList = onlineDevices.map((device: any) => `- ${device.name}`).join('\n');
            webview.postMessage({ command: 'receiveMessage', text: `Online quantum devices:\n${deviceList}` });
        } else {
            webview.postMessage({ command: 'receiveMessage', text: 'No quantum devices are currently online.' });
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            webview.postMessage({ command: 'receiveMessage', text: `Error: ${error.message}` });
        } else {
            webview.postMessage({ command: 'receiveMessage', text: 'Unknown error occurred' });
        }
    }
}

interface Job {
    id: string;
    status: string;
    // Add other properties of the job as necessary
}

interface JobData {
    jobs: Job[]; // Assuming jobs is an array of Job objects
}

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

        // Type assertion to tell TypeScript that data is of type JobData
        const recentJob = (data as JobData).jobs[0]; // Assuming the API returns jobs sorted by date
        return recentJob;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(`Failed to fetch job status: ${error.message}`);
        } else {
            throw new Error('Unknown error occurred while fetching job status');
        }
    }
}


// Function to display job status
async function displayJobStatus(apiKey: string, webview: vscode.Webview) {
    try {
        const job = await getJobStatus(apiKey);
        webview.postMessage({ command: 'receiveMessage', text: `Status of your most recent job (ID: ${job.id}): ${job.status}` });
    } catch (error: unknown) {
        if (error instanceof Error) {
            webview.postMessage({ command: 'receiveMessage', text: `Error: ${error.message}` });
        } else {
            webview.postMessage({ command: 'receiveMessage', text: 'Unknown error occurred' });
        }
    }
}
