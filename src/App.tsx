// src/App.tsx
import React, { useState, useEffect } from 'react';

interface WebviewMessage {
  response: string;
}

interface AppProps {
  vscode: any; // Passed from the webview entry point
}

const App: React.FC<AppProps> = ({ vscode }) => {
  const [message, setMessage] = useState<string | null>(null);

  // Listen for messages from the extension host
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const message: WebviewMessage = event.data;
      setMessage(message.response);
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  return (
    <div>
      <h1>qBraid Webview</h1>
      <p>{message ? message : "Waiting for message..."}</p>
    </div>
  );
};

export default App;

