import React, { useState, useEffect } from 'react';

interface WebviewMessage {
    response: string;
}

interface AppProps {
    vscode: any; // Add the vscode prop
}

const App: React.FC = () => {
    const [message, setMessage] = useState<string | null>(null);

    //List for messages from VS code extension
    useEffect(() => {
        const listener = (event: MessageEvent) => {
            const message: WebviewMessage = event.data;
            setMessage(message.response);
        };

        window.addEventListener('message', listener);

        // Cleanup listener on unmount
        return () => {
            window.removeEventListener('message', listener);
        };
    }, []);


    return (
        <div>
            <h1>qBraid Webview</h1>
            <p>{message ? message : "Waiting for message..."}</p>
        </div>
    );
};

export default App;
