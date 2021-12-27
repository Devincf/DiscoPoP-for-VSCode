import * as vscode from 'vscode';
import * as fs from 'fs';

import { exec } from 'child_process';
import { DiscoPoPViewProvider } from '../newnewdiscopop_webview_provider';
import { createFolderIfNotExist, getFiles } from '../misc/iomanip';
import { FileManager } from '../misc/filemanager';

export function executeDepProfTask(discopopView: DiscoPoPViewProvider, ifiles?: string[], showMessage: boolean = true, callback?: Function) {
    //copy from scripts to folder
    //console.log("executeDepProfTask");
    if (discopopView.useMakefile) {
        executeMakefile(discopopView, showMessage, callback);
    } else {
        executeNormal(discopopView, ifiles,showMessage, callback);
    }
}

function executeNormal(discopopView: DiscoPoPViewProvider, ifiles?: string[], showMessage: boolean = true, callback?: Function) {
    let files: string[] = [];
    if (ifiles === undefined) {
        files = getFiles(discopopView.folderPath);
    } else {
        files = ifiles;
    }
    const buildPath = vscode.workspace.getConfiguration("discopopvsc").get("build_path");
    files.forEach(async (file, index) => {
        console.log(`Dependency Profiling for file (${index}) ${file}`);
        let re = new RegExp(/[^\\\/]+(?=\.[\w]+$)|[^\\\/]+$/g);
        const clang = vscode.workspace.getConfiguration("discopopvsc").get("clang");
        const outFileName = file.match(re)![0];

        //let fileKey = Configuration.getFileUuid(file);
        let fileKey = FileManager.getFileId(file);

        createFolderIfNotExist(`${discopopView.folderPath}/discopop-tmp`);
        createFolderIfNotExist(`${discopopView.folderPath}/discopop-tmp/${fileKey}`);
        
        const execStr = `${clang} -g -O0 -S -emit-llvm -fno-discard-value-names -Xclang -load -Xclang ${buildPath}/libi/LLVMDPInstrumentation.so -mllvm -fm-path -mllvm ../FileMapping.txt -o ${outFileName}_dp.ll ${file}`;
        //console.log(execStr);
        exec(execStr, { cwd: `${discopopView.folderPath}/discopop-tmp/${fileKey}` }, (error, stdout, stderr) => {
            if (error) {
                //vscode.window.showErrorMessage(`Error during step 1 of identifying data dependencies in file ${outFileName}`);
                console.log(`error: ${error.message}`);
                return;
            }
            const execStr = `${clang} ${outFileName}_dp.ll -o ${outFileName}_dp_run -L${buildPath}/rtlib -lDiscoPoP_RT -lpthread`;
            //console.log(execStr);
            exec(execStr, { cwd: `${discopopView.folderPath}/discopop-tmp/${fileKey}` }, (error, stdout, stderr) => {

                if (error) {
                    //vscode.window.showErrorMessage(`Error during step 2 of identifying data dependencies in file ${outFileName}`);
                    console.log(`error: ${error.message}`);
                    return;
                }
                else if (stderr) {
                    //vscode.window.showErrorMessage(`(std)Error during step 2 of identifying data dependencies in file ${outFileName}`);
                    console.log(`stderr: ${stderr}`);
                    return;
                }
                const execStr = `./${outFileName}_dp_run`;
                //console.log(execStr);
                exec(execStr, { cwd: `${discopopView.folderPath}/discopop-tmp/${fileKey}` }, (error, stdout, stderr) => {
                    if(callback !== undefined){
                        callback.call(null,2);
                    }
                    if (error) {
                        //vscode.window.showErrorMessage(`Error during step 3 of identifying data dependencies in file ${outFileName}`);
                        console.log(`error: ${error.message}`);
                        return;
                    }
                    else if (stderr) {
                        //vscode.window.showErrorMessage(`(std)Error during step 3 of identifying data dependencies in file ${outFileName}`);
                        console.log(`stderr: ${stderr}`);
                        return;
                    }
                    else if(showMessage){
                        vscode.window.showInformationMessage('Finished identifying data dependencies');
                    }
                });
            });
        });
    });
}
function executeMakefile(discopopView: DiscoPoPViewProvider, showMessage: boolean, callback?: Function)  {
    const discopopPath = vscode.workspace.getConfiguration("discopopvsc").get("path");
    const buildPath = vscode.workspace.getConfiguration("discopopvsc").get("build_path");
    const execStr = `python3 -m Makefile_Analyzer --target-project=${discopopView.folderPath} --target-makefile=${discopopView.folderPath}/Makefile --dp-path=${discopopPath} --dp-build-path=${buildPath} --exec-mode=dep --clang-bin=clang-8 --clang++-bin=clang++-8 --llvm-link-bin=llvm-link-8`;

    exec(execStr, { cwd: discopopPath + "/discopop_makefile" }, (error, stdout, stderr) => {
        //create highlight for each obj
        const execStr = `make -f tmp_makefile.mk && ./out && cd ..`;
        exec(execStr, { cwd: discopopView.folderPath }, (error, stdout, stderr) => {
            if(showMessage){
                vscode.window.showInformationMessage('Finished identifying data dependencies');
            }
            if(callback !== undefined){
                callback.call(null,2);
            }
        });
    });
}