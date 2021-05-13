import * as vscode from 'vscode';
import * as fs from 'fs';

import {exec} from 'child_process';
import { DiscoPoPViewProvider } from '../discopop_webview_provider';

export function executeFileMappingTask(discopopView: DiscoPoPViewProvider){
    	//copy from scripts to folder
		console.log("Filemapping");
		const dpfmapPath = `${vscode.workspace.getConfiguration("discopopvsc").get("path")}/${vscode.workspace.getConfiguration("discopopvsc").get("scripts_folder")}/dp-fmap`;

		//const folderPath = vscode.workspace.workspaceFolders![0].uri.path; //TODO: think about how to properly do this
		fs.stat(dpfmapPath, (err, stats) => {
			if (err) {
				vscode.window.showErrorMessage(`Error creating File Mapping. dp-fmap file not found in path ${dpfmapPath}`);
				return;
			}
			fs.copyFile(dpfmapPath, discopopView.folderPath + '/dp-fmap', () => {
				//execute
				exec('./dp-fmap', { cwd: discopopView.folderPath }, (error, stdout, stderr) => {
					if (error) {
						vscode.window.showErrorMessage('Error creating File Mapping');
						console.log(`error: ${error.message}`);
						return;
					}
					if (stderr) {
						vscode.window.showErrorMessage('Error creating File Mapping');
						console.log(`stderr: ${stderr}`);
						return;
					}
					vscode.window.showInformationMessage('File Mapping created successfully');
				});
			});
		});
}