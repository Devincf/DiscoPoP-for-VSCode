import * as vscode from 'vscode';
import * as fs from 'fs';

import {exec} from 'child_process';
import { DiscoPoPViewProvider } from '../newdiscopop_webview_provider';
import { createFolderIfNotExist } from '../misc/iomanip';

export function executeFileMappingTask(discopopView: DiscoPoPViewProvider, showMessage: boolean = true){
    	//copy from scripts to folder
		console.log("Filemapping");
		const dpfmapPath = `${vscode.workspace.getConfiguration("discopopvsc").get("scripts_path")}/dp-fmap`;

		//const folderPath = vscode.workspace.workspaceFolders![0].uri.path; //TODO: think about how to properly do this
		fs.stat(dpfmapPath, (err, stats) => {
			if (err) {
				vscode.window.showErrorMessage(`Error creating File Mapping. dp-fmap file not found in path ${dpfmapPath}`);
				return;
			}
			fs.copyFile(dpfmapPath, discopopView.folderPath + '/dp-fmap', () => {
				//execute
				const execStr =  './dp-fmap';
				console.log(execStr);
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
					createFolderIfNotExist(`${discopopView.folderPath}/discopop-tmp`);
					fs.renameSync(`${discopopView.folderPath}/FileMapping.txt`, `${discopopView.folderPath}/discopop-tmp/FileMapping.txt`);
					if(showMessage){
						vscode.window.showInformationMessage('File Mapping created successfully');
					}
				});
			});
		});
}