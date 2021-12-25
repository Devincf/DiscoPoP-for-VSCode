/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as fs from 'fs';
import { getAllFilesInFolderWithPattern, getFiles } from './misc/iomanip';
import { SourceHighlighting } from './misc/source_highlighting';


import { executeCUGenTask } from './tasks/task_cu_gen';
import { executeDepProfTask } from './tasks/task_dep_prof';
import { executeFileMappingTask } from './tasks/task_file_mapping';
import { executePatIdTask } from './tasks/task_pat_id';
import { executeRedOpTask } from './tasks/task_red_op';
import { readdirSync } from 'fs';
import { create } from 'domain';
import { generateKeyPairSync } from 'crypto';
import { Settings } from './misc/settings';
import { FileManager } from './misc/filemanager';

export class DiscoPoPViewProvider implements vscode.WebviewViewProvider {
  folderPath: string;
  buildPath: string;
  discopopPath: string;

  currentStage: number = 0;
  stages: any[] = [];
  stageDescription: string[] = [
    'Please either select the files that you wish to analyze using DiscoPoP. These Files will be saved and used for every future step. <br><br><br>Alternatively you can also use a Makefile, if you have a working one.',
    'Blablabla this is a description text that describes what the current stage is, what id does and provides a link for further reading',
    'Blablabla this is a description text that describes what the current stage is, what id does and provides a link for further reading',
    'Blablabla this is a description text that describes what the current stage is, what id does and provides a link for further reading',
    'Blablabla this is a description text that describes what the current stage is, what id does and provides a link for further reading'
  ];

  stageTitle: string[] = [
    'File Selection',
    'Decomposition',
    'Dependence Profiling',
    'Pattern Identification',
    'Pattern Ranking'
  ];

  useMakefile: boolean = false;


  init: boolean;
  webview: vscode.WebviewView | undefined;
  interval!: NodeJS.Timeout;


  dataxml: null | string = null;

  lastFiles: string[] = [];
  currentFiles: Map<string, boolean>;

  sourceHighlighting: SourceHighlighting;

  filemappingTask!: NodeJS.Timeout | null;
  context: vscode.ExtensionContext;


  constructor(sourceHighlighting: SourceHighlighting, context: vscode.ExtensionContext) {
    this.sourceHighlighting = sourceHighlighting;
    this.context = context;
    console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa");

    this.stages = [{ 'cu_gen': 0, 'dep_prof': 0, 'id_red_ops': 0 }, {}, { 'id_patterns': 0 }, {}, {}];

    this.currentFiles = new Map<string, boolean>();

    //check for existing files for stages

    this.folderPath = vscode.workspace.workspaceFolders![0].uri.path; //TODO: think about how to properly do this    ;
    this.buildPath = `${vscode.workspace.getConfiguration("discopopvsc").get("build_path")}/`;
    this.discopopPath = `${vscode.workspace.getConfiguration("discopopvsc").get("path")}`;

    this.sourceHighlighting.setView(this);

    if (getAllFilesInFolderWithPattern(this.folderPath + '/discopop-tmp', "(.*)dp.ll").length > 0) {
      this.stages[0]['dep_prof'] = 2;
    }
    if (getAllFilesInFolderWithPattern(this.folderPath + '/discopop-tmp', "(.*)Data.xml").length > 0) {
      this.stages[0]['cu_gen'] = 2;
    }
    /*Configuration.getFiles()?.forEach((value, key) => {
      const path = `${this.folderPath}/discopop-tmp/${key}/`;
      if (fs.existsSync(path + 'Data.xml')) {
        Configuration.getConfigValue('files', key).dataxml = fs.readFileSync(path + 'Data.xml').toString();
      }
    });*/
    if (getAllFilesInFolderWithPattern(this.folderPath + '/discopop-tmp', "(.*)red.bc").length > 0) {
      this.stages[0]['id_red_ops'] = 2;
    }

    /*if(getAllFilesInFolderWithPattern(this.folderPath, "(.*)Makefile").length > 0){
      this.useMakefile = true;
    }*/

    this.init = false;
  }

  createHTMLFolder(path: string, depth: number) {
    let returnString = "";
    const files = readdirSync(path);
    files.forEach(file => {
      const filePath = path + '/' + file;
      const isDir = fs.statSync(filePath).isDirectory();
      if (isDir) {
        const folderString = this.createHTMLFolder(filePath, depth + 1);
        if (folderString !== "") {
          returnString += `<div style="border: 1px solid black;margin-left:${depth*10}px;font-weight: bold;"><div onclick="reloadFiles()" class="icon"><i style="text-align:left" class="codicon codicon-folder">${file}</i><br> ${folderString} </div>`;
          //returnString += `<div style="border: 1px solid black;margin-left:${depth * 10}px;font-weight: bold;">${file}<br> ${folderString} </div>`;
        }
      } else {
        let re = new RegExp(/\.(cpp|c|cc|cxx)$/g);
        if (file.match(re) || Settings.get('allFiles')?.enabled) {
          if (!this.currentFiles.has(filePath)) {
            this.currentFiles.set(filePath, true);
          }
          returnString += `<div style="padding-left:${depth * 10}px"><input type="checkbox" id="${file}" name="${file}" checked onChange="console.log('HALLO'); vscode.postMessage({command: 'inputChange', file: '${filePath}', selection: this.checked})"><label for="${file}">${file}</label></div>`;
          //returnString += `<p style="padding-left:${depth*10}px">${file}</p>`;
        }
      }
    });
    return returnString;
  }

