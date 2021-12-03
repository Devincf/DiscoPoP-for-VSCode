import * as vscode from 'vscode';
import * as fs from 'fs';

import { exec } from 'child_process';
import { DiscoPoPViewProvider } from '../newdiscopop_webview_provider';
import { createFolderIfNotExist, getFiles } from '../misc/iomanip';

export function executeCUGenTask(discopopView: DiscoPoPViewProvider, ifiles?: string[], useMakefile: boolean = false) {
    //copy from scripts to folder
    console.log("executeCUGenTask");    
    if (useMakefile) {
        executeMakefile(discopopView);
    } else {
        executeNormal(discopopView, ifiles);
    }
    
}

function executeNormal(discopopView: DiscoPoPViewProvider, ifiles?: string[]) {
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

function executeMakefile(discopopView: DiscoPoPViewProvider) {
    const execStr = `python3 -m Makefile_Analyzer --target-project=${discopopView.folderPath} --target-makefile=${discopopView.folderPath}/Makefile --dp-path=${discopopView.discopopPath} --dp-build-path=${discopopView.buildPath} --exec-mode=cu_gen --clang-bin=clang-8 --clang++-bin=clang++-8 --llvm-link-bin=llvm-link-8`;
    //TODO: REMOVE AFTER FIX

    exec(execStr, { cwd: discopopView.discopopPath + "/discopop_makefile" }, (error, stdout, stderr) => {
        //create highlight for each obj
        const execStr = `make -f tmp_makefile.mk && ./out && cd ..`;
        exec(execStr, { cwd: discopopView.folderPath }, (error, stdout, stderr) => {
            vscode.window.showInformationMessage('Finished CU Generation using a Makefile');
            discopopView.stages[0]['cu_gen'] = 2;
        });
    });
}