import * as vscode from 'vscode';
import * as fs from 'fs';

import { exec } from 'child_process';
import { DiscoPoPViewProvider } from '../newnewdiscopop_webview_provider';
import { createFolderIfNotExist, getFiles } from '../misc/iomanip';
import { FileManager } from '../misc/filemanager';

export function executeRedOpTask(discopopView: DiscoPoPViewProvider, ifiles?: string[], showMessage: boolean = true, callback?: Function) {
    //copy from scripts to folder
    //console.log("executeDepProfTask");
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
    files.forEach(async (file, index) => {
        console.log(`Identifying reduction operations for file (${index}) ${file}`);
        let re = new RegExp(/[^\\\/]+(?=\.[\w]+$)|[^\\\/]+$/g);
        const outFileName = file.match(re)![0];
        const clang = vscode.workspace.getConfiguration("discopopvsc").get("clang");

        //let fileKey = Configuration.getFileUuid(file);
        let fileKey = FileManager.getFileId(file);
        
        createFolderIfNotExist(`${discopopView.folderPath}/discopop-tmp`);
        createFolderIfNotExist(`${discopopView.folderPath}/discopop-tmp/${fileKey}`);

        const execStr = `${clang} -g -O0 -S -emit-llvm -fno-discard-value-names -Xclang -load -Xclang ${discopopView.buildPath}/libi/LLVMDPReduction.so -mllvm -fm-path -mllvm ../FileMapping.txt -o ${outFileName}_red.bc ${file}`;
        //console.log(execStr);
        exec(execStr, { cwd: `${discopopView.folderPath}/discopop-tmp/${fileKey}`  }, (error, stdout, stderr) => {
            if (error) {
                //vscode.window.showErrorMessage(`Error during step 1 of identifying reduction operations in file ${outFileName}`);
                console.log(`error: ${error.message}`);
                discopopView.stages[0]['id_red_ops'] = 1;
                return;
            }
            const execStr = `${clang} ${outFileName}_red.bc -o ${outFileName}_dp_run_red -L${discopopView.buildPath}/rtlib -lDiscoPoP_RT -lpthread`;
            //console.log(execStr);
            exec(execStr, { cwd: `${discopopView.folderPath}/discopop-tmp/${fileKey}`  }, (error, stdout, stderr) => {
                if (error) {
                    //vscode.window.showErrorMessage(`Error during step 2 of identifying reduction operations in file ${outFileName}`);
                    console.log(`error: ${error.message}`);
                    discopopView.stages[0]['id_red_ops'] = 1;
                    return;
                }
                if (stderr) {
                    //vscode.window.showErrorMessage(`(std)Error during step 2 of identifying reduction operations in file ${outFileName}`);
                    console.log(`stderr: ${stderr}`);
                    discopopView.stages[0]['id_red_ops'] = 1;
                    return;
                }
                const execStr = `./${outFileName}_dp_run_red`;
                //console.log(execStr);
                exec(execStr, { cwd: `${discopopView.folderPath}/discopop-tmp/${fileKey}`  }, (error, stdout, stderr) => {
                    if(callback !== undefined){
                        callback.call(null,2);
                    }
                    if (error) {
                        //vscode.window.showErrorMessage(`Error during step 3 of identifying reduction operations in file ${outFileName}`);
                        console.log(`error: ${error.message}`);
                        discopopView.stages[0]['id_red_ops'] = 1;
                        return;
                    }
                    else if (stderr) {
                        //vscode.window.showErrorMessage(`(std)Error during step 3 of identifying reduction operations in file ${outFileName}`);
                        console.log(`stderr: ${stderr}`);
                        discopopView.stages[0]['id_red_ops'] = 1;
                        return;
                    }
                    else if(showMessage){
                        vscode.window.showInformationMessage('Finished identifying reduction operations');
                    }
    
                    discopopView.stages[0]['id_red_ops'] = 2;
                });
            });
        });
    });
}

function executeMakefile(discopopView: DiscoPoPViewProvider, showMessage: boolean, callback?: Function) {
    const execStr = `python3 -m Makefile_Analyzer --target-project=${discopopView.folderPath} --target-makefile=${discopopView.folderPath}/Makefile --dp-path=${discopopView.discopopPath} --dp-build-path=${discopopView.buildPath} --exec-mode=dp_red --clang-bin=clang-8 --clang++-bin=clang++-8 --llvm-link-bin=llvm-link-8`;
    //TODO: REMOVE AFTER FIX

    exec(execStr, { cwd: discopopView.discopopPath + "/discopop_makefile" }, (error, stdout, stderr) => {
        //create highlight for each obj
        const execStr = `make -j7 -f tmp_makefile.mk && ./out`;
        exec(execStr, { cwd: discopopView.folderPath }, (error, stdout, stderr) => {
            if(showMessage){
                vscode.window.showInformationMessage('Finished identifying reduction operations using a Makefile');
            }
            if(callback !== undefined){
                callback.call(null,2);
            }
            discopopView.stages[0]['id_red_ops'] = 2;
        });
    });
}