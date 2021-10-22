import * as vscode from 'vscode';
import * as fs from 'fs';

import { exec } from 'child_process';
import { DiscoPoPViewProvider } from '../newdiscopop_webview_provider';
import { getFiles, nameFromPath } from '../misc/iomanip';
import { Highlight } from '../misc/highlight';

export function executePatIdTask(discopopView: DiscoPoPViewProvider, ifiles?: string[]) {
    //copy from scripts to folder

    console.log("executePatIdTask");
    let files: string[] = [];
    if (ifiles === undefined) {
        files = getFiles(discopopView.folderPath);
    } else {
        files = ifiles;
    }
    files.forEach(async (file, index) => {
        console.log(`Dependency Profiling for file (${index}) ${file}`);
        //let re = new RegExp(discopopView.folderPath + "\/(.*)[\.]");
        //const outFileName = file.match(re)![1];
        const outFileName = nameFromPath(discopopView.folderPath, file);

        const execStr = `python3 -m discopop_explorer --path=${discopopView.folderPath}/discopop-tmp --dep-file=${outFileName}_dp_run_dep.txt --fmap=discopop-tmp/FileMapping.txt --json ${discopopView.folderPath}/discopop-tmp/${outFileName}_patterns.json`;
        //TODO: REMOVE AFTER FIX
        if(index === 1){

            exec(execStr, { cwd: discopopView.discopopPath }, (error, stdout, stderr) => {
                vscode.window.showInformationMessage('Pattern Identification finished');
                
                if (error) {
                    vscode.window.showErrorMessage(`Error during pattern identification of File ${outFileName}`);
                    console.log(`error: ${error.message}`);
                discopopView.stages[2]['id_patterns'] = 1;
                return;
            }
            if (stderr) {
                vscode.window.showErrorMessage(`(std)Error during pattern identification of File ${outFileName}`);
                console.log(`stderr: ${stderr}`);
                discopopView.stages[2]['id_patterns'] = 1;
                return;
            }
            //open .json
            //TODO: handle this somewhere else
            discopopView.sourceHighlighting.loadPatterns(outFileName);
            
            discopopView.stages[2]['id_patterns'] = 2;
            //create highlight for each obj
        });
    }
    });
}