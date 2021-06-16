/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { getFiles } from './misc/iomanip';


import { executeCUGenTask } from './tasks/task_cu_gen';
import { executeDepProfTask } from './tasks/task_dep_prof';
import { executeFileMappingTask } from './tasks/task_file_mapping';
import { executeRedOpTask } from './tasks/task_red_op';

export class DiscoPoPViewProvider implements vscode.WebviewViewProvider {
  folderPath: string;
  buildPath: string;

  init: boolean;
  webview: vscode.WebviewView | undefined;
  interval!: NodeJS.Timeout;

  taskMap : Record<string, Function>;

  constructor() {
    this.taskMap = {
      'CU Generation': executeCUGenTask,
      'Dependence Profiling': executeDepProfTask,
      'Identifying Reduction Operations': executeRedOpTask
    };
    this.folderPath = vscode.workspace.workspaceFolders![0].uri.path; //TODO: think about how to properly do this    ;
    this.buildPath = `${vscode.workspace.getConfiguration("discopopvsc").get("build_path")}/`;


    this.init = false;
  }

  onReceiveMessage(message: any) {
    switch (message.command) {
      case 'createFileMapping':
        executeFileMappingTask(this);
        this.webview!.webview.html = this.webview!.webview.html;
        break;
      case 'startTasks':
        message.tasks.forEach((task: any) => {
          if(task.selected){
            this.taskMap[task.name](this, message.files.filter((m: any) => m.selected).map((m : any) => m.file.path));
          }
        });
        break;
      default:
        break;
    };
  }

  drawWebView(){
    console.log("DRAWING");
    this.webview!.webview.html =  `<!DOCTYPE html>
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
    ${getFiles(this.folderPath).map((filepath) => {
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
  }

  resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
    this.webview = webviewView;
    if (!this.init) {
      webviewView.webview.options = {
        // Allow scripts in the webview
        enableScripts: true
      };
      webviewView.webview.onDidReceiveMessage(this.onReceiveMessage.bind(this));
      this.interval = setInterval(this.drawWebView.bind(this), 1000);
    }

    this.drawWebView();
    //console.log(` html: ${webviewView.webview.html}`);
  }
}

function nameFromPath(folderPath: string, filePath: string): string {
  let re = new RegExp(folderPath + "\/(.*)");
  const outFileName = filePath.match(re)![1];
  return outFileName;
}



