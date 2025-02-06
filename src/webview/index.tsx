// src/webview/index.tsx
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from '../App';

declare const acquireVsCodeApi: any; // Provided globally in webview context

const vscode = acquireVsCodeApi();

ReactDOM.render(<App vscode={vscode} />, document.getElementById('root'));

