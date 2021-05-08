import { runInThisContext } from 'vm';
import * as vscode from 'vscode';

export class DiscoPoPViewProvider implements vscode.WebviewViewProvider {
  filemapping: string[];
  folderPath: string;

  init: boolean;

  constructor(folderPath: string, filemapping: string[]) {
    this.filemapping = filemapping;
    this.folderPath = folderPath;

    this.init = false;
  }

  onReceiveMessage(message: any) {
    switch (message.command) {
      case 'createFileMapping':
        break;
      case 'startTasks':
        break;
      default:
        break;
    };
  }

  resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
    if (!this.init) {
      webviewView.webview.options = {
        // Allow scripts in the webview
        enableScripts: true
      };

      webviewView.webview.onDidReceiveMessage(this.onReceiveMessage);

    }

    webviewView.webview.html = `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DiscoPoP Tasks</title>
  </head>
  <body>
  <script>
  const vscode = acquireVsCodeApi();
  function startTasks(){
    vscode.postMessage({command: 'startTasks', files: Array.from(document.querySelectorAll(".discopop_file")).map(el => { return {'file': { 'name': el.children[1].innerText, 'path': el.children[1].attributes.path.value }, 'selected': el.children[0].checked}}), tasks: Array.from(document.querySelectorAll(".discopop_task")).map(el => { return { 'name': el.children[1].innerText, 'selected': el.children[0].checked}})});
  }
  function createFileMapping(){
    vscode.postMessage({command: 'createFileMapping'});
  }
  </script>
  <span class="discopop-title">Files</span>
  <div id="discopopfiles">
  ${getFiles(this.folderPath, this.filemapping).map((filepath) => {
      return `<div class="discopop_file" title="${nameFromPath(this.folderPath, filepath)}">
    <input type="checkbox" tabindex="-1">
    <span path="${filepath}"> ${nameFromPath(this.folderPath, filepath)} </span>
    </div>`;
    }).join("")}
  </div>
  <button type="button" onclick="createFileMapping()">Create File Mapping</button>
  <br><hr><br>
  <span class="discopop-title">Tasks</span>
  <div>
    <div class="discopop_task" title="CU Generation">
      <input type="checkbox" tabindex="-1">
      <span> CU Generation </span>
    </div>
    <div class="discopop_task" title="Dependence Profiling">
      <input type="checkbox" tabindex="-1">
      <span> Dependence Profiling </span>
    </div>
    <div class="discopop_task" title="Identifying Reduction Operations">
      <input type="checkbox" tabindex="-1">
      <span> Identifying Reduction Operations </span>
    </div>
  </div>
  <br>
  <div>
    <button type="button" onclick="startTasks()">Start Tasks</button>
  </div>

  </body>
  </html>`;
    //console.log(` html: ${webviewView.webview.html}`);
  }
}

function nameFromPath(folderPath: string, filePath: string): string {
  let re = new RegExp(folderPath + "\/(.*)");
  const outFileName = filePath.match(re)![1];
  return outFileName;
}

function getFiles(folderPath: string, filemapping: string[]): string[] {
  return filemapping.map((file) => {
    const temp = file.substr(file.indexOf(folderPath));
    return temp;
  });
}