  getCompletionState(state: number) {
    switch (state) {
      case 0:
      default:
        return 'task-awaiting';
      case 1:
        return 'task-error';
      case 2:
        return 'task-done';
    }
  }

  onReceiveMessage(message: any) {
    switch (message.command) {
      case 'createFileMapping':
        executeFileMappingTask(this);
        this.webview!.webview.html = this.webview!.webview.html;
        break;
      case 'startTasks':
        {
          //const tempfiles = message.files.filter((m: any) => m.selected).map((m: any) => m.file.path);
          /*message.tasks.forEach((task: any) => {
            if (task.selected) {
              this.taskMap[task.name](this, tempfiles);
            }
          });*/
          const tempfiles = getFiles(this.folderPath).filter(file => file.endsWith('.c') || file.endsWith('.cpp') || file.endsWith('.cc'));
          const tempfiles2 = [...this.currentFiles.keys()].filter((key, index) => {
            return this.currentFiles.get(key);
          });
          if (message.task === 'CU Generation') {
            executeCUGenTask(this, tempfiles2, true, (num: number) => {
              if (num === this.currentStage) {
                this.currentStage++;
              }
            });
          }
          if (message.task === 'Dependence Profiling') {
            executeDepProfTask(this, tempfiles2, true, (num: number) => {
              executeRedOpTask(this, tempfiles2, true, (num: number) => {
                if (num === this.currentStage) {
                  this.currentStage++;
                }
              });
            });
          }
          this.lastFiles = tempfiles2;
        }
        break;
      case 'identifyPatterns':
        {
          //const tempfiles = message.files.filter((m: any) => m.selected).map((m: any) => m.file.path);
          const tempfiles = getFiles(this.folderPath).filter(file => file.endsWith('.c') || file.endsWith('.cpp') || file.endsWith('.cc'));
          const tempfiles2 = [...this.currentFiles.keys()].filter((key, index) => {
            return this.currentFiles.get(key);
          });
          executePatIdTask(this, tempfiles2, true, () => { });
          this.lastFiles = tempfiles2;
          break;
        }
      case 'setUseMakefile': {
        this.useMakefile = message.useMakefile;
        break;
      }
      case 'inputChange':
        {
          this.currentFiles.set(message.file, message.selection);
          console.log(this.currentFiles);
          break;
        }
      case 'setStage':
        {
          this.currentStage = message.stage;
          break;
        }
      case 'changeSetting':
        {
          Settings.flip(message.setting);
          if (message.setting === 'loopCounter') {
            this.sourceHighlighting.refresh();
          } else if (message.setting === 'autoFilemapping') {
            if (this.filemappingTask) {
              clearInterval(this.filemappingTask);
              this.filemappingTask = null;
            } else {
              this.filemappingTask = setInterval(() => {
                executeFileMappingTask(this, false);
              }, 10000);
            }
          }
          break;
        }
      case 'reloadFiles':
        {
          executeFileMappingTask(this, false, () => { FileManager.reloadFileMapping(); });
          this.drawWebView();
          break;
        }
      default:
        break;
    };
  }

  drawCurrentStage() {
    switch (this.currentStage) {
      case 0:
      default:
        return this.drawStageOne();
      case 1:
        return this.drawStageTwo();
      case 2:
        return this.drawStageThree();
      case 3:
        return this.drawStageFour();
      case 4:
        return this.drawStageFive();
    }
  }

