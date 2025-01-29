import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../App';
import './styles.css';

// Establish VS code webview API connection
declare global {
    interface Window {
        acquireVsCodeApi(): any,
    }
}

const vscode = window.acquireVsCodeApi();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <React.StrictMode>
        <App vscode={vscode} />
    </React.StrictMode>
);

