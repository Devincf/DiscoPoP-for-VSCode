// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { DiscoPoPViewProvider } from './newnewdiscopop_webview_provider';
import { executeFileMappingTask } from './tasks/task_file_mapping';
import { executeCUGenTask } from './tasks/task_cu_gen';
import { executeDepProfTask } from './tasks/task_dep_prof';
import { executeRedOpTask } from './tasks/task_red_op';

import { SourceHighlighting } from './misc/source_highlighting';
import { CodeActions } from './misc/code_actions';
import { createFolderIfNotExist } from './misc/iomanip';
import { FileManager } from './misc/filemanager';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	createFolderIfNotExist(vscode.workspace.workspaceFolders![0].uri.path + '/discopop-tmp');
	FileManager.init();

	//Configuration.load();

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "discopopvsc" is now active!');
	let sourceHighlighting = new SourceHighlighting(context);
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('*', new CodeActions(sourceHighlighting), {
			providedCodeActionKinds: CodeActions.providedCodeActionKinds
		}));
	const diagnostics = vscode.languages.createDiagnosticCollection("emoji");
	context.subscriptions.push(diagnostics);

	sourceHighlighting.subscribeToDocumentChanges(context, diagnostics);

	// decorator


	//const folderPath = vscode.workspace.workspaceFolders![0].uri.path; //TODO: think about how to properly do this


	const viewProvider: DiscoPoPViewProvider = new DiscoPoPViewProvider(sourceHighlighting, context);
	vscode.window.registerWebviewViewProvider('discopop_view', viewProvider);


	//vscode.window.registerWebviewViewProvider('discopoptasks',new DiscoPoPTasksProvider(context));


	let fmapCommand = vscode.commands.registerCommand('discopopvsc.fmap', () => {
		executeFileMappingTask(viewProvider);
	});
	context.subscriptions.push(fmapCommand);

	//const buildPath = `${vscode.workspace.getConfiguration("discopopvsc").get("path")}/${vscode.workspace.getConfiguration("discopopvsc").get("build_folder")}/`;

	let cugenCommand = vscode.commands.registerCommand('discopopvsc.cugen', () => {
		//TODO: add include dir, and other options
		executeCUGenTask(viewProvider);
	});
	context.subscriptions.push(cugenCommand);


	let dependprofCommand = vscode.commands.registerCommand('discopopvsc.dependprof', () => {
		//TODO: add include dir, and other options
		executeDepProfTask(viewProvider);
	});
	context.subscriptions.push(dependprofCommand);

	let idredopCommand = vscode.commands.registerCommand('discopopvsc.idredop', () => {
		//TODO: add include dir, and other options
		executeRedOpTask(viewProvider);
	});

	let patidCommand = vscode.commands.registerCommand('discopopvsc.patid', () => {

	});



}



// this method is called when your extension is deactivated
export function deactivate() { }
