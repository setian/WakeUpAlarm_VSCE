"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var fs = __toESM(require("fs"));
var webviewPanel;
function activate(context) {
  console.log('"wakeup-alarm"\uC774 \uD65C\uC131\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4.');
  let lastAction = "";
  let repeatCount = 0;
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((event) => {
    const configuration = vscode.workspace.getConfiguration("wakeupAlarm");
    const triggerCount = configuration.get("triggerCount", 20);
    const excludedKeysInspect = configuration.inspect("excludedKeys");
    let excludedKeys;
    if (excludedKeysInspect?.globalValue === void 0 && excludedKeysInspect?.workspaceValue === void 0) {
      excludedKeys = ["<delete>"];
    } else {
      excludedKeys = configuration.get("excludedKeys", []);
    }
    if (event.contentChanges.length === 0) {
      return;
    }
    const change = event.contentChanges[event.contentChanges.length - 1];
    let currentAction = null;
    if (change.text.length === 1 && !change.text.includes("\n")) {
      currentAction = change.text;
    } else if (change.text === "" && change.rangeLength > 0) {
      currentAction = "<delete>";
    }
    if (!currentAction || excludedKeys.includes(currentAction)) {
      if (webviewPanel) {
        webviewPanel.webview.postMessage({ command: "stopSound" });
      }
      repeatCount = 0;
      lastAction = "";
      return;
    }
    if (currentAction !== lastAction && webviewPanel) {
      webviewPanel.webview.postMessage({ command: "stopSound" });
    }
    if (currentAction === lastAction) {
      repeatCount++;
    } else {
      lastAction = currentAction;
      repeatCount = 1;
    }
    if (repeatCount >= triggerCount) {
      repeatCount = 0;
      vscode.window.showWarningMessage("Are you falling asleep? Time for a stretch! \u{1F634}");
      playAlarmSound(context);
    }
  }));
  const testAlarmCommand = vscode.commands.registerCommand("wakeupAlarm.testAlarm", () => {
    vscode.window.showInformationMessage("Testing Wake Up Alarm!");
    playAlarmSound(context);
  });
  context.subscriptions.push(testAlarmCommand);
}
function playAlarmSound(context) {
  const mediaFolder = vscode.Uri.joinPath(context.extensionUri, "media");
  const mp3Path = vscode.Uri.joinPath(mediaFolder, "alarm.mp3");
  const wavPath = vscode.Uri.joinPath(mediaFolder, "alarm.wav");
  let soundFileUri = null;
  if (fs.existsSync(mp3Path.fsPath)) {
    soundFileUri = mp3Path;
  } else if (fs.existsSync(wavPath.fsPath)) {
    soundFileUri = wavPath;
  }
  const imagePath = vscode.Uri.joinPath(mediaFolder, "pluto.png");
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
      "wakeupAlarm",
      "Wake Up!",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [mediaFolder]
      }
    );
    webviewPanel.onDidDispose(() => {
      webviewPanel = void 0;
    }, null, context.subscriptions);
  }
  const webviewSoundUri = webviewPanel.webview.asWebviewUri(soundFileUri);
  const webviewImageUri = webviewPanel.webview.asWebviewUri(imagePath);
  webviewPanel.webview.html = getWebviewContent(context);
  webviewPanel.webview.postMessage({
    command: "updateMedia",
    imageUri: webviewImageUri.toString(),
    soundUri: webviewSoundUri.toString()
  });
}
function getWebviewContent(context) {
  const htmlPath = vscode.Uri.joinPath(context.extensionUri, "media", "webview.html");
  let htmlContent = fs.readFileSync(htmlPath.fsPath, "utf8");
  return htmlContent;
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
