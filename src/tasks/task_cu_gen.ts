import * as vscode from 'vscode';
import * as fs from 'fs';

import { exec } from 'child_process';
import { DiscoPoPViewProvider } from '../newdiscopop_webview_provider';
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
        const execStr = `${clang} -g -O0 -fno-discard-value-names -Xclang -load -Xclang ${discopopView.buildPath}/libi/LLVMCUGeneration.so -mllvm -fm-path -mllvm ./FileMapping.txt -c ${file} -o ${outFileName}`;
        console.log(execStr);
        exec(execStr, { cwd: discopopView.folderPath + '/discopop-tmp' }, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Error generating CU for file ${outFileName}`);
                console.log(`error: ${error.message}`);
                discopopView.stages[0]['cu_gen'] = 1;
                return;
            }
            vscode.window.showInformationMessage('Finished CU Generation');
            discopopView.stages[0]['cu_gen'] = 2;
        });
    });
}