  drawStageOne() {
    const hasMakefile = getAllFilesInFolderWithPattern(this.folderPath, "Makefile").length > 0;
    if (FileManager.getFiles().size === 0) {
      executeFileMappingTask(this, false, () => { this.drawWebView(); FileManager.reloadFileMapping(); });
    }
    return `
    <div class="tab">
    <button class="tablinks active" ${hasMakefile ? '' : ' style="width:100%"'} onclick="openTab(event, 'Manual')">Manually Select Files</button>
    ${hasMakefile ? '<button class="tablinks" onclick="openTab(event, \'Makefile\')">Use Makefile</button>' : ''}
    </div>

    <div id="Manual" class="tabcontent" style="display:block">
    <div id="reload" onclick="reloadFiles()" class="icon"><i class="codicon codicon-refresh"></i>
    </div>
      <div id="foldercontent">
        ${this.createHTMLFolder(this.folderPath, 0)}
      </div>
    </div>

    <div id="Makefile" class="tabcontent">
      <h3>Use Makefile</h3>
      <p>By selecting this, you are making use of the following Makefile:</p>
      <p>Hier Makefile maybe anzeigen? ansonsten verlinken?</p>
      <p>Please keep in mind that DiscoPoP currently only supports certainly formatted Makefiles. 
      If yours does not work then please contact Lukas</p>
    </div>
    <button class="next-btn" type="button" onclick="goToNextStage()">Continue</button>
    `;
  }
  drawStageTwo() {
    return `<p>Using Makefile: ${this.useMakefile}</p>
    <div>Generate Computational <button class="task-btn" type="button" onclick="startTask('CU Generation')">Start</button></div>
    <button class="next-btn" type="button" onclick="goToNextStage()">Continue</button>`;
  }
  drawStageThree() {
    return `<p>Using Makefile: ${this.useMakefile}</p>
    <div>Identify reduction operations and execute dependence profiling<button class="task-btn" type="button" onclick="startTask('Dependence Profiling');startTask('Identifying Reduction Operations')">Start</button></div>
    <button class="next-btn" type="button" onclick="goToNextStage()">Continue</button>`;
  }

  drawStageFour() {
    return `<p>Using Makefile: ${this.useMakefile}</p>
    <div>Identify Patterns <button class="task-btn" type="button" onclick="identifyPatterns()">Start</button></div>
    <button class="next-btn" type="button" onclick="goToNextStage()">Continue</button>`;
  }
  drawStageFive() {
    return 'idk stage 5';
  }

