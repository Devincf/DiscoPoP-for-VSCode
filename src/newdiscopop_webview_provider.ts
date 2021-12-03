/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { getAllFilesInFolderWithPattern, getFiles } from './misc/iomanip';
import { SourceHighlighting } from './misc/source_highlighting';


import { executeCUGenTask } from './tasks/task_cu_gen';
import { executeDepProfTask } from './tasks/task_dep_prof';
import { executeFileMappingTask } from './tasks/task_file_mapping';
import { executePatIdTask } from './tasks/task_pat_id';
import { executeRedOpTask } from './tasks/task_red_op';

export class DiscoPoPViewProvider implements vscode.WebviewViewProvider {
  folderPath: string;
  buildPath: string;
  discopopPath: string;

  currentStage: number = 0;
  stages: any[] = [];

  useMakefile: boolean = false;


  init: boolean;
  webview: vscode.WebviewView | undefined;
  interval!: NodeJS.Timeout;

  lastFiles: string[] = [];

  sourceHighlighting: SourceHighlighting;

  taskMap: Record<string, Function>;

  constructor(sourceHighlighting: SourceHighlighting) {
    this.sourceHighlighting = sourceHighlighting;

    this.stages = [{ 'cu_gen': 0, 'dep_prof': 0, 'id_red_ops': 0 },{}, { 'id_patterns': 0 },{}];

    //check for existing files for stages
    
    this.taskMap = {
      'CU Generation': executeCUGenTask,
      'Dependence Profiling': executeDepProfTask,
      'Identifying Reduction Operations': executeRedOpTask
    };
    this.folderPath = vscode.workspace.workspaceFolders![0].uri.path; //TODO: think about how to properly do this    ;
    this.buildPath = `${vscode.workspace.getConfiguration("discopopvsc").get("build_path")}/`;
    this.discopopPath = `${vscode.workspace.getConfiguration("discopopvsc").get("path")}`;
    
    this.sourceHighlighting.setView(this);

    if(getAllFilesInFolderWithPattern(this.folderPath + '/discopop-tmp', "(.*)dp.ll").length > 0){
      this.stages[0]['dep_prof'] = 2;
    }
    if(getAllFilesInFolderWithPattern(this.folderPath + '/discopop-tmp', "(.*)Data.xml").length > 0){
      this.stages[0]['cu_gen'] = 2;
    }
    if(getAllFilesInFolderWithPattern(this.folderPath + '/discopop-tmp', "(.*)red.bc").length > 0){
      this.stages[0]['id_red_ops'] = 2;
    }
    
    if(getAllFilesInFolderWithPattern(this.folderPath, "(.*)Makefile").length > 0){
      this.useMakefile = true;
    }

    this.init = false;
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
          this.taskMap[message.task](this, tempfiles, this.useMakefile);
          this.lastFiles = tempfiles;
        }
        break;
      case 'identifyPatterns':
        {
          //const tempfiles = message.files.filter((m: any) => m.selected).map((m: any) => m.file.path);
          const tempfiles = getFiles(this.folderPath).filter(file => file.endsWith('.c') || file.endsWith('.cpp') || file.endsWith('.cc'));
          executePatIdTask(this, tempfiles, this.useMakefile);
          this.lastFiles = tempfiles;
          break;
        }
        case 'setUseMakefile':{
          this.useMakefile = message.useMakefile;
        }
      case 'setStage':
        {
          this.currentStage = message.stage;
          break;
        }
      default:
        break;
    };
  }

  drawCurrentStage() {
    /**TODO: IMPLEMENT 2 AND 4 AGAIN, NOT IMPLEMENTED YET
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
        */
    switch (this.currentStage) {
      case 0:
      default:
        return this.drawStageOne();
      case 1:
        return this.drawStageThree();
    }
  }

  drawStageOne() {
    return `<div id="first-stage">
    <div id="extractdd-box" class="task-box multi-boxes task-box-active">
    <span class="task-title">Extract Data Dependences</span> 
    <div class="task-completion ${this.getCompletionState(this.stages[0]['dep_prof'])}">
    
    </div>
      <form class="task-inside-box" action="/task/dd">
        <fieldset style="border:none;">
          <input type="checkbox" name="method" value="Pure Dynamic" checked>Pure Dynamic<br><br>
          <input type="checkbox" name="method" value="Hybrid" disabled>Hybrid<br>
          <br>
          <input type="submit" value="Start" onClick="startTask('Dependence Profiling')"/>
        </fieldset>
      </form>
    </div>
    <div id="decompose-box" class="task-box multi-boxes task-box-active">
    <span class="task-title">Decompose the Program</span> 
    <div class="task-completion ${this.getCompletionState(this.stages[0]['cu_gen'])}">
    </div>
    
    <form class="task-inside-box" action="/task/decompose">
        <fieldset style="border:none;">
          <input type="checkbox" name="method" value="Computational Units" checked disabled> Computational Units<br>
          <br>
          <input type="submit" value="Start" onClick="startTask('CU Generation')" />
        </fieldset>
      </form>
    </div>

    <div id="detectrp-box" class="task-box multi-boxes task-box-active">
    
    <span class="task-title">Detect reduction patterns</span> 
    <div class="task-completion ${this.getCompletionState(this.stages[0]['id_red_ops'])}">
    </div>
      <form class="task-inside-box" action="/task/detectrp">
        <fieldset style="border:none;">
        <input type="checkbox" name="method" value="Reduction Operations" checked disabled>Reduction Operations<br><br>
          <input type="submit" value="Start" onClick="startTask('Identifying Reduction Operations')" />
        </fieldset>
      </form>
    </div>
  </div>`;
  }
  drawStageTwo() {
    return `
    <div id="second-stage">
        <div id="extractdd-box" class="task-box multi-boxes task-box-active">
        <span class="task-title">Extract Data Dependences</span> 
        <div class="task-completion task-done">
        </div>
        
        <br>
        <br>
        <br>
          <form action="/task/dd">
            <fieldset style="border:none;">
              <input type="checkbox" name="task" value="Find unexecuted paths" checked>Find unexecuted paths<br><br>
              <input type="checkbox" name="task" value="Identify parallel patterns" checked>Identify parallel patterns<br>
              <br>
              <input type="submit" value="Execute the tasks" />
            </fieldset>
          </form>
        </div>
      </div>`;
  }
  drawStageThree() {
    return `
    <div id="third-stage">
        <div id="extractdd-box" class="task-box multi-boxes task-box-active">
        <span class="task-title">Identify parallelization suggestions</span> 
        <div class="task-completion ${this.getCompletionState(this.stages[2]['id_patterns'])}">
        </div>
          <form class="task-inside-box" action="/task/dd">
            <fieldset style="border:none;">
              <input type="checkbox" name="task" value="CPU" checked disabled>CPU<br><br>
              <input type="checkbox" name="task" value="GPU" disabled>GPU<br>
              <br>
              <input type="submit" value="Start" onClick="identifyPatterns()"/>
            </fieldset>
          </form>
        </div>
      </div>`;
  }

  drawStageFour() {
    return `
    <div id="fourth-stage">
        <div id="extractdd-box" class="task-box multi-boxes task-box-active">
        <div class="task-completion task-done">
        
        </div>
          <form action="/task/dd">
            <fieldset style="border:none;">
              <input type="checkbox" name="task" value="CPU" checked disabled>CPU<br><br>
              <input type="checkbox" name="task" value="GPU" checked disabled>GPU<br>
              <br>
              <input type="submit" value="Rank patterns" />
            </fieldset>
          </form>
        </div>
      </div>`;
  }

  drawWebView() {
    console.log(this.stages[this.currentStage]);
    //console.log(this.stages[this.currentStage].every((stage: any) => Object.values(stage).every( task => task === 2) ));
    console.log("DRAWING");
    this.webview!.webview.html = `<!DOCTYPE html>
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
    </script>
    <style>
    #wrapper{
      border: 1px solid black;
      border-radius: 10px;
      height: 620px;
      width: 200px;
      padding: 10px 20px;
    }
    
    .task-box{
    height: 140px; 
    width: 200px; 
    border: 1px black solid;
    border-radius:5px;
    }

    .task-inside-box{
      padding:0px;
      margin-top:15px;
    }

    .task-title{
      padding-top:8px;
      padding-left:5px;
      font-family: Arial, Helvetica, sans-serif;
font-size: 13px;
color: #eee;
display:inline-block;
font-weight: 400;
text-decoration: rgb(68, 68, 68);
font-style: normal;
width:160px;
    }
    
    .task-completion{
      float:right;
    width:32px;
    height:32px;
    }
    
    .task-done{
      background-color:green;
    }
    .task-awaiting{
      background-color:yellow;
    }
    .task-error{
      background-color:red;
    }
    
    .task-box-inactive{
    background-color:#e8e3e3;
    color:black;
    }
    
    
    .task-box-active{
    }
    
    .single-box{
    margin: 0px;
    }
    .multi-boxes{
    margin: 10px 0px;
    }
    
    .button {
      border: none;
      color: grey;
      padding: 15px 32px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      width:200px;
      font-size: 16px;
      margin: 4px 2px;
      cursor: pointer;
    }
    
</style>

<div id="wrapper">
<p id="current-status-label">
Current Stage: ${this.currentStage+1}
<select name="stages" id="stages" onchange="vscode.postMessage({command: 'setStage', stage: this.selectedIndex});">
  <option ${this.currentStage === 0 ? 'selected' : ''} value="0">Stage One</option>
  <option ${this.currentStage === 1 ? 'selected' : ''} value="1">Stage Two</option>
</select>

${getAllFilesInFolderWithPattern(this.folderPath, "Makefile").length>0? `<br><input id="makefilecheckbox" type="checkbox" name="useMakefile" value="useMakefile" onchange="vscode.postMessage({command: 'setUseMakefile', useMakefile: this.checked});" checked>Use Makefile<br>` : ''}

${this.drawCurrentStage()}
${this.currentStage !== 1 && Object.values(this.stages[this.currentStage]).every(task => task === 2) ? '<button type="button" class="button" onclick="goToNextStage()">Next Stage</button> ' : ''}
</div>
</body></html>`;
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



