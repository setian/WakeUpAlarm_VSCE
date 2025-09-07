"use strict";var h=Object.create;var u=Object.defineProperty;var b=Object.getOwnPropertyDescriptor;var y=Object.getOwnPropertyNames;var x=Object.getPrototypeOf,I=Object.prototype.hasOwnProperty;var C=(e,t)=>{for(var i in t)u(e,i,{get:t[i],enumerable:!0})},p=(e,t,i,s)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of y(t))!I.call(e,a)&&a!==i&&u(e,a,{get:()=>t[a],enumerable:!(s=b(t,a))||s.enumerable});return e};var w=(e,t,i)=>(i=e!=null?h(x(e)):{},p(t||!e||!e.__esModule?u(i,"default",{value:e,enumerable:!0}):i,e)),S=e=>p(u({},"__esModule",{value:!0}),e);var A={};C(A,{activate:()=>U,deactivate:()=>P});module.exports=S(A);var n=w(require("vscode")),m=w(require("fs")),o;function U(e){console.log('"wakeup-alarm"\uC774 \uD65C\uC131\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4.');let t="",i=0;e.subscriptions.push(n.workspace.onDidChangeTextDocument(a=>{let l=n.workspace.getConfiguration("wakeupAlarm"),g=l.get("triggerCount",20),c=l.inspect("excludedKeys"),v;if(c?.globalValue===void 0&&c?.workspaceValue===void 0?v=["<delete>"]:v=l.get("excludedKeys",[]),a.contentChanges.length===0)return;let d=a.contentChanges[a.contentChanges.length-1],r=null;if(d.text.length===1&&!d.text.includes(`
`)?r=d.text:d.text===""&&d.rangeLength>0&&(r="<delete>"),!r||v.includes(r)){o&&o.webview.postMessage({command:"stopSound"}),i=0,t="";return}r!==t&&o&&o.webview.postMessage({command:"stopSound"}),r===t?i++:(t=r,i=1),i>=g&&(i=0,n.window.showWarningMessage("Are you falling asleep? Time for a stretch! \u{1F634}"),f(e))}));let s=n.commands.registerCommand("wakeupAlarm.testAlarm",()=>{n.window.showInformationMessage("Testing Wake Up Alarm!"),f(e)});e.subscriptions.push(s)}function f(e){let t=n.Uri.joinPath(e.extensionUri,"media"),i=n.Uri.joinPath(t,"alarm.mp3"),s=n.Uri.joinPath(t,"alarm.wav"),a=null;m.existsSync(i.fsPath)?a=i:m.existsSync(s.fsPath)&&(a=s);let l=n.Uri.joinPath(t,"pluto.png");if(m.existsSync(l.fsPath)||n.window.showErrorMessage("Image file not found in media folder: pluto.png"),!a){n.window.showErrorMessage("Sound file not found in media folder: alarm.mp3 or alarm.wav");return}o?o.reveal(n.ViewColumn.One):(o=n.window.createWebviewPanel("wakeupAlarm","Wake Up!",n.ViewColumn.One,{enableScripts:!0,localResourceRoots:[t]}),o.onDidDispose(()=>{o=void 0},null,e.subscriptions));let g=o.webview.asWebviewUri(a),c=o.webview.asWebviewUri(l);o.webview.html=k(g.toString(),c.toString())}function k(e,t){return`<!DOCTYPE html>
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
    <img src="${t}" alt="Wake up call">
    <audio id="alarm-sound" src="${e}" autoplay></audio>
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
</html>`}function P(){}0&&(module.exports={activate,deactivate});