  drawWebView() {
    console.log(this);
    console.log(this.currentStage);
    console.log(this.stages[this.currentStage]);
    if (this.webview) {
      const codiconsUri = this.webview.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));
      //console.log(this.stages[this.currentStage].every((stage: any) => Object.values(stage).every( task => task === 2) ));
      console.log("DRAWING");
      this.webview.webview.html = `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DiscoPoP Tasks</title>
    <link href="${codiconsUri}" rel="stylesheet" />
    </head>
    <body>
    <script>
    const vscode = acquireVsCodeApi();
    function startTasks(){
      vscode.postMessage({command: 'startTasks', files: Array.from(document.querySelectorAll(".discopop_file")).map(el => { return {'file': { 'name': el.children[1].innerText, 'path': el.children[1].attributes.path.value }, 'selected': el.children[0].checked}}), tasks: Array.from(document.querySelectorAll(".discopop_task")).map(el => { return { 'name': el.children[1].innerText, 'selected': el.children[0].checked}})});
    }
    function startTask(taskName){
      console.log(taskName);
      vscode.postMessage({command: 'startTasks', files: Array.from(document.querySelectorAll(".discopop_file")).map(el => { return {'file': { 'name': el.children[1].innerText, 'path': el.children[1].attributes.path.value }, 'selected': el.children[0].checked}}), task: taskName});
    }
    function createFileMapping(){
      vscode.postMessage({command: 'createFileMapping'});
    }
    function identifyPatterns(){
      vscode.postMessage({command: 'identifyPatterns', files: Array.from(document.querySelectorAll(".discopop_file")).map(el => { return {'file': { 'name': el.children[1].innerText, 'path': el.children[1].attributes.path.value }, 'selected': el.children[0].checked}}), tasks: Array.from(document.querySelectorAll(".discopop_task")).map(el => { return { 'name': el.children[1].innerText, 'selected': el.children[0].checked}})});
    }
    function goToNextStage(){
      vscode.postMessage({command: 'setStage', stage: ${this.currentStage + 1} });
    }
    function goToStage(stage){
      vscode.postMessage({command: 'setStage', stage: stage });
    }

    function openTab(evt, tab) {
      if(tab === "Makefile"){
        vscode.postMessage({command: 'setUseMakefile', useMakefile: true});
      }else{
        vscode.postMessage({command: 'setUseMakefile', useMakefile: false});
      }
      // Declare all variables
      var i, tabcontent, tablinks;
    
      // Get all elements with class="tabcontent" and hide them
      tabcontent = document.getElementsByClassName("tabcontent");
      for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
      }
    
      // Get all elements with class="tablinks" and remove the class "active"
      tablinks = document.getElementsByClassName("tablinks");
      for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
      }
    
      // Show the current tab, and add an "active" class to the button that opened the tab
      document.getElementById(tab).style.display = "block";
      evt.currentTarget.className += " active";
    } 

    function changeSetting(setting){
      console.log(setting);
      vscode.postMessage({command: 'changeSetting', setting});
    }

    function reloadFiles(){
      vscode.postMessage({command: 'reloadFiles'});
    }

    </script>
    <style>
    body{
      padding: 0;
      margin: 0;
    }
    
    #parent{
      height: 800px;
      width: 100%;
    }
    #container{
      width: 100%;
      height: 100%;
      background-color: var(--vscode-sidebar-background);
    }
    #stage-div{
    }
    #stage-position-div{
      margin: 0 20%;
    }
    #stage-name{
      color: white;
      height: 40%;
      padding-top: 1px;
    }
    #settings-icon{
      border: 1px solid #ffffffaa;
      background-color: #ddd;
      color: black;
    }
    .dropdown {
      position: absolute;
      left:25px;
      top:10px;
      display: inline-block;
    }
    .dropdown-content {
      display: none;
      position: absolute;
      background-color: #f9f9f9;
      min-width: 280px;
      box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
      z-index: 1;
    }
    .dropdown-content label{
      color: black;
      text-decoration: none;
    }
    .dropdown:hover .dropdown-content {
      display: block;
    }
    #stage-title{
      margin-left: 45px;
      font-size: 3.2vw;
    }
    #stage-circles{
      height: 50%;  
    }
    .dot {
      margin: 10px 1vw;
      height: 3vw;
      width: 3vw;
      background-color: #ccc;
      border: 1px solid black;
      border-radius: 50%;
      display: inline-block;
    }
    .dot-selected{
      background-color: white;
    }
    .dot-finished{
        background-color: green;
    }
    #stage-desc{
      color: white;
      margin-bottom: 25px;
    }
    #desc-text{
      border: 1px dotted black;
      padding: 5px;
      margin: 55px 25px;
    }
    #stage-content{
      padding: 30px;
      color: white;
    }
    .tab {
      overflow: hidden;
      border: 1px solid #ccc;
      background-color: #f1f1f1;
    }
    /* Style the buttons that are used to open the tab content */
    .tab button {
      background-color: inherit;
      float: left;
      width:50%;
      border: none;
      font-size: 14px;
      outline: none;
      cursor: pointer;
      padding: 10px 5px;
      transition: 0.3s;
    }
    
    /* Change background color of buttons on hover */
    .tab button:hover {
      background-color: #ddd;
    }
    
    /* Create an active/current tablink class */
    .tab button.active {
      background-color: #ccc;
    }
    #reload{
      width:26px;
      height:26px;
      float: right;
      cursor: pointer;
    }
    .task-btn{
      margin-left: 20px;
      padding: 0px 10px;
    }
    .tabcontent {
      display: none;
      padding: 6px 12px;
      border: 1px solid #ccc;
      border-top: none;
    }
    .task-btn{
      margin-left: 20px;
      padding: 0px 10px;
    }
    #next-btn-div{
      height: 10%;
      position: relative;
    }
    .next-btn{
      margin-top: 10px;
      position: absolute;
      right: 30px;
      height: 40px;
      width: 140px;
      font-size: 16px;
    }
    
</style>

<div id="parent">
  <div id="container">
  <div id="stage-div">
  <div id="stage-position-div">
      <div id="stage-name">
          <div class="dropdown">
          <icon id="settings-icon">Settings</icon>
            <div class="dropdown-content">
            ${Array.from(Settings.getAll().entries()).map((value, index) => {
        const test = `<input type="checkbox" value="${value[0]}" name="${value[0]}" ${value[1].enabled ? 'checked' : ''} onchange="changeSetting('${value[0]}')"><label for="${value[0]}">${value[1].text}</label><br>`;
        return test;
      }).join('')}
            </div>
          </div>
          <p id="stage-title">${this.stageTitle[this.currentStage]}</p>
      </div>
      <div id="stage-circles">
          <span style="margin-left:35px" class="dot dot-finished ${this.currentStage === 0 ? 'dot-selected' : ''}" onClick="goToStage(0)"></span>
          <span class="dot ${this.currentStage === 1 ? 'dot-selected' : ''}" onClick="goToStage(1)"></span>
          <span class="dot ${this.currentStage === 2 ? 'dot-selected' : ''}" onClick="goToStage(2)"></span>
          <span class="dot ${this.currentStage === 3 ? 'dot-selected' : ''}" onClick="goToStage(3)"></span>
          <span class="dot ${this.currentStage === 4 ? 'dot-selected' : ''}" onClick="goToStage(4)"></span>
      </div>
  </div>
</div>
    <div id="stage-desc">
      <p id="desc-text">
        ${this.stageDescription[this.currentStage]}
      </p>
    </div>
    <div id="stage-content">
    ${this.drawCurrentStage()}
    </div>
  </div>
</div>
</body></html>`;

    }
    //TODO: CHANGE CURRENT STAGE !== 1 TO 3

    /*
</p>
<p id="current-information-label">
Some information(not implemented)
</p>
    */
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



