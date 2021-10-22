import * as vscode from 'vscode';
import * as fs from 'fs';

import {exec} from 'child_process';
import { DiscoPoPViewProvider } from '../newdiscopop_webview_provider';
import { createFolderIfNotExist, getFiles } from '../misc/iomanip';

export function executeDepProfTask(discopopView: DiscoPoPViewProvider, ifiles? : string[]){
    	//copy from scripts to folder
		console.log("executeDepProfTask");
        let files: string[] = [];
        if(ifiles === undefined){
            files = getFiles(discopopView.folderPath);
        }else{
            files = ifiles;
        }
        files.forEach(async (file, index) => {
            console.log(`Dependency Profiling for file (${index}) ${file}`);
            let re = new RegExp(discopopView.folderPath + "\/(.*)[\.]");
            const clang = vscode.workspace.getConfiguration("discopopvsc").get("clang");
            const outFileName = file.match(re)![1];
            createFolderIfNotExist(`${discopopView.folderPath}/discopop-tmp`);
            const execStr = `${clang} -g -O0 -S -emit-llvm -fno-discard-value-names -Xclang -load -Xclang ${discopopView.buildPath}/libi/LLVMDPInstrumentation.so -mllvm -fm-path -mllvm ./FileMapping.txt -o ${outFileName}_dp.ll ${file}`;
            console.log(execStr);
            exec(execStr, { cwd: discopopView.folderPath + '/discopop-tmp' }, (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(`Error during step 1 of identifying data dependencies in file ${outFileName}`);
                    console.log(`error: ${error.message}`);
                    discopopView.stages[0]['dep_prof'] = 1;
                    return;
                }
                const execStr = `${clang} ${outFileName}_dp.ll -o ${outFileName}_dp_run -L${discopopView.buildPath}/rtlib -lDiscoPoP_RT -lpthread`;
                console.log(execStr);
                exec(execStr, { cwd: discopopView.folderPath + '/discopop-tmp' }, (error, stdout, stderr) => {
                    if (error) {
                        vscode.window.showErrorMessage(`Error during step 2 of identifying data dependencies in file ${outFileName}`);
                        console.log(`error: ${error.message}`);
                        discopopView.stages[0]['dep_prof'] = 1;
                        return;
                    }
                    if (stderr) {
                        vscode.window.showErrorMessage(`(std)Error during step 2 of identifying data dependencies in file ${outFileName}`);
                        console.log(`stderr: ${stderr}`);
                        discopopView.stages[0]['dep_prof'] = 1;
                        return;
                    }
                    const execStr = `./${outFileName}_dp_run`;
                    console.log(execStr);
                    exec(execStr, { cwd: discopopView.folderPath + '/discopop-tmp' }, (error, stdout, stderr) => {
                        if (error) {
                            vscode.window.showErrorMessage(`Error during step 3 of identifying data dependencies in file ${outFileName}`);
                            console.log(`error: ${error.message}`);
                            discopopView.stages[0]['dep_prof'] = 1;
                            return;
                        }
                        if (stderr) {
                            vscode.window.showErrorMessage(`(std)Error during step 3 of identifying data dependencies in file ${outFileName}`);
                            console.log(`stderr: ${stderr}`);
                            discopopView.stages[0]['dep_prof'] = 1;
                            return;
                        }
                        vscode.window.showInformationMessage('Finished identifying data dependencies');
                        discopopView.stages[0]['dep_prof'] = 2;
                    });
                });
            });
        });
}