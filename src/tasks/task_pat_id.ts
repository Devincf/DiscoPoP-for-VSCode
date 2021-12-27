import * as vscode from 'vscode';
import * as fs from 'fs';

import { exec } from 'child_process';
import { DiscoPoPViewProvider } from '../newnewdiscopop_webview_provider';
import { getFiles } from '../misc/iomanip';
import { FileManager } from '../misc/filemanager';

export function executePatIdTask(discopopView: DiscoPoPViewProvider, ifiles?: string[], showMessage: boolean = true, callback?: Function) {
    //copy from scripts to folder

    //console.log("executePatIdTask");

    //copy from scripts to folder
    if (discopopView.useMakefile) {
        executeMakefile(discopopView, showMessage, callback);
    } else {
        executeNormal(discopopView, ifiles, showMessage, callback);
    }
}

function executeNormal(discopopView: DiscoPoPViewProvider, ifiles?: string[], showMessage: boolean = true, callback?: Function) {
    let files: string[] = [];
    if (ifiles === undefined) {
        files = getFiles(discopopView.folderPath);
    } else {
        files = ifiles;
    }
    const discopopPath = '' + vscode.workspace.getConfiguration("discopopvsc").get("path");
    files.forEach(async (file, index) => {
        console.log(`Dependency Profiling for file (${index}) ${file}`);
        let re = new RegExp(/[^\\\/]+(?=\.[\w]+$)|[^\\\/]+$/g);
        const test = file.match(re);
        const outFileName = test![0];
        //const outFileName = nameFromPath(discopopView.folderPath, file);

        //let fileKey = Configuration.getFileUuid(file);
        let fileKey = FileManager.getFileId(file);

        const execStr = `python3 -m discopop_explorer --path=${discopopView.folderPath}/discopop-tmp/${fileKey} --dep-file=${outFileName + '_dp_run'}_dep.txt --fmap=${discopopView.folderPath}/discopop-tmp/FileMapping.txt --json ${discopopView.folderPath}/discopop-tmp/${fileKey}/patterns.json`;
        exec(execStr, { cwd: discopopPath }, (error, stdout, stderr) => {
            if (callback !== undefined) {
                callback.call(null, 3);
            }
            if (error) {
                //vscode.window.showErrorMessage(`Error during pattern identification of File ${outFileName}: ${error}`);
                console.log(`error: ${error.message}`);

                return;
            }
            else if (stderr) {
                //vscode.window.showErrorMessage(`(std)Error during pattern identification of File ${outFileName}: ${stderr}`);
                console.log(`stderr: ${stderr}`);
                return;
            }
            //discopopView.sourceHighlighting.loadPatterns(outFileName);
            else if (showMessage) {
                vscode.window.showInformationMessage('Pattern Identification finished');
            }


            discopopView.sourceHighlighting.loadData(true);
            //create highlight for each obj
        });
    });
}

function executeMakefile(discopopView: DiscoPoPViewProvider, showMessage: boolean, callback?: Function) {
    const discopopPath = '' + vscode.workspace.getConfiguration("discopopvsc").get("path");
    const execStr = `python3 -m discopop_explorer --path=${discopopView.folderPath} --dep-file=out_dep.txt --fmap=FileMapping.txt --json ${discopopView.folderPath}/discopop-tmp/patterns.json`;
    exec(execStr, { cwd: discopopPath }, (error, stdout, stderr) => {




        if (error) {
            vscode.window.showErrorMessage(`Error during pattern identification: ${error}`);
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            vscode.window.showErrorMessage(`(std)Error during pattern identification: ${stderr}`);
            console.log(`stderr: ${stderr}`);
            return;
        }
        if (showMessage) {
            vscode.window.showInformationMessage('Pattern Identification finished using a Makefile');
        }
        if (callback !== undefined) {
            callback.call(null, 3);
        }
        discopopView.sourceHighlighting.loadData(true);
        //create highlight for each obj
    });
}