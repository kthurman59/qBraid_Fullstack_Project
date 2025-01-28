import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';

export class QBraidClient {
    private client: AxiosInstance;
    private apiKey: string;
    private baseUrl: string = 'https://api.qbraid.com/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'content-type': 'application/json'
            }
        });
    }

    async getAvailableModels(): Promise<string[]> {
        try {
            const response = await this.client.get('/chat/models');
            return response.data.models.map((model: any) => model.id);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to fetch available models');
            return [];
        }
    }

    async sendChatMessage(
        message: string,
        model: string = 'qbraid-chat-default'
    ): Promise<AsyncGenerator<string>> {
        try {
            const response = await this.client.post('/chat', {
                model,
                messages: [{ role: 'user', content: message }],
                stream: true
            });

            // Note: This is just a placeholder for the streaming logic in Qbraid
            return this.streamResponse(response.data);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to send chat message');
            throw error;
        }
    }

    private async *streamResponse(data: any):
  AsyncGenerator<string> {
        // Implement actual streaming logic based on Qbraid API
        // This is a mock implementation
        yield * [data];
    }
}
