import * as vscode from 'vscode';
import * as fs from 'fs';

import { exec } from 'child_process';
import { DiscoPoPViewProvider } from '../discopop_webview_provider';
import { createFolderIfNotExist, getFiles } from '../misc/iomanip';

export function executeCUGenTask(discopopView: DiscoPoPViewProvider, ifiles?: string[]) {
    //copy from scripts to folder
    console.log("executeCUGenTask");
    let files: string[] = [];
    if (ifiles === undefined) {
        files = getFiles(discopopView.folderPath);
    } else {
        files = ifiles;
    }
    files.forEach(async (file, index) => {
        console.log(`CU Generation for file (${index}) ${file}`);
        let re = new RegExp(discopopView.folderPath + "\/(.*)[\.]");
        const outFileName = file.match(re)![1];
        
        const clang = vscode.workspace.getConfiguration("discopopvsc").get("clang");
        console.log(file.match(re));
        
        createFolderIfNotExist(`${discopopView.folderPath}/discopop-tmp`);
        exec(`${clang} -g -O0 -fno-discard-value-names -Xclang -load -Xclang ${discopopView.buildPath}/libi/LLVMCUGeneration.so -mllvm -fm-path -mllvm ./FileMapping.txt -c ${file} -o ${outFileName}`, { cwd: discopopView.folderPath + '/discopop-tmp' }, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Error generating CU for file ${outFileName}`);
                console.log(`error: ${error.message}`);
                return;
            }
            vscode.window.showInformationMessage('Finished CU Generation');
        });
    });
}