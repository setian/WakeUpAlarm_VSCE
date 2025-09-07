import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let webviewPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {

    console.log('"wakeup-alarm"이 활성화되었습니다.');

    let lastAction: string = '';
    let repeatCount: number = 0;

    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        const configuration = vscode.workspace.getConfiguration('wakeupAlarm');
        const triggerCount = configuration.get<number>('triggerCount', 20);
        const excludedKeysInspect = configuration.inspect<string[]>('excludedKeys');
        let excludedKeys: string[];

        if (excludedKeysInspect?.globalValue === undefined && excludedKeysInspect?.workspaceValue === undefined) {
            excludedKeys = ['<delete>'];
        } else {
            excludedKeys = configuration.get<string[]>('excludedKeys', []);
        }

        if (event.contentChanges.length === 0) {
            return;
        }

        const change = event.contentChanges[event.contentChanges.length - 1];
        let currentAction: string | null = null;

        if (change.text.length === 1 && !change.text.includes('\n')) {
            currentAction = change.text;
        } else if (change.text === '' && change.rangeLength > 0) {
            currentAction = '<delete>';
        }

        if (!currentAction || excludedKeys.includes(currentAction)) {
            if (webviewPanel) {
                webviewPanel.webview.postMessage({ command: 'stopSound' });
            }
            repeatCount = 0;
            lastAction = '';
            return;
        }

        if (currentAction !== lastAction && webviewPanel) {
            webviewPanel.webview.postMessage({ command: 'stopSound' });
        }

        if (currentAction === lastAction) {
            repeatCount++;
        } else {
            lastAction = currentAction;
            repeatCount = 1;
        }

        if (repeatCount >= triggerCount) {
            repeatCount = 0;
            vscode.window.showWarningMessage("Are you falling asleep? Time for a stretch! 😴");
            playAlarmSound(context);
        }
    }));

    // 테스트를 위한 명령어 등록
    const testAlarmCommand = vscode.commands.registerCommand('wakeupAlarm.testAlarm', () => {
        vscode.window.showInformationMessage('Testing Wake Up Alarm!');
        playAlarmSound(context);
    });

    context.subscriptions.push(testAlarmCommand);
}

function playAlarmSound(context: vscode.ExtensionContext) {
    const mediaFolder = vscode.Uri.joinPath(context.extensionUri, 'media');

    const mp3Path = vscode.Uri.joinPath(mediaFolder, 'alarm.mp3');
    const wavPath = vscode.Uri.joinPath(mediaFolder, 'alarm.wav');
    let soundFileUri: vscode.Uri | null = null;
    if (fs.existsSync(mp3Path.fsPath)) {
        soundFileUri = mp3Path;
    } else if (fs.existsSync(wavPath.fsPath)) {
        soundFileUri = wavPath;
    }

    const imagePath = vscode.Uri.joinPath(mediaFolder, 'pluto.png');
    if (!fs.existsSync(imagePath.fsPath)) {
        vscode.window.showErrorMessage("Image file not found in media folder: pluto.png");
    }

    if (!soundFileUri) {
        vscode.window.showErrorMessage("Sound file not found in media folder: alarm.mp3 or alarm.wav");
        return;
    }

    if (webviewPanel) {
        webviewPanel.reveal(vscode.ViewColumn.One);
    } else {
        webviewPanel = vscode.window.createWebviewPanel(
            'wakeupAlarm',
            'Wake Up!',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [mediaFolder]
            }
        );

        webviewPanel.onDidDispose(() => {
            webviewPanel = undefined;
        }, null, context.subscriptions);
    }
    
    const webviewSoundUri = webviewPanel.webview.asWebviewUri(soundFileUri);
    const webviewImageUri = webviewPanel.webview.asWebviewUri(imagePath);

    webviewPanel.webview.html = getWebviewContent(webviewSoundUri.toString(), webviewImageUri.toString());
}

function getWebviewContent(soundUri: string, imageUri: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wake Up!</title>
    <style>
        body {
            background-color: black;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 10px;
            box-sizing: border-box;
        }
        img {
            max-width: 95%;
            max-height: 95vh;
            object-fit: contain;
        }
    </style>
</head>
<body>
    <img src="${imageUri}" alt="Wake up call">
    <audio id="alarm-sound" src="${soundUri}" autoplay></audio>
    <script>
        const audio = document.getElementById('alarm-sound');
        let playCount = 0;
        let intervalId = null;

        function playSound() {
            if (playCount >= 3) {
                if (intervalId) clearInterval(intervalId);
                return;
            }
            audio.currentTime = 0;
            audio.play().catch(error => {
                console.error("Audio play failed:", error);
                if (intervalId) clearInterval(intervalId);
            });
            playCount++;
        }

        audio.addEventListener('canplaythrough', () => {
            if (!intervalId) { 
                intervalId = setInterval(playSound, 600);
            }
        });

        window.addEventListener('load', () => {
            setTimeout(() => {
                if (!intervalId) {
                    intervalId = setInterval(playSound, 600);
                }
            }, 100);
        });

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'stopSound':
                    if (intervalId) {
                        clearInterval(intervalId);
                    }
                    audio.pause();
                    audio.currentTime = 0;
                    break;
            }
        });
    </script>
</body>
</html>`;
}

export function deactivate() {}