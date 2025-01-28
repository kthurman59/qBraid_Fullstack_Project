import * as vscode from 'vscode';
import * as assert from 'assert';

suite('Integration Tests', () => {
    test('Hello World Command', async () => {
        const result = await vscode.commands.executeCommand('qbraidExtension.helloworld');
        assert.strictEqual(result, 'Hello from qBraid!');
    });

    test('Fetch Data Command', async() => {
        const result = await vscode.commands.executeCommand('qbraidExtension.fetchData');
        assert.ok(result);
    });
});
