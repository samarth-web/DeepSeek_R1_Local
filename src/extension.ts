import ollama from 'ollama';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "samarthbot" is now active!');

    const disposable = vscode.commands.registerCommand('samarthbot.start', () => {
        const panel = vscode.window.createWebviewPanel(
            'deepChat',
            'Deep Seek Chat',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebViewContent();

        panel.webview.onDidReceiveMessage(async (message: any) => {
            if (message.command === 'chat') {
                const userPrompt = message.text;
                let responseText = '';

                try {
                    const streamResponse = await ollama.chat({
                        model: 'deepseek-r1:latest',
                        messages: [{ role: 'user', content: userPrompt }],
                        stream: true
                    });

                    for await (const part of streamResponse) {
                        responseText += part.message.content;
                        panel.webview.postMessage({ command: 'chatResponse', text: responseText });
                    }
                } catch (error) {
                    console.error("Error in Ollama chat:", error);
                }
            }
        });
    });

    context.subscriptions.push(disposable);
}

function getWebViewContent(): string {
    return /*html*/`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Simple Chatbot UI</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background-color: #f4f4f4;
            }
            .chat-container {
                width: 300px;
                background: white;
                padding: 15px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .messages {
                height: 300px;
                overflow-y: auto;
                border-bottom: 1px solid #ddd;
                padding-bottom: 10px;
                margin-bottom: 10px;
            }
            .input-box {
                display: flex;
            }
            input {
                flex: 1;
                padding: 8px;
            }
            button {
                padding: 8px;
                background: blue;
                color: white;
                border: none;
                cursor: pointer;
            }
        </style>
    </head>
    <body>
        <div class="chat-container">
            <div class="messages" id="chat"></div>
            <div class="input-box">
                <input type="text" id="userInput" placeholder="Type a message...">
                <button id="ask">Send</button>
            </div>
            <div id="response"></div>
            <script>
                const vscode = acquireVsCodeApi();
                document.getElementById('ask').addEventListener('click', () => {
                    const text = document.getElementById("userInput").value;
                    vscode.postMessage({ command: 'chat', text });
                });

                window.addEventListener('message', event => {
                    const { command, text } = event.data;
                    if (command === 'chatResponse') {
                        document.getElementById('response').innerText = text;
                    }
                });
            </script>
        </div>
    </body>
    </html>
    `;
}

export function deactivate() {}
